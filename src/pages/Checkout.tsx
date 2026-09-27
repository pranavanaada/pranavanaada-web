import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { useCart, itemLabel } from '../hooks/useCart';
import { formatINR, sizeLabel } from '../lib/productUtils';
import { WHATSAPP_WA_LINK } from '../config/contact';
import { describeItems } from '../hooks/useCart';
import {
  CheckoutError,
  DEFAULT_SETTINGS,
  INDIAN_STATES,
  createOrder,
  earliestDeliveryDate,
  fetchStoreSettings,
  loadRazorpay,
  loadSavedDetails,
  openRazorpay,
  rememberOrder,
  saveDetails,
  shippingFor,
  toOrderLines,
  verifyPayment,
  type CheckoutCustomer,
  type PaymentMethod,
  type StoreSettings,
} from '../lib/checkout';
import { useSeo } from '../lib/seo';

const EMPTY: CheckoutCustomer = {
  name: '',
  email: '',
  phone: '',
  altPhone: '',
  address1: '',
  address2: '',
  landmark: '',
  city: '',
  state: 'Karnataka',
  pincode: '',
  addressType: 'home',
  deliveryDate: '',
  notes: '',
  gstin: '',
};

type Field = 'name' | 'email' | 'phone' | 'address' | 'city' | 'state' | 'pincode' | 'gstin' | 'deliveryDate';

const inputBase =
  'w-full bg-emerald-950 border rounded-md px-3 py-2.5 text-sm outline-none transition-colors focus:border-neela-light focus:ring-2 focus:ring-neela/40';

/** Same rules as the create-order function, so most mistakes are caught before sending. */
function validate(c: CheckoutCustomer, earliest: string): Field[] {
  const bad: Field[] = [];
  if (c.name.trim().length < 2) bad.push('name');
  if (!/^\S+@\S+\.\S+$/.test(c.email.trim())) bad.push('email');
  if (!/^(\+?91)?[6-9]\d{9}$/.test(c.phone.replace(/[^\d+]/g, ''))) bad.push('phone');
  if (c.address1.trim().length < 5) bad.push('address');
  if (!c.city.trim()) bad.push('city');
  if (!c.state) bad.push('state');
  if (!/^[1-9]\d{5}$/.test(c.pincode.trim())) bad.push('pincode');
  if (c.gstin.trim() && !/^[0-9A-Z]{15}$/i.test(c.gstin.trim())) bad.push('gstin');
  if (!c.deliveryDate || c.deliveryDate < earliest) bad.push('deliveryDate');
  return bad;
}

