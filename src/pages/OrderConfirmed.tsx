import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLang } from '../i18n/useLang';
import { formatINR } from '../lib/productUtils';
import { recallOrder } from '../lib/checkout';
import { WHATSAPP_WA_LINK } from '../config/contact';
import { useSeo } from '../lib/seo';
import { formatDeliveryRange } from '../lib/delivery';

/** Shown after a successful order (COD placed, or online payment verified). */
export default function OrderConfirmed() {
  useSeo({ title: 'Order confirmed | Pranavanaada', path: '/order-confirmed', noindex: true });
  const { t } = useLang();
  const order = useMemo(recallOrder, []);

  return (
    <div className="max-w-2xl mx-auto px-5 py-16">
      <div className="text-center mb-10">
        <motion.div
          className="w-20 h-20 mx-auto rounded-full bg-gold/15 border-2 border-gold text-gold flex items-center justify-center text-4xl mb-6"
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 14 }}
        >
          ✓
        </motion.div>
        <h1 className="font-heading text-gold text-2xl md:text-3xl mb-3">{t('okTitle')}</h1>
        {order ? (
          <>
            <div className="text-cream/60 text-sm">{t('okNumber')}</div>
            <div className="text-2xl text-cream font-semibold tracking-wide mb-3">{order.order_number}</div>
            <span
              className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                order.payment_status === 'paid' ? 'bg-gold/20 text-gold' : 'bg-cream/10 text-cream/70'
              }`}
            >
              {order.payment_status === 'paid' ? `✓ ${t('okPaid')}` : t('okCod', { amount: formatINR(order.total) })}
            </span>
            <p className="text-cream/60 text-sm mt-5">{t('okNext', { phone: order.phone })}</p>
          </>
        ) : (
          <p className="text-cream/60">{t('okMissing')}</p>
        )}
      </div>

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-emerald-700 bg-emerald-800/30 p-6 space-y-5"
        >
          <ul className="space-y-3">
            {order.items.map((i, n) => (
              <li key={n} className="flex gap-3 text-sm">
                {i.image && <img src={i.image} alt="" className="w-12 h-12 rounded-md object-cover" />}
                <div className="flex-1">
                  <div className="text-cream/85">
                    {i.name}
                    {i.variant ? ` · ${i.variant}` : ''}
                  </div>
                  {i.includes && <div className="text-[11px] text-cream/45">{i.includes}</div>}
                  <div className="text-xs text-cream/50">× {i.qty}</div>
                </div>
                <div className="text-cream/80">{formatINR(i.line_total)}</div>
              </li>
            ))}
          </ul>
          <dl className="text-sm space-y-1 border-t border-emerald-700 pt-3">
            <div className="flex justify-between">
              <dt className="text-cream/60">{t('coSubtotal')}</dt>
              <dd>{formatINR(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-cream/60">{t('coShipping')}</dt>
              <dd>{order.shipping_fee ? formatINR(order.shipping_fee) : t('coFree')}</dd>
            </div>
            <div className="flex justify-between font-semibold text-base">
              <dt>{t('coTotal')}</dt>
              <dd className="text-gold">{formatINR(order.total)}</dd>
            </div>
          </dl>
          <div className="grid sm:grid-cols-2 gap-4 border-t border-emerald-700 pt-4 text-sm">
            <div>
              <div className="text-xs text-cream/50 mb-1">{t('okDeliverTo')}</div>
              <div className="text-cream/80 leading-relaxed">
                {order.customer_name}
                <br />
                {order.address_line1}
                {order.address_line2 && <>, {order.address_line2}</>}
                {order.landmark && (
                  <>
                    <br />
                    {order.landmark}
                  </>
                )}
                <br />
                {order.city}, {order.state} – {order.pincode}
              </div>
            </div>
            {order.preferred_delivery_date && (
              <div>
                <div className="text-xs text-cream/50 mb-1">{t('okPreferred')}</div>
                <div className="text-cream/80">
                  {formatDeliveryRange(order.delivery_from, order.preferred_delivery_date)}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="text-center mt-10 space-y-3">
        <p className="text-sm text-cream/60">
          {t('okQuestions')}{' '}
          <a
            href={WHATSAPP_WA_LINK(order ? `Hi, about my order ${order.order_number}` : 'Hi, about my order')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] underline underline-offset-4"
          >
            {t('okWhatsApp')}
          </a>
        </p>
        <Link to="/shop" className="inline-block text-gold text-sm underline underline-offset-4">
          {t('continueBrowsing')}
        </Link>
      </div>
    </div>
  );
}
