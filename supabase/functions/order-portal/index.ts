// order-portal — the customer's order page (/order/PN-00001?t=…). No login: the private
// token in the link (sent only in the customer's emails) proves it's their order.
//   get            → order, return requests, what they can do now
//   cancel         → before dispatch; online payments are refunded in full straight away
//   upload-urls    → one-time links to upload the unboxing video / photos (private bucket)
//   request-return → damaged / defective, within 3 days of delivery
import { adminClient, corsHeaders, json, safeEqual } from '../_shared/common.ts';
import {
  canCancel,
  canReturn,
  emailCancelled,
  emailReturnRequested,
  historyEntry,
  inBackground,
  loadOrder,
  returnDeadline,
  type Row,
} from '../_shared/orders.ts';
import { refundPayment } from '../_shared/razorpay.ts';

const BUCKET = 'return-media';
const MAX_FILES = 6;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

const clean = (v: unknown, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** What the customer may see about their order. */
function publicOrder(o: Row) {
  const deadline = returnDeadline(o);
  return {
    order_number: o.order_number,
    customer_name: o.customer_name,
    phone: o.phone,
    email: o.email,
    address_line1: o.address_line1,
    address_line2: o.address_line2,
    landmark: o.landmark,
    city: o.city,
    state: o.state,
    pincode: o.pincode,
    items: o.items,
    subtotal: o.subtotal,
    shipping_fee: o.shipping_fee,
    total: o.total,
    payment_method: o.payment_method,
    payment_status: o.payment_status,
    status: o.status,
    created_at: o.created_at,
    delivery_from: o.delivery_from,
    preferred_delivery_date: o.preferred_delivery_date,
    shipped_at: o.shipped_at,
    delivered_at: o.delivered_at,
    cancelled_at: o.cancelled_at,
    courier: o.courier,
    tracking_number: o.tracking_number,
    return_until: deadline?.toISOString() ?? null,
    can_cancel: canCancel(o),
    can_return: canReturn(o),
  };
}

const publicReturn = (r: Row) => ({
  id: r.id,
  created_at: r.created_at,
  items: r.items,
  reason: r.reason,
  resolution: r.resolution,
  amount: r.amount,
  status: r.status,
  // Notes are written for the customer (rejection reason, tracking, refund reference)
  note: r.admin_note,
  history: r.history,
});

async function view(db: ReturnType<typeof adminClient>, o: Row) {
  const { data: returns } = await db.from('return_requests').select('*').eq('order_id', o.id).order('created_at');
  return { order: publicOrder(o), returns: (returns ?? []).map(publicReturn) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const db = adminClient();
    const o = await loadOrder(db, { number: clean(body.number, 20) });
    // Same answer for a wrong number and a wrong token, so order numbers can't be probed
    if (!o || !o.access_token || !safeEqual(String(o.access_token), clean(body.token, 100))) {
      return json({ error: 'not_found' }, 404);
    }

    switch (body.action) {
      case 'get':
        return json(await view(db, o));

      case 'cancel': {
        if (!canCancel(o)) return json({ error: 'cannot_cancel' }, 409);
        const now = new Date().toISOString();
        // Only if it's still not dispatched (the admin may be updating it at the same moment)
        const { data: cancelled } = await db
          .from('orders')
          .update({ status: 'cancelled', cancelled_at: now, cancelled_by: 'customer', updated_at: now })
          .eq('id', o.id)
          .in('status', ['placed', 'confirmed'])
          .select('*')
          .maybeSingle();
        if (!cancelled) return json({ error: 'cannot_cancel' }, 409);

        let refund: 'started' | 'pending' | 'none' = 'none';
        if (o.payment_method === 'online' && o.payment_status === 'paid' && o.razorpay_payment_id) {
          try {
            const refundId = await refundPayment(o.razorpay_payment_id, Number(o.total), {
              order_number: o.order_number,
              reason: 'Cancelled by customer before dispatch',
            });
            await db.from('orders').update({ payment_status: 'refunded', razorpay_refund_id: refundId }).eq('id', o.id);
            cancelled.payment_status = 'refunded';
            refund = 'started';
          } catch (e) {
            console.error('cancel refund failed', o.order_number, e);
            await db
              .from('orders')
              .update({ admin_notes: `${o.admin_notes ? o.admin_notes + '\n' : ''}Automatic refund failed: ${(e as Error).message}` })
              .eq('id', o.id);
            refund = 'pending';
          }
        }
        await inBackground(emailCancelled(cancelled, refund, 'customer'));
        return json({ ...(await view(db, cancelled)), refund });
      }

      case 'upload-urls': {
        if (!canReturn(o)) return json({ error: 'window_closed' }, 409);
        const files: { type?: string; size?: number }[] = Array.isArray(body.files) ? body.files.slice(0, MAX_FILES) : [];
        if (!files.length) return json({ error: 'no_files' }, 400);
        const out = [];
        for (const f of files) {
          const type = clean(f.type, 80);
          const video = type.startsWith('video/');
          if (!video && !type.startsWith('image/')) return json({ error: 'bad_type' }, 400);
          if (!(Number(f.size) > 0) || Number(f.size) > (video ? MAX_VIDEO_BYTES : MAX_PHOTO_BYTES)) {
            return json({ error: video ? 'video_too_large' : 'photo_too_large' }, 400);
          }
          const ext = (type.split('/')[1] || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 6) || 'bin';
          const path = `${o.id}/${crypto.randomUUID()}.${ext}`;
          const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
          if (error || !data) throw error ?? new Error('Could not create upload link');
          out.push({ path, url: data.signedUrl });
        }
        return json({ uploads: out });
      }

      case 'request-return': {
        if (!canReturn(o)) return json({ error: 'window_closed' }, 409);

        const reason = body.reason === 'damaged' || body.reason === 'defective' ? body.reason : null;
        const resolution = body.resolution === 'refund' || body.resolution === 'replacement' ? body.resolution : null;
        const details = clean(body.details, 2000);
        const videoOnWhatsApp = body.videoOnWhatsApp === true;
        const refundUpi = clean(body.refundUpi, 200);
        const media: string[] = Array.isArray(body.media) ? body.media.filter((p: unknown) => typeof p === 'string').slice(0, MAX_FILES) : [];
        const fields: string[] = [];
        if (!reason) fields.push('reason');
        if (!resolution) fields.push('resolution');
        if (details.length < 10) fields.push('details');
        if (resolution === 'refund' && o.payment_method === 'cod' && refundUpi.length < 5) fields.push('refundUpi');

        // Items: index into the order, and no more than what's left after earlier requests
        const { data: earlier } = await db.from('return_requests').select('items, status').eq('order_id', o.id);
        const already = new Map<number, number>();
        for (const r of earlier ?? []) {
          if (r.status === 'rejected') continue;
          for (const it of r.items ?? []) already.set(it.index, (already.get(it.index) ?? 0) + Number(it.qty));
        }
        const picked: Row[] = [];
        for (const it of Array.isArray(body.items) ? body.items : []) {
          const index = Number(it?.index);
          const qty = Math.floor(Number(it?.qty));
          const line = o.items?.[index];
          if (!line || !(qty > 0) || qty > Number(line.qty) - (already.get(index) ?? 0)) return json({ error: 'bad_items' }, 400);
          picked.push({ index, name: line.name, variant: line.variant ?? null, qty, unit_price: Number(line.unit_price) });
        }
        if (!picked.length) fields.push('items');

        // Files must be ones uploaded for this order; an unboxing video is required unless it's coming on WhatsApp
        const { data: stored } = await db.storage.from(BUCKET).list(o.id, { limit: 100 });
        const storedNames = new Map((stored ?? []).map((f) => [f.name, f.metadata?.mimetype as string | undefined]));
        const files = media.filter((p) => p.startsWith(`${o.id}/`) && storedNames.has(p.slice(o.id.length + 1)));
        const hasVideo = files.some((p) => (storedNames.get(p.slice(o.id.length + 1)) ?? '').startsWith('video/'));
        if (!hasVideo && !videoOnWhatsApp) fields.push('video');

        if (fields.length) return json({ error: 'invalid_details', fields }, 400);

        const amount = picked.reduce((t, it) => t + it.unit_price * it.qty, 0);
        const { data: created, error } = await db
          .from('return_requests')
          .insert({
            order_id: o.id,
            items: picked,
            reason,
            details,
            resolution,
            media: files,
            video_on_whatsapp: videoOnWhatsApp && !hasVideo,
            refund_upi: o.payment_method === 'cod' && resolution === 'refund' ? refundUpi : null,
            amount,
            history: [historyEntry('requested')],
          })
          .select('*')
          .single();
        if (error || !created) throw error ?? new Error('Could not save request');

        await inBackground(emailReturnRequested(o, created));
        return json(await view(db, o));
      }

      default:
        return json({ error: 'unknown_action' }, 400);
    }
  } catch (e) {
    console.error(e);
    return json({ error: 'server_error' }, 500);
  }
});