export default function Checkout() {
  useSeo({ title: 'Checkout | Pranavanaada', path: '/checkout', noindex: true });
  const { t, lang } = useLang();
  const cart = useCart();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [customer, setCustomer] = useState<CheckoutCustomer>(() => ({ ...EMPTY, ...loadSavedDetails() }));
  const [method, setMethod] = useState<PaymentMethod>('online');
  const [errors, setErrors] = useState<Field[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showGst, setShowGst] = useState(!!customer.gstin);
  // A saved online order waiting for payment (after cancel/failure) — retry reuses it.
  const [pending, setPending] = useState<{ key: string; orderId: string; amount: number; orderNumber: string } | null>(null);
  // A started-but-unpaid online order is for the list as it was; if the list changes, the next
  // "Place order" creates a fresh order instead of retrying the old amount.
  useEffect(() => setPending(null), [cart.items]);

  useEffect(() => {
    fetchStoreSettings().then(setSettings);
  }, []);

  const earliest = earliestDeliveryDate(settings.min_delivery_days);
  const subtotal = cart.total;
  const shipping = shippingFor(subtotal, settings);
  const total = subtotal + shipping;
  const codAllowed = settings.cod_enabled && (settings.cod_max_total <= 0 || total <= settings.cod_max_total);
  const onlineAllowed = settings.online_enabled;

  // Keep the chosen method valid as settings load / cart changes.
  useEffect(() => {
    if (method === 'cod' && !codAllowed && onlineAllowed) setMethod('online');
    if (method === 'online' && !onlineAllowed && codAllowed) setMethod('cod');
  }, [method, codAllowed, onlineAllowed]);

  const set = <K extends keyof CheckoutCustomer>(k: K) => (e: { target: { value: string } }) =>
    setCustomer((c) => ({ ...c, [k]: e.target.value }));

  const fieldClass = (f: Field) => `${inputBase} ${errors.includes(f) ? 'border-red-400' : 'border-emerald-700'}`;
  const errorText: Record<Field, string> = {
    name: t('errName'),
    email: t('errEmail'),
    phone: t('errPhone'),
    address: t('errAddress'),
    city: t('errCity'),
    state: t('errState'),
    pincode: t('errPincode'),
    gstin: t('errGstin'),
    deliveryDate: t('errDeliveryDate', { date: new Date(`${earliest}T00:00:00`).toLocaleDateString('en-IN', { dateStyle: 'medium' }) }),
  };
  const FieldError = ({ f }: { f: Field }) =>
    errors.includes(f) ? <p className="text-xs text-red-400 mt-1">{errorText[f]}</p> : null;

  const whatsappFallback = useMemo(
    () => WHATSAPP_WA_LINK(`${t('waListIntro')}\n\n${describeItems(cart.items, lang, t('estimatedTotal'))}`),
    [cart.items, lang, t]
  );

  function finish(order: Parameters<typeof rememberOrder>[0]) {
    rememberOrder(order);
    cart.clear();
    navigate(`/order-confirmed`, { replace: true });
  }

  async function pay(p: { key: string; orderId: string; amount: number; orderNumber: string }) {
    await loadRazorpay();
    const res = await openRazorpay({ ...p, customer });
    try {
      const { order } = await verifyPayment(res);
      finish(order);
    } catch {
      // The webhook will still record the payment; tell the customer calmly.
      setPending(null);
      cart.clear();
      setMessage(t('coVerifyFailed', { number: p.orderNumber }));
    }
  }

  function explain(e: unknown, orderNumber?: string) {
    if (!(e instanceof CheckoutError)) return setMessage(t('coErrServer'));
    switch (e.code) {
      case 'invalid_details':
        setErrors((e.details.fields as Field[]) ?? []);
        return setMessage(t('coFixFields'));
      case 'unavailable': {
        // The server reports ids or names; show the names customers see in their cart.
        const names = ((e.details.items as string[]) ?? []).map((ref) => {
          const item = cart.items.find((i) => i.id === ref || i.name === ref);
          return item ? itemLabel(item, lang) : ref;
        });
        return setMessage(t('coErrUnavailable', { items: names.join(', ') }));
      }
      case 'cod_not_allowed':
        setMethod('online');
        return setMessage(t('coErrCod'));
      case 'not_setup':
        return setMessage(t('coErrNotSetup'));
      case 'payment_cancelled':
        return setMessage(t('coPaymentCancelled', { number: orderNumber }));
      case 'payment_failed':
        return setMessage(t('coPaymentFailed', { number: orderNumber, reason: String(e.details.reason || '—') }));
      default:
        return setMessage(t('coErrServer'));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const bad = validate(customer, earliest);
    setErrors(bad);
    if (bad.length) {
      setMessage(t('coFixFields'));
      document.querySelector('[data-first-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    saveDetails(customer);
    setBusy(true);
    let orderNumber: string | undefined;
    try {
      if (pending && method === 'online') {
        orderNumber = pending.orderNumber;
        await pay(pending);
        return;
      }
      const res = await createOrder({
        items: toOrderLines(cart.items),
        customer: { ...customer, language: lang },
        paymentMethod: method,
      });
      if (res.order) return finish(res.order); // Pay on delivery
      if (res.razorpay && res.order_number) {
        orderNumber = res.order_number;
        const p = {
          key: res.razorpay.key,
          orderId: res.razorpay.order_id,
          amount: res.razorpay.amount,
          orderNumber: res.order_number,
        };
        setPending(p);
        await pay(p);
      }
    } catch (err) {
      explain(err, orderNumber);
    } finally {
      setBusy(false);
    }
  }

  if (cart.items.length === 0 && !message) {
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center">
        <p className="text-cream/60 mb-6">{t('coEmpty')}</p>
        <Link to="/shop" className="border border-gold text-gold text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-md">
          {t('exploreCollection')}
        </Link>
      </div>
    );
  }

  const firstError = errors[0];
  const cardClass = 'rounded-xl border border-emerald-700 bg-emerald-800/30 p-5 md:p-6';
  const label = 'block text-xs text-cream/55 mb-1';

  return (
    <div className="max-w-6xl mx-auto px-5 py-12">
      <h1 className="font-heading text-gold text-3xl">{t('coTitle')}</h1>
      <TempleBand className="w-28 mt-3 mb-8" />

      <form onSubmit={handleSubmit} noValidate className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
        <div className="space-y-6">
          {/* Contact */}
          <section className={cardClass}>
            <StepTitle n={1}>{t('coContact')}</StepTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2" data-first-error={firstError === 'name' || undefined}>
                <label className={label}>{t('coFullName')}</label>
                <input autoComplete="name" value={customer.name} onChange={set('name')} className={fieldClass('name')} />
                <FieldError f="name" />
              </div>
              <div data-first-error={firstError === 'phone' || undefined}>
                <label className={label}>{t('coPhone')}</label>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="98xxxxxxxx"
                  value={customer.phone}
                  onChange={set('phone')}
                  className={fieldClass('phone')}
                />
                <FieldError f="phone" />
              </div>
              <div>
                <label className={label}>{t('coAltPhone')}</label>
                <input type="tel" inputMode="tel" value={customer.altPhone} onChange={set('altPhone')} className={`${inputBase} border-emerald-700`} />
              </div>
              <div className="sm:col-span-2" data-first-error={firstError === 'email' || undefined}>
                <label className={label}>{t('coEmail')}</label>
                <input type="email" autoComplete="email" value={customer.email} onChange={set('email')} className={fieldClass('email')} />
                <FieldError f="email" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className={cardClass}>
            <StepTitle n={2}>{t('coAddress')}</StepTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2" data-first-error={firstError === 'address' || undefined}>
                <label className={label}>{t('coAddress1')}</label>
                <input autoComplete="address-line1" value={customer.address1} onChange={set('address1')} className={fieldClass('address')} />
                <FieldError f="address" />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>{t('coAddress2')}</label>
                <input autoComplete="address-line2" value={customer.address2} onChange={set('address2')} className={`${inputBase} border-emerald-700`} />
              </div>
              <div>
                <label className={label}>{t('coLandmark')}</label>
                <input value={customer.landmark} onChange={set('landmark')} className={`${inputBase} border-emerald-700`} />
              </div>
              <div data-first-error={firstError === 'city' || undefined}>
                <label className={label}>{t('coCity')}</label>
                <input autoComplete="address-level2" value={customer.city} onChange={set('city')} className={fieldClass('city')} />
                <FieldError f="city" />
              </div>
              <div data-first-error={firstError === 'state' || undefined}>
                <label className={label}>{t('coState')}</label>
                <select autoComplete="address-level1" value={customer.state} onChange={set('state')} className={fieldClass('state')}>
                  <option value="">{t('coSelectState')}</option>
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <FieldError f="state" />
              </div>
              <div data-first-error={firstError === 'pincode' || undefined}>
                <label className={label}>{t('coPincode')}</label>
                <input
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={6}
                  value={customer.pincode}
                  onChange={(e) => setCustomer((c) => ({ ...c, pincode: e.target.value.replace(/\D/g, '') }))}
                  className={fieldClass('pincode')}
                />
                <FieldError f="pincode" />
              </div>
              <div className="sm:col-span-2">
                <span className={label}>{t('coAddressType')}</span>
                <div className="flex flex-wrap gap-2">
                  {(['home', 'office', 'temple', 'other'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCustomer((c) => ({ ...c, addressType: type }))}
                      className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                        customer.addressType === type ? 'bg-gold text-emerald-950 border-gold font-semibold' : 'border-emerald-700 text-cream/60'
                      }`}
                    >
                      {t(`co${type[0].toUpperCase()}${type.slice(1)}`)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Delivery */}
          <section className={cardClass}>
            <StepTitle n={3}>{t('coDelivery')}</StepTitle>
            <div className="space-y-4">
              <div className="max-w-xs" data-first-error={firstError === 'deliveryDate' || undefined}>
                <label className={label}>{t('coDeliveryDate')}</label>
                <input
                  type="date"
                  min={earliest}
                  value={customer.deliveryDate}
                  onChange={set('deliveryDate')}
                  className={`${fieldClass('deliveryDate')} [color-scheme:dark]`}
                />
                <FieldError f="deliveryDate" />
              </div>
              <p className="text-xs text-cream/45">{t('coDeliveryHint', { days: settings.min_delivery_days })}</p>
              <div>
                <label className={label}>{t('coNotes')}</label>
                <textarea rows={2} value={customer.notes} onChange={set('notes')} className={`${inputBase} border-emerald-700 resize-y`} />
              </div>
              {showGst ? (
                <div className="max-w-xs" data-first-error={firstError === 'gstin' || undefined}>
                  <label className={label}>{t('coGstin')}</label>
                  <input
                    maxLength={15}
                    value={customer.gstin}
                    onChange={(e) => setCustomer((c) => ({ ...c, gstin: e.target.value.toUpperCase() }))}
                    className={fieldClass('gstin')}
                  />
                  <FieldError f="gstin" />
                </div>
              ) : (
                <button type="button" onClick={() => setShowGst(true)} className="text-xs text-gold hover:underline">
                  + {t('coGst')}
                </button>
              )}
            </div>
          </section>

          {/* Payment */}
          <section className={cardClass}>
            <StepTitle n={4}>{t('coPayment')}</StepTitle>
            <div role="radiogroup" className="grid sm:grid-cols-2 gap-3">
              {(
                [
                  { key: 'online', title: t('coPayNow'), hint: t('coPayNowHint'), enabled: onlineAllowed, icon: '💳', tone: 'neela' },
                  {
                    key: 'cod',
                    title: t('coCod'),
                    hint: codAllowed
                      ? t('coCodHint')
                      : settings.cod_enabled
                        ? t('coCodOver', { amount: formatINR(settings.cod_max_total) })
                        : t('coUnavailable'),
                    enabled: codAllowed,
                    icon: '🚚',
                    tone: 'kumkum',
                  },
                ] as const
              ).map((m) => {
                const active = method === m.key;
                const tone = PAY_TONES[m.tone];
                return (
                  <button
                    key={m.key}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={!m.enabled}
                    onClick={() => setMethod(m.key)}
                    className={`relative text-left rounded-xl border p-4 transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                      active ? tone.active : `border-emerald-700 ${tone.hover}`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${active ? tone.ring : 'border-cream/40'}`}
                      >
                        {active && <span className={`w-2 h-2 rounded-full ${tone.dot}`} />}
                      </span>
                      <span className="text-cream font-medium">
                        {m.icon} {m.title}
                      </span>
                    </div>
                    <div className="text-xs text-cream/55 pl-6">{m.hint}</div>
                  </button>
                );
              })}
            </div>
            {method === 'online' && <p className="text-[11px] text-neela-light/80 mt-3">🔒 {t('coSecure')}</p>}
          </section>
        </div>

        {/* Summary */}
        <aside className={`${cardClass} relative overflow-hidden lg:sticky lg:top-24`}>
          <TempleBand className="absolute inset-x-0 top-0 rounded-none" />
          <h2 className="font-heading text-cream text-lg mb-4">{t('coSummary')}</h2>
          <ul className="space-y-3 mb-4 max-h-[40vh] overflow-y-auto pr-1">
            {cart.items.map((i) => (
              <li key={i.key} className="flex gap-3">
                <img src={i.thumb} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />
                <div className="flex-1 min-w-0 text-sm">
                  <div className="text-cream/85 leading-snug">{itemLabel(i, lang)}</div>
                  {i.size && <div className="text-[11px] text-cream/40">{sizeLabel(i.size, lang)}</div>}
                  {i.combo && (
                    <div className="text-[11px] text-cream/40">{lang === 'kn' ? i.combo.includes_kn : i.combo.includes}</div>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center rounded-md border border-emerald-700">
                      <button
                        type="button"
                        onClick={() => cart.setQty(i.key, i.qty - 1)}
                        disabled={busy || i.qty <= 1}
                        aria-label={t('decreaseQty')}
                        className="w-8 h-8 text-cream/70 hover:text-gold disabled:opacity-30 transition-colors"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-xs text-cream" aria-live="polite">
                        {i.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => cart.setQty(i.key, i.qty + 1)}
                        disabled={busy}
                        aria-label={t('increaseQty')}
                        className="w-8 h-8 text-cream/70 hover:text-gold disabled:opacity-30 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => cart.remove(i.key)}
                      disabled={busy}
                      aria-label={t('removeItem', { name: itemLabel(i, lang) })}
                      className="text-xs text-kumkum-light hover:underline underline-offset-4 disabled:opacity-40"
                    >
                      {t('remove')}
                    </button>
                  </div>
                </div>
                <div className="text-sm text-cream/80 shrink-0">{formatINR(i.price * i.qty)}</div>
              </li>
            ))}
          </ul>
          <dl className="space-y-1.5 text-sm border-t border-emerald-700 pt-3">
            <div className="flex justify-between">
              <dt className="text-cream/60">{t('coSubtotal')}</dt>
              <dd>{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream/60">{t('coShipping')}</dt>
              <dd className={shipping === 0 ? 'text-gold' : ''}>{shipping === 0 ? t('coFree') : formatINR(shipping)}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-emerald-700 pt-2 mt-2">
              <dt>{t('coTotal')}</dt>
              <dd className="text-gold">{formatINR(total)}</dd>
            </div>
          </dl>

          <AnimatePresence>
            {message && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                role="alert"
                className="text-xs text-red-300 bg-red-400/10 border border-red-400/30 rounded-md p-3 mt-4"
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={busy || cart.items.length === 0 || (!codAllowed && !onlineAllowed)}
            whileTap={{ scale: 0.98 }}
            className="w-full mt-5 bg-gold text-emerald-950 py-3.5 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
          >
            {busy
              ? t('coProcessing')
              : method === 'online'
                ? pending
                  ? t('coRetryPayment')
                  : t('coPay', { amount: formatINR(total) })
                : t('coPlaceCod')}
          </motion.button>

          <a
            href={whatsappFallback}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-[#25D366] mt-4 hover:underline"
          >
            {t('enquireOnWhatsApp')}
          </a>
        </aside>
      </form>
    </div>
  );
}

/** Selected / hover styles for the two payment choices: blue for paying online, kumkum red for cash on delivery. */
const PAY_TONES = {
  neela: { active: 'border-neela-light bg-neela/20', hover: 'hover:border-neela-light/60', ring: 'border-neela-light', dot: 'bg-neela-light' },
  kumkum: { active: 'border-kumkum-light bg-kumkum/20', hover: 'hover:border-kumkum-light/60', ring: 'border-kumkum-light', dot: 'bg-kumkum-light' },
} as const;

/** Thin kumkum → gold → blue band, like a temple thoran. */
function TempleBand({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`h-1 rounded-full bg-gradient-to-r from-kumkum via-gold to-neela ${className}`} />;
}

function StepTitle({ n, children }: { n: number; children: ReactNode }) {
  return (
    <h2 className="font-heading text-cream text-lg mb-4 flex items-center gap-3">
      <span className="w-7 h-7 shrink-0 rounded-full bg-kumkum text-cream font-body text-sm font-semibold flex items-center justify-center shadow-[0_0_0_3px_rgba(184,51,42,0.2)]">
        {n}
      </span>
      {children}
    </h2>
  );
}
