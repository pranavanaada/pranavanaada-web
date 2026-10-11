-- Pranavanaada database setup.
-- Run this in your Supabase project's SQL editor (Project → SQL Editor → New query).
-- Safe to run again: it only adds what's missing and refreshes the security rules.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Admins — only emails listed here can change products, combos or read
--    enquiries. Logging in is not enough on its own.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists admins (
  email text primary key
);
insert into admins (email) values ('pranavanaadaa@gmail.com') on conflict do nothing;
alter table admins enable row level security; -- no policies: not readable through the API

-- True when the logged-in user's email is in the admins table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Products
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric not null default 0,       -- lowest ("from") price, kept in sync with variants
  category text not null check (category in ('hand-bell', 'hanging-bell', 'jayagante')),
  image text not null default '',         -- main photo URL
  thumb text,                             -- small version of the main photo for cards
  images jsonb not null default '[]',     -- extra gallery photo URLs
  variants jsonb not null default '[]',   -- [{ "label": "1 kg", "size": "9 in tall · 5 in wide", "price": 10000, "in_stock": true }]
  badge text,
  name_kn text,
  description_kn text,
  badge_kn text,
  in_stock boolean not null default true,
  featured boolean not null default false, -- shown on the home page
  sort_order integer not null default 0,   -- lower numbers first
  video text,                              -- short muted clip shown in the product gallery
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- Columns added after the first version — harmless if they already exist.
alter table products add column if not exists thumb text;
alter table products add column if not exists images jsonb not null default '[]';
alter table products add column if not exists variants jsonb not null default '[]';
alter table products add column if not exists badge text;
alter table products add column if not exists name_kn text;
alter table products add column if not exists description_kn text;
alter table products add column if not exists badge_kn text;
alter table products add column if not exists in_stock boolean not null default true;
alter table products add column if not exists featured boolean not null default false;
alter table products add column if not exists sort_order integer not null default 0;
alter table products add column if not exists video text;          -- short muted clip shown in the product gallery
alter table products add column if not exists spin jsonb not null default '[]'; -- lined-up photos for the 360° view (scripts/make-spin.mjs)

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Combo offers — a bundle of products at a special price
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists combos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_kn text,
  description text not null default '',
  description_kn text,
  image text,                             -- optional; otherwise the items' photos are shown
  items jsonb not null default '[]',      -- [{ "product_id": "…", "variant": "1 kg", "qty": 1 }]
  price numeric not null,                 -- combo price
  in_stock boolean not null default true,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Enquiries
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null,
  message text not null default '',
  product_name text,
  status text not null default 'new' check (status in ('new', 'read')),
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Security rules
-- ─────────────────────────────────────────────────────────────────────────────
alter table products enable row level security;
alter table combos enable row level security;
alter table inquiries enable row level security;

-- Remove rules from earlier versions (which allowed ANY logged-in user to edit).
drop policy if exists "Public can view visible products" on products;
drop policy if exists "Admins can view all products" on products;
drop policy if exists "Admins can insert products" on products;
drop policy if exists "Admins can update products" on products;
drop policy if exists "Admins can delete products" on products;
drop policy if exists "Anyone can submit an inquiry" on inquiries;
drop policy if exists "Admins can view inquiries" on inquiries;
drop policy if exists "Admins can update inquiries" on inquiries;
drop policy if exists "Admins can delete inquiries" on inquiries;
drop policy if exists "Public can view visible combos" on combos;
drop policy if exists "Admins can insert combos" on combos;
drop policy if exists "Admins can update combos" on combos;
drop policy if exists "Admins can delete combos" on combos;

-- Products: everyone sees visible ones; admins see and change everything.
create policy "Public can view visible products" on products
  for select using (is_visible = true or public.is_admin());
create policy "Admins can insert products" on products
  for insert to authenticated with check (public.is_admin());
create policy "Admins can update products" on products
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete products" on products
  for delete to authenticated using (public.is_admin());

-- Combos: same pattern.
create policy "Public can view visible combos" on combos
  for select using (is_visible = true or public.is_admin());
create policy "Admins can insert combos" on combos
  for insert to authenticated with check (public.is_admin());
create policy "Admins can update combos" on combos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete combos" on combos
  for delete to authenticated using (public.is_admin());

-- Enquiries: anyone can send one; only admins can read, update or delete them.
create policy "Anyone can submit an inquiry" on inquiries
  for insert to anon, authenticated with check (true);
create policy "Admins can view inquiries" on inquiries
  for select to authenticated using (public.is_admin());
