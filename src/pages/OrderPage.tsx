import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { useSeo } from '../lib/seo';
import { formatINR } from '../lib/productUtils';
import { formatDeliveryRange } from '../lib/delivery';
import { WHATSAPP_WA_LINK } from '../config/contact';
import {
  cancelOrder,
  getOrder,
  PortalError,
  requestReturn,
  type PortalOrder,
  type PortalReturn,
  type PortalView,
  type ReturnForm,
} from '../lib/orderPortal';

const MAX_VIDEO_MB = 50;
const MAX_PHOTO_MB = 10;
const MAX_PHOTOS = 4;

const card = 'rounded-xl border border-emerald-700 bg-emerald-800/30 p-5 md:p-6';
const inputBase =
  'w-full bg-emerald-950 border border-emerald-700 rounded-md px-3 py-2.5 text-sm outline-none transition-colors focus:border-neela-light focus:ring-2 focus:ring-neela/40';

/**
 * /order/PN-00001?t=<token> — the customer's own order page, opened from the link in
 * their order emails. Shows progress, lets them cancel before dispatch, and report a
 * damaged or defective item within 3 days of delivery.
 */
export default function OrderPage() {
  const { number = '' } = useParams();
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';
  const { t, lang } = useLang();
  useSeo({ title: `${t('opTitle', { number })} | Pranavanaada`, path: `/order/${number}`, noindex: true });

  const [view, setView] = useState<PortalView | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getOrder(number, token)
      .then((v) => live && (setView(v), setState('ready')))
      .catch(() => live && setState('missing'));
    return () => {
      live = false;
    };
  }, [number, token]);

  const date = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString(lang === 'kn' ? 'kn-IN' : 'en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }) : '';
  const help = WHATSAPP_WA_LINK(`Hi, about my order ${number}`);

  if (state === 'loading') return <p className="max-w-3xl mx-auto px-5 py-24 text-center text-cream/60">{t('opLoading')}</p>;
  if (state === 'missing' || !view)
    return (
      <div className="max-w-md mx-auto px-5 py-24 text-center space-y-5">
        <p className="text-cream/70">{t('opNotFound')}</p>
        <a href={help} target="_blank" rel="noopener noreferrer" className="inline-block text-[#25D366] underline underline-offset-4">
          {t('opWhatsApp')}
        </a>
      </div>
    );

  const o = view.order;

  async function onCancel() {
    const msg = `${t('opCancelConfirm', { number: o.order_number })}${
      o.payment_method === 'online' && o.payment_status === 'paid' ? `\n\n${t('opCancelConfirmPaid', { amount: formatINR(o.total) })}` : ''
    }`;
    if (!confirm(msg)) return;
    setBusy(true);
    setError(null);
    try {
      setView(await cancelOrder(number, token));
    } catch {
      setError(t('rtErrGeneric'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-5 py-12 md:py-16 space-y-6">
      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="font-heading text-gold text-2xl md:text-3xl">{t('opTitle', { number: o.order_number })}</h1>
          <StatusBadge status={o.status} />
        </div>
        <p className="text-sm text-cream/50">{t('opPlaced', { date: date(o.created_at) })}</p>
      </div>

      {flash && <p className="rounded-lg border border-gold/50 bg-gold/10 text-gold-light text-sm px-4 py-3">{flash}</p>}
      {error && <p className="rounded-lg border border-red-400/40 bg-red-400/10 text-red-300 text-sm px-4 py-3">{error}</p>}

      {/* Progress + delivery */}
      <section className={card}>
        {o.status === 'cancelled' ? (
          <div className="space-y-2 text-sm">
            <p className="text-cream">{t('opCancelled', { date: date(o.cancelled_at) })}</p>
            {o.payment_method === 'online' && (o.payment_status === 'refunded' || o.payment_status === 'paid') && (
              <p className="text-cream/70">
                {o.payment_status === 'refunded'
                  ? t('opCancelledRefund', { amount: formatINR(o.total) })
                  : t('opCancelledRefundPending', { amount: formatINR(o.total) })}
              </p>
            )}
          </div>
        ) : (
          <>
            <Timeline order={o} date={date} />
            <div className="mt-5 pt-4 border-t border-emerald-700 text-sm space-y-1.5">
              {o.status === 'delivered' ? (
                <p className="text-cream">{t('opDeliveredOn', { date: date(o.delivered_at) })}</p>
              ) : (
                o.preferred_delivery_date && (
                  <p>
                    <span className="text-cream/55">🚚 {t('coExpected')}: </span>
                    <span className="text-cream font-medium">
                      {formatDeliveryRange(o.delivery_from, o.preferred_delivery_date, lang === 'kn' ? 'kn-IN' : 'en-IN')}
                    </span>
                  </p>
                )
              )}
              {(o.courier || o.tracking_number) && (
                <p>
                  <span className="text-cream/55">{t('opTracking')}: </span>
                  <span className="text-cream">{[o.courier, o.tracking_number].filter(Boolean).join(' · ')}</span>
                </p>
              )}
            </div>
          </>
        )}
      </section>

      {/* What the customer can do now */}
      {(o.can_cancel || o.can_return || (o.status === 'delivered' && o.return_until)) && !formOpen && (
        <section className={`${card} space-y-4`}>
          {o.can_cancel && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-cream/60">{t('opCancelHint')}</p>
              <button
                onClick={onCancel}
                disabled={busy}
                className="text-sm font-semibold px-4 py-2 rounded-md border border-kumkum-light/60 text-kumkum-light hover:bg-kumkum/15 transition-colors disabled:opacity-50"
              >
                {t('opCancel')}
              </button>
            </div>
          )}
          {o.can_return ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-cream/70">{t('opReportHint', { date: date(o.return_until) })}</p>
              <button
                onClick={() => {
                  setFormOpen(true);
                  setFlash(null);
                }}
                className="text-sm font-semibold px-4 py-2 rounded-md bg-gold text-emerald-950 hover:bg-gold-light transition-colors"
              >
                {t('opReport')}
              </button>
            </div>
          ) : (
            o.status === 'delivered' &&
            o.return_until && <p className="text-sm text-cream/55">{t('opWindowClosed', { date: date(o.return_until) })}</p>
          )}
        </section>
      )}

      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}>
            <ReturnRequestForm
              order={o}
              returns={view.returns}
              onClose={() => setFormOpen(false)}
              onSubmit={async (form, files, onProgress) => {
                const v = await requestReturn(number, token, form, files, onProgress);
                setView(v);
                setFormOpen(false);
                setFlash(t('rtSent'));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Requests so far */}
      {view.returns.length > 0 && (
        <section className={card}>
          <h2 className="font-heading text-cream text-lg mb-4">{t('opYourRequests')}</h2>
          <ul className="space-y-4">
            {view.returns.map((r) => (
              <ReturnRow key={r.id} r={r} date={date} />
            ))}
          </ul>
        </section>
      )}

      {/* Items */}
      <section className={card}>
        <h2 className="font-heading text-cream text-lg mb-4">{t('opItems')}</h2>
        <ul className="space-y-3 mb-4">
          {o.items.map((i, n) => (
            <li key={n} className="flex gap-3 text-sm">
              {i.image && <img src={i.image} alt="" className="w-12 h-12 rounded-md object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="text-cream/85">
                  {i.name}
                  {i.variant ? ` · ${i.variant}` : ''}
                </div>
                {i.includes && <div className="text-[11px] text-cream/45">{i.includes}</div>}
                <div className="text-xs text-cream/50">× {i.qty}</div>
              </div>
              <div className="text-cream/80 shrink-0">{formatINR(i.line_total)}</div>
            </li>
          ))}
        </ul>
        <dl className="text-sm space-y-1 border-t border-emerald-700 pt-3">
          <div className="flex justify-between">
            <dt className="text-cream/60">{t('coSubtotal')}</dt>
            <dd>{formatINR(o.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-cream/60">{t('coShipping')}</dt>
            <dd>{o.shipping_fee ? formatINR(o.shipping_fee) : t('coFree')}</dd>
          </div>
          <div className="flex justify-between font-semibold text-base">
            <dt>{t('coTotal')}</dt>
            <dd className="text-gold">{formatINR(o.total)}</dd>
          </div>
          <div className="flex justify-between pt-1">
            <dt className="text-cream/60">{t('opPayment')}</dt>
            <dd className="text-cream/80">{paymentText(o, t)}</dd>
          </div>
        </dl>
        <div className="border-t border-emerald-700 mt-4 pt-4 text-sm">
          <div className="text-xs text-cream/50 mb-1">{t('okDeliverTo')}</div>
          <div className="text-cream/80 leading-relaxed">
            {o.customer_name}
            <br />
            {o.address_line1}
            {o.address_line2 && <>, {o.address_line2}</>}
            {o.landmark && (
              <>
                <br />
                {o.landmark}
              </>
            )}
            <br />
            {o.city}, {o.state} – {o.pincode}
          </div>
        </div>
      </section>

      <div className="text-center text-sm text-cream/60 space-y-2 pt-2">
        <p>
          {t('opHelp')}{' '}
          <a href={help} target="_blank" rel="noopener noreferrer" className="text-[#25D366] underline underline-offset-4">
            {t('opWhatsApp')}
          </a>
        </p>
        <p>
          <Link to="/policies/returns" className="text-gold/80 hover:text-gold underline underline-offset-4">
            {t('coAgreeReturns')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function paymentText(o: PortalOrder, t: ReturnType<typeof useLang>['t']) {
  if (o.payment_status === 'refunded') return t('opRefunded');
  if (o.payment_method === 'online') return t('opPaidOnline');
  return o.payment_status === 'paid' ? t('opCodPaid') : t('opCodDue', { amount: formatINR(o.total) });
}

function StatusBadge({ status }: { status: PortalOrder['status'] }) {
  const { t } = useLang();
  const tone =
    status === 'delivered'
      ? 'bg-gold/20 text-gold'
      : status === 'cancelled'
        ? 'bg-kumkum/25 text-kumkum-light'
        : status === 'shipped'
          ? 'bg-neela/30 text-neela-light'
          : 'bg-cream/10 text-cream/75';
  return <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tone}`}>{t(`opStatus_${status}`)}</span>;
}

function Timeline({ order, date }: { order: PortalOrder; date: (d: string | null) => string }) {
  const { t } = useLang();
  const reached = order.status === 'delivered' ? 3 : order.status === 'shipped' ? 2 : 1;
  const steps = [
    { label: t('opStepPlaced'), when: order.created_at },
    { label: t('opStepShipped'), when: order.shipped_at },
    { label: t('opStepDelivered'), when: order.delivered_at },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2">
      {steps.map((s, i) => {
        const done = i < reached;
        return (
          <li key={s.label} className="relative text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-3.5 h-0.5 ${i < reached ? 'bg-gold' : 'bg-emerald-700'}`}
                style={{ left: '-50%', right: '50%' }}
              />
            )}
            <span
              className={`relative z-10 mx-auto w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-gold text-emerald-950' : 'bg-emerald-950 border border-emerald-700 text-cream/40'
              }`}
            >
              {done ? '✓' : i + 1}
            </span>
            <div className={`mt-2 text-xs sm:text-sm ${done ? 'text-cream' : 'text-cream/45'}`}>{s.label}</div>
            {done && s.when && <div className="text-[11px] text-cream/45">{date(s.when)}</div>}
          </li>
        );
      })}
    </ol>
  );
}

