// Expected delivery, worked out from the address — customers don't pick a date.
// The server applies the same rules in supabase/functions/_shared/delivery.ts; keep the two in sync.
//   Bengaluru:          same day if ordered before 12 pm (India time), otherwise the next day
//   Rest of Karnataka:  1–2 days
//   Other states:       3–4 days

export const SAME_DAY_CUTOFF_HOUR = 12;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export type DeliveryZone = 'bengaluru' | 'karnataka' | 'india';

/** Karnataka pincodes start with 56–59, Bengaluru's with 560. Before the pincode is typed, go by city/state. */
export function deliveryZone(state: string, city: string, pincode: string): DeliveryZone | null {
  const pin = pincode.trim();
  if (/^\d{6}$/.test(pin)) return pin.startsWith('560') ? 'bengaluru' : /^5[6-9]/.test(pin) ? 'karnataka' : 'india';
  if (/bengaluru|bengalooru|bangalore|banglore|bangaluru|ಬೆಂಗಳೂರು/i.test(city)) return 'bengaluru';
  if (!state.trim()) return null;
  return /^karnataka$/i.test(state.trim()) ? 'karnataka' : 'india';
}

export interface DeliveryEstimate {
  zone: DeliveryZone;
  /** Earliest and latest expected dates (YYYY-MM-DD, India) — the same day for Bengaluru */
  from: string;
  to: string;
  /** Bengaluru, ordered before 12 pm */
  sameDay: boolean;
}

export function deliveryEstimate(state: string, city: string, pincode: string, now = Date.now()): DeliveryEstimate | null {
  const zone = deliveryZone(state, city, pincode);
  if (!zone) return null;
  const india = new Date(now + IST_OFFSET_MS);
  const day = (n: number) => ymd(new Date(india.getTime() + n * DAY_MS));
  if (zone === 'bengaluru') {
    const sameDay = india.getUTCHours() < SAME_DAY_CUTOFF_HOUR;
    const d = day(sameDay ? 0 : 1);
    return { zone, from: d, to: d, sameDay };
  }
  return zone === 'karnataka' ? { zone, from: day(1), to: day(2), sameDay: false } : { zone, from: day(3), to: day(4), sameDay: false };
}

/** True when the order is due the day it was placed (India time) — a same-day delivery. */
export function isSameDayOrder(createdAt: string, deliverBy: string | null) {
  return !!deliverBy && ymd(new Date(Date.parse(createdAt) + IST_OFFSET_MS)) === deliverBy;
}

/** "28 Sept" or "28 – 29 Sept" (years left out) */
export function formatDeliveryRange(from: string | null | undefined, to: string | null | undefined, locale = 'en-IN') {
  const fmt = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  if (!to) return '';
  return from && from !== to ? `${fmt(from)} – ${fmt(to)}` : fmt(to);
}
