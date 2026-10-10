-- ─────────────────────────────────────────────────────────────────────────────
-- 5f. Customer order page, cancellations and returns (also in schema.sql)
-- ─────────────────────────────────────────────────────────────────────────────

-- Private link per order: /order/PN-00001?t=<access_token> — only sent to the customer
alter table orders add column if not exists access_token text;
update orders set access_token = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
  where access_token is null;
alter table orders alter column access_token
  set default replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
create unique index if not exists orders_access_token_key on orders (access_token);

alter table orders add column if not exists shipped_at timestamptz;      -- dispatched: customer can no longer cancel
alter table orders add column if not exists cancelled_at timestamptz;
alter table orders add column if not exists cancelled_by text;           -- 'customer' | 'admin'
alter table orders add column if not exists razorpay_refund_id text;     -- full refund when an online order is cancelled

-- Return / replacement requests (created only by the order-portal Edge Function)
create table if not exists return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  items jsonb not null,                       -- [{ index, name, variant, qty, unit_price }]
  reason text not null check (reason in ('damaged', 'defective')),
  details text not null,
  resolution text not null check (resolution in ('refund', 'replacement')),
  media jsonb not null default '[]',          -- paths in the private return-media bucket
  video_on_whatsapp boolean not null default false,
  refund_upi text,                            -- pay-on-delivery refunds: UPI ID or bank details
  amount numeric not null,                    -- value of the items (delivery charges aren't refunded)
  status text not null default 'requested'
    check (status in ('requested', 'approved', 'rejected', 'received', 'refunded', 'replaced')),
  admin_note text,                            -- shown to the customer (rejection reason, tracking, refund reference)
  razorpay_refund_id text,
  history jsonb not null default '[]',        -- [{ status, at, note }]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists return_requests_order_idx on return_requests (order_id);

alter table return_requests enable row level security;
drop policy if exists "Admins can view returns" on return_requests;
drop policy if exists "Admins can update returns" on return_requests;
drop policy if exists "Admins can delete returns" on return_requests;
create policy "Admins can view returns" on return_requests for select to authenticated using (public.is_admin());
create policy "Admins can update returns" on return_requests for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete returns" on return_requests for delete to authenticated using (public.is_admin());

-- Unboxing videos and photos: private bucket. Customers upload through one-time
-- signed links from the order-portal function; only admins can view.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('return-media', 'return-media', false, 52428800, array['video/*', 'image/*'])
on conflict (id) do update
  set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admins can view return media" on storage.objects;
create policy "Admins can view return media" on storage.objects for select to authenticated
  using (bucket_id = 'return-media' and public.is_admin());