create policy "Admins can update inquiries" on inquiries
  for update to authenticated using (public.is_admin());
create policy "Admins can delete inquiries" on inquiries
  for delete to authenticated using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5b. Store settings (one row) — checkout rules the admin can change
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists store_settings (
  id integer primary key default 1 check (id = 1),     -- always exactly one row
  cod_enabled boolean not null default true,          -- offer Cash / Pay on Delivery
  cod_max_total numeric not null default 25000,       -- COD only for orders up to this (0 = no limit)
  online_enabled boolean not null default true,       -- offer Pay Now (Razorpay)
  shipping_fee numeric not null default 0,            -- flat delivery charge per order
  free_shipping_above numeric not null default 0,     -- orders at/above this ship free (0 = never waive)
  min_delivery_days integer not null default 7,       -- earliest delivery date = today + this
  updated_at timestamptz not null default now()
);
insert into store_settings (id) values (1) on conflict do nothing;
alter table store_settings enable row level security;
drop policy if exists "Anyone can read store settings" on store_settings;
drop policy if exists "Admins can update store settings" on store_settings;
create policy "Anyone can read store settings" on store_settings for select using (true);
create policy "Admins can update store settings" on store_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5c. Orders — created ONLY by the `create-order` Edge Function, which
--     recalculates every price from the database (never trusts the browser).
-- ─────────────────────────────────────────────────────────────────────────────
create sequence if not exists order_number_seq start 1;

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique
    default ('PN-' || lpad(nextval('order_number_seq')::text, 5, '0')),

  -- Customer
  customer_name text not null,
  email text not null,
  phone text not null,
  alt_phone text,
  -- Delivery address
  address_line1 text not null,
  address_line2 text,
  landmark text,
  city text not null,
  state text not null,
  pincode text not null,
  address_type text,                                  -- 'home' | 'office' | 'temple' | 'other'
  preferred_delivery_date date,
  notes text,                                         -- delivery instructions / gift message
  gstin text,                                         -- optional, for business invoices
  language text,                                      -- 'en' | 'kn' — for replying

  -- What was ordered (snapshot at order time, prices from the database)
  items jsonb not null,
  subtotal numeric not null,
  shipping_fee numeric not null default 0,
  total numeric not null,

  -- Payment
  payment_method text not null check (payment_method in ('online', 'cod')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cod_pending', 'refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  paid_at timestamptz,

  -- Fulfilment (updated by the admin)
  status text not null default 'placed'
    check (status in ('awaiting_payment', 'placed', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  courier text,
  tracking_number text,
  admin_notes text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on orders (created_at desc);

-- Confirmation emails / WhatsApp: sent once per order; results logged for the admin.
alter table orders add column if not exists notified_at timestamptz;
alter table orders add column if not exists notifications jsonb not null default '[]';
alter table orders add column if not exists delivered_at timestamptz;   -- set when the admin marks it delivered (sales totals)
alter table orders add column if not exists delivery_from date;        -- expected delivery window: delivery_from … preferred_delivery_date (set from the address)

-- Order numbers PN-00001, PN-00002 … (restarted on 10 Oct 2026 after test orders were deleted).
-- Skips any number that's already used, e.g. orders kept from before the restart (PN-01007, PN-01008).
create or replace function public.next_order_number() returns text
language plpgsql as $$
declare n text;
begin
  loop
    n := 'PN-' || lpad(nextval('public.order_number_seq')::text, 5, '0');
    exit when not exists (select 1 from public.orders where order_number = n);
  end loop;
  return n;
end $$;
alter table orders alter column order_number set default public.next_order_number();

alter table orders enable row level security;
drop policy if exists "Admins can view orders" on orders;
drop policy if exists "Admins can update orders" on orders;
drop policy if exists "Admins can delete orders" on orders;
-- No insert policy: visitors can't write orders directly — only the Edge Function
-- (which uses the service role key) can.
create policy "Admins can view orders" on orders for select to authenticated using (public.is_admin());
create policy "Admins can update orders" on orders
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "Admins can delete orders" on orders for delete to authenticated using (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Storage bucket for product photos
--    If the insert errors, create it by hand: Storage → New bucket →
--    name: product-images → Public bucket: ON, then run the policies below.
-- ─────────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "Public can view product images" on storage.objects;
drop policy if exists "Admins can upload product images" on storage.objects;
drop policy if exists "Admins can update product images" on storage.objects;
drop policy if exists "Admins can delete product images" on storage.objects;

create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "Admins can upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can update product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and public.is_admin());
create policy "Admins can delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and public.is_admin());
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