function ReturnRow({ r, date }: { r: PortalReturn; date: (d: string) => string }) {
  const { t } = useLang();
  const tone =
    r.status === 'rejected'
      ? 'text-kumkum-light'
      : r.status === 'refunded' || r.status === 'replaced'
        ? 'text-gold'
        : 'text-neela-light';
  return (
    <li className="rounded-lg border border-emerald-700 bg-emerald-950/40 p-4 text-sm space-y-1.5">
      <div className="flex flex-wrap justify-between gap-2">
        <span className="text-cream/50 text-xs">{date(r.created_at)}</span>
        <span className={`font-semibold ${tone}`}>{t(`rtStatus_${r.status}`)}</span>
      </div>
      <div className="text-cream/85">
        {r.items.map((i) => `${i.name}${i.variant ? ` · ${i.variant}` : ''} × ${i.qty}`).join(', ')}
      </div>
      <div className="text-cream/60 text-xs">
        {r.resolution === 'refund' ? `${t('rtRefund')} · ${formatINR(r.amount)}` : t('rtReplacement')}
      </div>
      {r.note && (r.status === 'rejected' || r.status === 'replaced' || r.status === 'refunded') && (
        <p className="text-cream/70 text-xs border-t border-emerald-800 pt-2">{r.note}</p>
      )}
    </li>
  );
}

