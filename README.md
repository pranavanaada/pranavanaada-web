# Pranavanaada — Website (v2, fresh build)

React + TypeScript + Vite + Tailwind CSS, with a Supabase backend for the
admin panel (login, product CRUD, inquiries).

Design: dark emerald + gold ("Option B"), Cinzel (headings) / Outfit (body)
fonts carried over from the previous prototype, along with the WhatsApp
number, email, and i18next multi-language setup.

## 1. Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. **The public site works immediately** —
it falls back to the built-in sample catalog (`src/data/products.ts`, using
the real images and prices from the old prototype) until Supabase is
connected. Admin login will not work until you complete step 2.

## 2. Connect Supabase (needed for the admin panel)

Until this is done the public site shows the built-in catalogue and the admin
panel can't log in.

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste all of `supabase/schema.sql` → **Run**.
   This creates the `products`, `combos`, `inquiries` and `admins` tables,
   the security rules, and the `product-images` storage bucket. It's safe to
   run again after future updates.
3. **Project Settings → API** → copy the **Project URL** and **anon public
   key** into `.env.local` (copy `.env.example` if it doesn't exist).
4. Restart `npm run dev`.

### Create the admin account

1. **Authentication → Users → Add user → Create new user**
   - Email: `pranavanaadaa@gmail.com` (already on the admin allow-list in
     `schema.sql`)
   - Password: choose it here — it is deliberately **not** stored anywhere in
     this project
   - Tick **Auto Confirm User**
2. **Authentication → Sign In / Providers → Email** → turn **off** "Allow new
   users to sign up". Only the admin needs an account.
3. Log in at `/admin/login`.

To add another admin later: create their user as above, then in the SQL
editor run `insert into admins (email) values ('their@email.com');`.

### Make "Forgot password?" work

**Authentication → URL Configuration**:
- **Site URL**: your live domain, e.g. `https://pranavanaada.com`
- **Redirect URLs**: add `http://localhost:5173/admin/reset-password` and
  `https://YOUR-DOMAIN/admin/reset-password`

The reset email comes from Supabase's built-in mailer, which only sends a few
emails per hour and may land in spam. Before launch, set up your own email
under **Project Settings → Authentication → SMTP Settings** (e.g. Gmail,
Brevo, Resend) so reset emails arrive reliably.

### Load the current products

Open **Admin → Products** and click **Import starter catalogue**. This uploads
the 7 bells currently on the site (photos, weights, prices, Kannada text) so
you can edit them instead of re-typing everything.

### What the admin can do

- **Products**: add / edit / delete; multiple photos (upload, set main,
  reorder, remove — compressed automatically); weights with size and price;
  English + Kannada text; badge; in stock / out of stock for the whole product
  and for each weight; show / hide; feature on the home page; display order
- **Combo offers**: bundle products (with weight and quantity) at a special
  price; savings are calculated and shown to visitors
- **Inquiries**: new / handled filter, reply on WhatsApp or email, delete
- **Settings**: change password

Changes are saved to Supabase and appear for all visitors on their next page
load.

## Payments (Buy Now → Pay now / Pay on delivery)

How it works:
- The browser only sends **product ids, weights and quantities**. The
  `create-order` Edge Function looks up every price in the database, checks
  stock, applies the checkout rules (Admin → Settings) and saves the order —
  so nobody can change a price in their browser and pay less.
- **Pay on delivery** orders are saved straight away.
- **Pay now** creates a Razorpay order; the customer pays in Razorpay's
  window (UPI, cards, net banking, wallets). `verify-payment` checks
  Razorpay's signature before marking the order paid, and `razorpay-webhook`
  does the same server-to-server in case the customer closes the page.
- The Razorpay **secret key never goes into the website code** — it lives in
  Supabase secrets.

Setup:
1. Re-run `supabase/schema.sql` in the SQL editor (adds `orders` and
   `store_settings`).
2. Create a Razorpay account at [razorpay.com](https://razorpay.com). Test
   mode works immediately; live payments need KYC (business PAN, bank
   account) and a website with **Contact, Terms, Privacy, Refund/Cancellation
   and Shipping** policy pages.
3. Razorpay Dashboard → **Account & Settings → API Keys** → generate keys
   (start with **Test mode**).
4. Deploy the functions (PowerShell, from this folder):
   ```bash
   npx supabase login
   npx supabase link --project-ref qgmjfcioczdxglhwxwoi
   npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_xxx RAZORPAY_KEY_SECRET=xxx RAZORPAY_WEBHOOK_SECRET=choose-a-long-random-string
   npx supabase functions deploy create-order
   npx supabase functions deploy verify-payment
   npx supabase functions deploy razorpay-webhook --no-verify-jwt
   ```
   (If the CLI asks for a config file, run `npx supabase init` first.)
5. Razorpay Dashboard → **Webhooks → Add new webhook**
   - URL: `https://qgmjfcioczdxglhwxwoi.supabase.co/functions/v1/razorpay-webhook`
   - Secret: the same `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `payment.failed`, `order.paid`
6. Test with Razorpay's test UPI ID `success@razorpay` or test cards, then
   switch to live keys (repeat step 4's `secrets set`, and add the webhook in
   live mode too).

Pay on delivery only needs steps 1 and 4 (`create-order`). Until Razorpay is
ready, switch **Pay now** off in Admin → Settings.

## Order notifications (email + WhatsApp)

When an order is final — a Pay-on-delivery order is placed, or an online
payment is verified — the customer and the admin each get an **email** and a
**WhatsApp** message. Each is sent exactly once per order, and the result
("✓ Email → customer", "– WhatsApp → admin: skipped…") is shown on the order
in **Admin → Orders**. A channel is simply skipped until its keys are set, and
a failed message never blocks an order. Customers who ordered on the Kannada
site get the Kannada email.

Re-run `supabase/schema.sql` first (adds `notified_at` and `notifications`).

**Enquiries** (Enquire Now, the enquiry list, the Contact form) go through the
`submit-inquiry` function: it saves the enquiry, emails the admin (reply goes
straight to the customer when they gave an email), and sends the customer a
short acknowledgement if they gave an email address. A hidden spam-trap field
silently drops bot submissions. If the function is unreachable the enquiry is
still saved, just without emails.

### Email (Resend)

1. Sign up at [resend.com](https://resend.com) (free: 3,000 emails/month).
2. **Domains → Add domain** → your domain (e.g. `pranavanaada.com`) → add the
   DNS records it shows at your domain registrar → wait for **Verified**.
   (Without a verified domain Resend can only email your own address.)
3. **API Keys → Create API key** (Sending access).
4. Set the secrets (type them in your own terminal — don't paste keys in chat):
   ```bash
   npx supabase secrets set --project-ref qgmjfcioczdxglhwxwoi RESEND_API_KEY=re_xxx "EMAIL_FROM=Pranavanaada <orders@pranavanaada.com>" ADMIN_EMAIL=pranavanaadaa@gmail.com SITE_URL=https://pranavanaada.com
   ```
   No redeploy needed — functions read secrets on each run.

### WhatsApp (Meta WhatsApp Cloud API)

Automated WhatsApp messages must come from the official **WhatsApp Business
Platform**:

1. Create a **Meta Business** account and an app at
   [developers.facebook.com](https://developers.facebook.com) → add the
   **WhatsApp** product.
2. Add a business phone number. **It can't be a number that's currently used
   in the normal WhatsApp or WhatsApp Business app** — use a second number,
   or migrate the existing one (it then stops working in the app).
3. **WhatsApp Manager → Message templates → Create** two templates, category
   **Utility**:

   `order_confirmation` (English `en`; optionally a Kannada `kn` version with
   the same placeholders):
   > Namaste {{1}}, thank you for your order {{2}} with Pranavanaada.
   > Items: {{3}}. Total: {{4}} ({{5}}).
   > Preferred delivery: {{6}}. We will contact you to confirm the delivery date.

   `new_order_alert` (English):
   > New order {{1}} from {{2}} ({{3}}).
   > Items: {{4}}. Total: {{5}} – {{6}}.
   > Deliver to: {{7}}. Open the admin panel to manage it.

4. Create a **permanent access token** (Business Settings → System users →
   Generate token, with `whatsapp_business_messaging` permission) and note the
   **Phone number ID** (WhatsApp → API Setup).
5. Set the secrets:
   ```bash
   npx supabase secrets set --project-ref qgmjfcioczdxglhwxwoi WHATSAPP_TOKEN=xxx WHATSAPP_PHONE_NUMBER_ID=123456789 WHATSAPP_ADMIN_NUMBER=918050124365
   ```
   Optional: `WHATSAPP_TEMPLATE_CUSTOMER`, `WHATSAPP_TEMPLATE_ADMIN` (if you
   name the templates differently), `WHATSAPP_LANG_EN` (e.g. `en_US` if you
   created the template in US English), `WHATSAPP_LANG_KN`.

Easier alternative: providers such as Interakt, AiSensy or Wati handle the
Meta setup for a monthly fee; the sending code would then call their API
instead (small change in `supabase/functions/_shared/notify.ts`).

## 3. Deploy

This project deploys to Vercel the same way the previous prototype did:

```bash
npm run build   # outputs to dist/
```

1. Push this project to a GitHub repo (new or reuse `GanteWebsite`)
2. Import it in Vercel → set the same two environment variables
   (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) in Vercel's project
   settings
3. Deploy
4. Attach your domain: Vercel Project → **Settings → Domains** → add your
   domain and follow the DNS instructions (you said you've already
   purchased it, so this is just pointing DNS records)

## Project structure

```
src/
  components/     Navbar, Footer, ProductCard, InquiryModal, FloatingWhatsApp, ProtectedRoute
  pages/          Home, Shop, ProductDetail, About, Contact
  pages/admin/    AdminLogin, AdminLayout, AdminProducts, AdminProductForm, AdminInquiries
  hooks/          useAuth (Supabase session), useProducts (fetch + fallback)
  lib/            supabaseClient.ts
  data/           products.ts — local fallback catalog (real images/prices from old prototype)
  i18n/           i18n.ts — English strings; add more languages here
  config/         contact.ts — WhatsApp number + email
supabase/
  schema.sql      Run this once in your Supabase SQL editor
```

## What's intentionally left for you to fill in

- Real product photos/prices beyond the carried-over sample catalog
  (swap files in `src/assets/products/`, update `src/data/products.ts` or
  add via the admin panel once Supabase is live)
- Additional languages in `src/i18n/i18n.ts` + a language switcher in
  `Navbar.tsx` (English is wired up; the old prototype's other languages,
  if any, weren't found in the uploaded code — let Claude know if you have
  the translated strings)
- About page copy/photos (currently placeholder text)
- Admin sign-up flow (currently: create users directly in the Supabase
  dashboard)
