// Admin actions that go through the admin-orders Edge Function (customer emails,
// Razorpay refunds). The signed-in admin's session is sent automatically.
import { supabase } from './supabaseClient';

export async function adminAction<T = Record<string, unknown>>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke('admin-orders', { body });
  if (error) {
    let payload: { error?: string; detail?: string } = {};
    try {
      payload = await (error as { context?: Response }).context?.json();
    } catch {
      // network error / function not deployed
    }
    throw new Error(payload?.detail || payload?.error || 'The request did not go through — please try again.');
  }
  return data as T;
}