function ReturnRequestForm({
  order,
  returns,
  onClose,
  onSubmit,
}: {
  order: PortalOrder;
  returns: PortalReturn[];
  onClose: () => void;
  onSubmit: (form: ReturnForm, files: File[], onProgress: (p: number) => void) => Promise<void>;
}) {
  const { t } = useLang();
  // How many of each line can still be reported (earlier requests that weren't rejected count)
  const remaining = useMemo(
    () =>
      order.items.map(
        (line, index) =>
          line.qty -
          returns
            .filter((r) => r.status !== 'rejected')
            .flatMap((r) => r.items)
            .filter((i) => i.index === index)
            .reduce((n, i) => n + i.qty, 0)
      ),
    [order.items, returns]
  );
  // A single-item order starts with that item ticked
  const [picked, setPicked] = useState<Record<number, number>>(() => (remaining.length === 1 && remaining[0] > 0 ? { 0: 1 } : {}) as Record<number, number>);
  const [reason, setReason] = useState<ReturnForm['reason']>('damaged');
  const [resolution, setResolution] = useState<ReturnForm['resolution']>('replacement');
  const [details, setDetails] = useState('');
  const [refundUpi, setRefundUpi] = useState('');
  const [video, setVideo] = useState<File | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [videoOnWhatsApp, setVideoOnWhatsApp] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const needsUpi = resolution === 'refund' && order.payment_method === 'cod';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad: string[] = [];
    const items = Object.entries(picked)
      .filter(([, q]) => q > 0)
      .map(([index, qty]) => ({ index: Number(index), qty }));
    if (!items.length) bad.push(t('rtErrItems'));
    if (details.trim().length < 10) bad.push(t('rtErrDetails'));
    if (!video && !videoOnWhatsApp) bad.push(t('rtErrVideo'));
    if (video && video.size > MAX_VIDEO_MB * 1024 * 1024) bad.push(t('rtErrVideoSize'));
    if (photos.some((p) => p.size > MAX_PHOTO_MB * 1024 * 1024)) bad.push(t('rtErrPhotoSize'));
    if (needsUpi && refundUpi.trim().length < 5) bad.push(t('rtErrUpi'));
    setErrors(bad);
    if (bad.length) return;

    setSending(true);
    try {
      const files = [...(video ? [video] : []), ...photos];
      if (files.length) setProgress(0);
      await onSubmit({ items, reason, resolution, details: details.trim(), refundUpi: refundUpi.trim(), videoOnWhatsApp }, files, setProgress);
    } catch (err) {
      const code = err instanceof PortalError ? err.code : '';
      setErrors([
        code === 'window_closed'
          ? t('rtErrClosed')
          : code === 'video_too_large'
            ? t('rtErrVideoSize')
            : code === 'photo_too_large'
              ? t('rtErrPhotoSize')
              : t('rtErrGeneric'),
      ]);
    } finally {
      setSending(false);
      setProgress(null);
    }
  }

  const radio = (active: boolean) =>
    `flex items-start gap-3 rounded-lg border px-3.5 py-3 cursor-pointer text-sm transition-colors ${
      active ? 'border-gold bg-gold/10 text-cream' : 'border-emerald-700 text-cream/70 hover:border-gold/40'
    }`;
  const label = 'block text-sm text-cream/80 font-medium mb-2';

  return (
    <form onSubmit={submit} className={`${card} space-y-6`} noValidate>
      <h2 className="font-heading text-gold text-xl">{t('rtTitle')}</h2>

      <div>
        <span className={label}>{t('rtWhich')}</span>
        <ul className="space-y-2">
          {order.items.map((line, index) =>
            remaining[index] > 0 ? (
              <li key={index} className="flex items-center gap-3 rounded-lg border border-emerald-700 px-3.5 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-[#c9a24b]"
                  checked={(picked[index] ?? 0) > 0}
                  onChange={(e) => setPicked((p) => ({ ...p, [index]: e.target.checked ? 1 : 0 }))}
                  aria-label={line.name}
                />
                <span className="flex-1 min-w-0 text-cream/85">
                  {line.name}
                  {line.variant ? ` · ${line.variant}` : ''}
                </span>
                {remaining[index] > 1 && (picked[index] ?? 0) > 0 && (
                  <select
                    value={picked[index]}
                    onChange={(e) => setPicked((p) => ({ ...p, [index]: Number(e.target.value) }))}
                    className="bg-emerald-950 border border-emerald-700 rounded-md px-2 py-1 text-sm"
                  >
                    {Array.from({ length: remaining[index] }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        × {n}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            ) : null
          )}
        </ul>
      </div>

      <fieldset>
        <legend className={label}>{t('rtReason')}</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {(['damaged', 'defective'] as const).map((r) => (
            <label key={r} className={radio(reason === r)}>
              <input type="radio" name="reason" className="mt-0.5 accent-[#c9a24b]" checked={reason === r} onChange={() => setReason(r)} />
              {r === 'damaged' ? t('rtDamaged') : t('rtDefective')}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label className={label} htmlFor="rt-details">
          {t('rtDetails')}
        </label>
        <textarea
          id="rt-details"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={t('rtDetailsPh')}
          className={`${inputBase} resize-y`}
          maxLength={2000}
        />
      </div>

      <div>
        <span className={label}>
          {t('rtVideo')} <span className="text-kumkum-light">*</span>
        </span>
        <p className="text-xs text-cream/50 mb-2">{t('rtVideoHint')}</p>
        <FilePick accept="video/*" files={video ? [video] : []} onPick={(f) => setVideo(f[0] ?? null)} disabled={videoOnWhatsApp} />
        <label className="flex items-start gap-2 mt-2.5 text-xs text-cream/60 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 accent-[#c9a24b]"
            checked={videoOnWhatsApp}
            onChange={(e) => {
              setVideoOnWhatsApp(e.target.checked);
              if (e.target.checked) setVideo(null);
            }}
          />
          {t('rtVideoWa')}
        </label>
      </div>

      <div>
        <span className={label}>{t('rtPhotos')}</span>
        <FilePick accept="image/*" multiple files={photos} onPick={(f) => setPhotos(f.slice(0, MAX_PHOTOS))} />
      </div>

      <fieldset>
        <legend className={label}>{t('rtWant')}</legend>
        <div className="grid sm:grid-cols-2 gap-2">
          {(['replacement', 'refund'] as const).map((r) => (
            <label key={r} className={radio(resolution === r)}>
              <input
                type="radio"
                name="resolution"
                className="mt-0.5 accent-[#c9a24b]"
                checked={resolution === r}
                onChange={() => setResolution(r)}
              />
              {r === 'refund' ? t('rtWantRefund') : t('rtWantReplacement')}
            </label>
          ))}
        </div>
      </fieldset>

      {needsUpi && (
        <div>
          <label className={label} htmlFor="rt-upi">
            {t('rtUpi')}
          </label>
          <p className="text-xs text-cream/50 mb-2">{t('rtUpiHint')}</p>
          <input id="rt-upi" value={refundUpi} onChange={(e) => setRefundUpi(e.target.value)} className={inputBase} maxLength={200} />
        </div>
      )}

      <p className="text-xs text-cream/55 rounded-lg border border-emerald-700 bg-emerald-950/40 px-3.5 py-3 leading-relaxed">
        {t('rtShipNote')}
      </p>

      {errors.length > 0 && (
        <ul className="text-sm text-red-300 bg-red-400/10 border border-red-400/30 rounded-md px-4 py-3 space-y-1">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={sending}
          className="flex-1 sm:flex-none bg-gold text-emerald-950 px-6 py-3 rounded-md text-sm font-semibold uppercase tracking-wide hover:bg-gold-light transition-colors disabled:opacity-60"
        >
          {sending
            ? progress !== null && progress < 1
              ? t('rtUploading', { pct: Math.round(progress * 100) })
              : t('rtSending')
            : t('rtSubmit')}
        </button>
        <button type="button" onClick={onClose} disabled={sending} className="text-sm text-cream/60 hover:text-cream px-3 py-3">
          {t('rtBack')}
        </button>
      </div>
      {progress !== null && (
        <div className="h-1.5 rounded-full bg-emerald-950 overflow-hidden" aria-hidden>
          <div className="h-full bg-gold transition-[width] duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
    </form>
  );
}

/** A file button that lists the chosen files (the native input is hard to style). */
function FilePick({
  accept,
  multiple,
  files,
  onPick,
  disabled,
}: {
  accept: string;
  multiple?: boolean;
  files: File[];
  onPick: (files: File[]) => void;
  disabled?: boolean;
}) {
  const { t } = useLang();
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <label className="inline-flex items-center gap-2 cursor-pointer text-sm px-4 py-2 rounded-md border border-gold/60 text-gold hover:bg-gold/10 transition-colors">
        <span aria-hidden>＋</span> {t('rtChooseFile')}
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          hidden
          disabled={disabled}
          onChange={(e) => {
            onPick(Array.from(e.target.files ?? []));
            e.target.value = '';
          }}
        />
      </label>
      {files.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs text-cream/65">
          {files.map((f) => (
            <li key={f.name + f.size}>
              {f.name} · {(f.size / (1024 * 1024)).toFixed(1)} MB
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
