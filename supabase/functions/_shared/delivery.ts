// Expected delivery from the address — the same rules as src/lib/delivery.ts on the website; keep them in sync.
//   Bengaluru:          same day if ordered before 12 pm (India time), otherwise the next day
//   Rest of Karnataka:  1–2 days
//   Other states:       3–4 days

export const SAME_DAY_CUTOFF_HOUR = 12;
/** A customer shown "today" at 11:59 may send the order a little after 12 — honour it for this long. */
export const GRACE_MS = 10 * 60 * 1000;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export type DeliveryZone = 'bengaluru' | 'karnataka' | 'india';

export function deliveryZone(state: string, city: string, pincode: string): DeliveryZone {
  const pin = pincode.trim();
  if (/^\d{6}$/.test(pin)) return pin.startsWith('560') ? 'bengaluru' : /^5[6-9]/.test(pin) ? 'karnataka' : 'india';
  if (/bengaluru|bengalooru|bangalore|banglore|bangaluru|ಬೆಂಗಳೂರು/i.test(city)) return 'bengaluru';
  return /^karnataka$/i.test(state.trim()) ? 'karnataka' : 'india';
}

/** Expected delivery window: { from, to } as YYYY-MM-DD in India. */
export function deliveryEstimate(state: string, city: string, pincode: string, now = Date.now()) {
  const zone = deliveryZone(state, city, pincode);
  const india = new Date(now + IST_OFFSET_MS);
  const day = (n: number) => ymd(new Date(india.getTime() + n * DAY_MS));
  if (zone === 'bengaluru') {
    const sameDay = india.getUTCHours() < SAME_DAY_CUTOFF_HOUR;
    const d = day(sameDay ? 0 : 1);
    return { zone, from: d, to: d };
  }
  return zone === 'karnataka' ? { zone, from: day(1), to: day(2) } : { zone, from: day(3), to: day(4) };
}

/** The order is due the day it was placed (India time). */
export function isSameDayOrder(createdAt: string, deliverBy: string | null) {
  return !!deliverBy && ymd(new Date(Date.parse(createdAt) + IST_OFFSET_MS)) === deliverBy;
}
