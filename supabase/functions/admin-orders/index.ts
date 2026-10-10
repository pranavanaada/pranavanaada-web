// admin-orders — order and return actions that need the server: they email the
// customer and/or move money through Razorpay. Only signed-in admins may call it.
//   order-status   → shipped / delivered (+ customer email)
//   order-cancel   → cancel; optionally refund an online payment in full
//   return-update  → approved / rejected / received / replaced (+ customer email)
//   return-refund  → online: Razorpay refund of the items; pay on delivery: record the UPI/bank payment
import { createClient } from 'npm:@supabase/supabase-js@2';
import { adminClient, corsHeaders, json } from '../_shared/common.ts';
import {
  emailCancelled,
  emailDelivered,
  emailReturnUpdate,
  emailShipped,
  historyEntry,
  inBackground,
  loadOrder,
  type Row,
} from '../_shared/orders.ts';
import { refundPayment } from '../_shared/razorpay.ts';

const clean = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** The caller must be signed in and on the admins list. */
async function isAdmin(req: Request) {
  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: auth } },
    auth: { persistSession: false },
  });
  const { data, error } = await client.rpc('is_admin');
  return !error && data === true;
}

// What happens next for each return status
const NEXT: Record<string, string[]> = {
  requested: ['approved', 'rejected'],
  approved: ['received', 'rejected'],
  received: ['replaced'], // refunds go through return-refund
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    if (!(await isAdmin(req))) return json({ error: 'not_admin' }, 403);
    const body = await req.json();
    const db = adminClient();
    const now = new Date().toISOString();

    switch (body.action) {
      case 'order-status': {
        const status = body.status === 'shipped' || body.status === 'delivered' ? body.status : null;
        const o = await loadOrder(db, { id: clean(body.orderId, 60) });
        if (!status || !o) return json({ error: 'bad_request' }, 400);
        const changes: Row = { status, updated_at: now };
        if (status === 'shipped') {
          changes.shipped_at = o.shipped_at ?? now;
          if (body.courier !== undefined) changes.courier = clean(body.courier, 80) || null;
          if (body.tracking !== undefined) changes.tracking_number = clean(body.tracking, 80) || null;
        } else {
          changes.delivered_at = o.status === 'delivered' && o.delivered_at ? o.delivered_at : now;
          changes.shipped_at = o.shipped_at ?? now;
          // Pay on delivery: delivered means the money was collected
          if (o.payment_method === 'cod' && o.payment_status === 'cod_pending' && body.codCollected !== false) {
            changes.payment_status = 'paid';
          }
        }
        const { data: updated, error } = await db.from('orders').update(changes).eq('id', o.id).select('*').single();
        if (error || !updated) throw error ?? new Error('update failed');
        if (o.status !== status && body.notify !== false) {
          await inBackground(status === 'shipped' ? emailShipped(updated) : emailDelivered(updated));
        }
        return json({ order: updated });
      }

      case 'order-cancel': {
        const o = await loadOrder(db, { id: clean(body.orderId, 60) });
        if (!o) return json({ error: 'bad_request' }, 400);
        if (o.status === 'cancelled') return json({ order: o });
        const changes: Row = { status: 'cancelled', cancelled_at: now, cancelled_by: 'admin', updated_at: now };
        let refund: 'started' | 'pending' | 'none' = 'none';
        if (body.refund === true && o.payment_method === 'online' && o.payment_status === 'paid' && o.razorpay_payment_id) {
          // Raises if Razorpay refuses — nothing is changed in that case
          changes.razorpay_refund_id = await refundPayment(o.razorpay_payment_id, Number(o.total), {
            order_number: o.order_number,
            reason: 'Cancelled by Pranavanaada',
          });
          changes.payment_status = 'refunded';
          refund = 'started';
        }
        const { data: updated, error } = await db.from('orders').update(changes).eq('id', o.id).select('*').single();
        if (error || !updated) throw error ?? new Error('update failed');
        if (body.notify !== false) await inBackground(emailCancelled(updated, refund, 'admin'));
        return json({ order: updated });
      }

      case 'return-update': {
        const { data: r } = await db.from('return_requests').select('*').eq('id', clean(body.returnId, 60)).maybeSingle();
        const status = clean(body.status, 20);
        if (!r) return json({ error: 'bad_request' }, 400);
        if (!(NEXT[r.status] ?? []).includes(status)) return json({ error: 'bad_transition', from: r.status, to: status }, 409);
        if (status === 'replaced' && r.resolution !== 'replacement') return json({ error: 'bad_transition' }, 409);
        const note = clean(body.note, 500) || null;
        if (status === 'rejected' && !note) return json({ error: 'note_required' }, 400);
        const { data: updated, error } = await db
          .from('return_requests')
          .update({
            status,
            admin_note: note ?? r.admin_note,
            history: [...(r.history ?? []), historyEntry(status, note)],
            updated_at: now,
          })
          .eq('id', r.id)
          .eq('status', r.status)
          .select('*')
          .maybeSingle();
        if (error || !updated) return json({ error: 'changed_meanwhile' }, 409);
        const o = await loadOrder(db, { id: r.order_id });
        if (o) await inBackground(emailReturnUpdate(o, updated));
        return json({ request: updated });
      }

      case 'return-refund': {
        const { data: r } = await db.from('return_requests').select('*').eq('id', clean(body.returnId, 60)).maybeSingle();
        if (!r) return json({ error: 'bad_request' }, 400);
        if (r.status !== 'received' || r.resolution !== 'refund') return json({ error: 'bad_transition' }, 409);
        const o = await loadOrder(db, { id: r.order_id });
        if (!o) return json({ error: 'bad_request' }, 400);

        const changes: Row = { status: 'refunded', updated_at: now };
        let note: string | null = clean(body.reference, 200) || null;
        if (o.payment_method === 'online' && o.razorpay_payment_id) {
          changes.razorpay_refund_id = await refundPayment(o.razorpay_payment_id, Number(r.amount), {
            order_number: o.order_number,
            reason: 'Return — damaged or defective',
          });
          note = null;
        } else if (!note) {
          return json({ error: 'reference_required' }, 400); // UPI / bank transaction reference
        }
        if (note) changes.admin_note = note;
        changes.history = [...(r.history ?? []), historyEntry('refunded', note ?? changes.razorpay_refund_id)];
        const { data: updated, error } = await db.from('return_requests').update(changes).eq('id', r.id).select('*').single();
        if (error || !updated) throw error ?? new Error('update failed');
        await inBackground(emailReturnUpdate(o, updated));
        return json({ request: updated });
      }

      default:
        return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error', detail: e instanceof Error ? e.message : String(e) }, 500);
  }
});
