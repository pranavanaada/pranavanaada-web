import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Inquiry } from '../../types/product';

type Filter = 'new' | 'read' | 'all';

/** Indian mobile numbers → wa.me format (91XXXXXXXXXX); null if it isn't a phone number. */
function whatsappNumber(contact: string) {
  const digits = contact.replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  return null;
}

const isEmail = (contact: string) => /\S+@\S+\.\S+/.test(contact);

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('new');

  async function load() {
    const { data, error } = await supabase.from('inquiries').select('*').order('created_at', { ascending: false });
    if (error) {
      setErrorMsg('Could not load inquiries yet — check your Supabase setup in README.md.');
    } else {
      setInquiries((data || []) as Inquiry[]);
      setErrorMsg(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(inq: Inquiry, status: Inquiry['status']) {
    setInquiries((list) => list.map((x) => (x.id === inq.id ? { ...x, status } : x)));
    const { error } = await supabase.from('inquiries').update({ status }).eq('id', inq.id);
    if (error) {
      setErrorMsg(error.message);
      load();
    }
  }

  async function remove(inq: Inquiry) {
    if (!confirm(`Delete the enquiry from ${inq.name}?`)) return;
    setInquiries((list) => list.filter((x) => x.id !== inq.id));
    const { error } = await supabase.from('inquiries').delete().eq('id', inq.id);
    if (error) {
      setErrorMsg(error.message);
      load();
    }
  }

  const counts = {
    new: inquiries.filter((i) => i.status === 'new').length,
    read: inquiries.filter((i) => i.status === 'read').length,
    all: inquiries.length,
  };
  const shown = filter === 'all' ? inquiries : inquiries.filter((i) => i.status === filter);

  return (
    <div>
      <h1 className="font-heading text-gold text-2xl mb-4">Inquiries</h1>

      <div className="flex gap-2 mb-6">
        {(['new', 'read', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-sm px-4 py-1.5 rounded-full border ${
              filter === f ? 'bg-gold text-emerald-950 border-gold font-semibold' : 'border-emerald-700 text-cream/60'
            }`}
          >
            {f === 'new' ? 'New' : f === 'read' ? 'Handled' : 'All'} ({counts[f]})
          </button>
        ))}
      </div>

      {errorMsg && <p className="text-sm text-red-400 mb-4">{errorMsg}</p>}

      {loading ? (
        <p className="text-cream/50">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-cream/50">{filter === 'new' ? 'No new enquiries. 🙏' : 'Nothing here.'}</p>
      ) : (
        <div className="space-y-3">
          {shown.map((inq) => {
            const wa = whatsappNumber(inq.contact);
            return (
              <div
                key={inq.id}
                className={`border rounded-lg p-4 ${
                  inq.status === 'new' ? 'border-gold/50 bg-emerald-800/40' : 'border-emerald-800'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="font-medium">{inq.name}</span>
                    <span className="text-xs text-cream/40 ml-2">
                      {inq.created_at && new Date(inq.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {wa && (
                      <a
                        href={`https://wa.me/${wa}?text=${encodeURIComponent(`Namaste ${inq.name}, thank you for your enquiry with Pranavanaada.`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#25D366] hover:underline"
                      >
                        Reply on WhatsApp
                      </a>
                    )}
                    {isEmail(inq.contact) && (
                      <a
                        href={`mailto:${inq.contact}?subject=${encodeURIComponent('Your Pranavanaada enquiry')}`}
                        className="text-gold hover:underline"
                      >
                        Reply by email
                      </a>
                    )}
                    {inq.status === 'new' ? (
                      <button onClick={() => setStatus(inq, 'read')} className="text-gold hover:underline">
                        Mark handled
                      </button>
                    ) : (
                      <button onClick={() => setStatus(inq, 'new')} className="text-cream/50 hover:underline">
                        Mark as new
                      </button>
                    )}
                    <button onClick={() => remove(inq)} className="text-red-400 hover:underline">
                      Delete
                    </button>
                  </div>
                </div>
                <div className="text-xs text-cream/50 mb-2">
                  {inq.contact} {inq.product_name ? `· Re: ${inq.product_name}` : ''}
                </div>
                {/* pre-line keeps the itemised list from multi-product enquiries readable */}
                <p className="text-sm text-cream/70 whitespace-pre-line">{inq.message}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
