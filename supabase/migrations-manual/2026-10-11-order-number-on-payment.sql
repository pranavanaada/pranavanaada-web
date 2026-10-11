-- ─────────────────────────────────────────────────────────────────────────────
-- 5g. Online orders get their PN number only when the payment succeeds
-- ─────────────────────────────────────────────────────────────────────────────
-- While the customer is paying, the order carries a temporary reference (PAY-XXXXXX),
-- so abandoned or failed payments never use up order numbers. Called by verify-payment
-- and razorpay-webhook; does nothing if the order is already marked paid.
create or replace function public.mark_order_paid(p_rzp_order_id text, p_payment_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update orders
  set payment_status = 'paid',
      razorpay_payment_id = p_payment_id,
      paid_at = now(),
      status = 'placed',
      updated_at = now(),
      -- keep the temporary reference, in case the customer quotes it
      admin_notes = case when order_number like 'PAY-%'
        then concat_ws(E'\n', nullif(admin_notes, ''), 'Payment reference while paying: ' || order_number)
        else admin_notes end,
      order_number = case when order_number like 'PAY-%' then public.next_order_number() else order_number end
  where razorpay_order_id = p_rzp_order_id
    and payment_status <> 'paid';
end $$;
revoke execute on function public.mark_order_paid(text, text) from public, anon, authenticated;
grant execute on function public.mark_order_paid(text, text) to service_role;
