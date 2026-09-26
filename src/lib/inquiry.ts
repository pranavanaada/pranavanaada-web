import { isSupabaseConfigured } from './supabaseConfig';

export interface InquiryPayload {
  name: string;
  contact: string;
  message: string;
  productName?: string | null;
  language: string;
  /** Hidden spam-trap field — always empty for real visitors. */
  website?: string;
}

/**
 * Send an enquiry. Goes through the `submit-inquiry` Edge Function, which saves
 * it and emails the admin (and the customer, if they gave an email). If the
 * function isn't reachable, the enquiry is still saved directly so it's never lost.
 */
export async function submitInquiry(payload: InquiryPayload): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  const { supabase } = await import('./supabaseClient');

  const { error } = await supabase.functions.invoke('submit-inquiry', { body: { ...payload } });
  if (!error) return true;

  // Fallback: save without emails.
  if (payload.website) return true;
  const { error: insertError } = await supabase.from('inquiries').insert({
    name: payload.name,
    contact: payload.contact,
    message: payload.message,
    product_name: payload.productName || null,
    status: 'new',
  });
  return !insertError;
}
