// Delivery-date rules. The server applies the same rules in
// supabase/functions/_shared/delivery.ts — keep the two in sync.

/** Bengaluru orders placed before this hour (India time) are delivered the same day. */
export const SAME_DAY_CUTOFF_HOUR = 18;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** A Date whose UTC fields read as the current time in India (whatever the visitor's own time zone). */
const indiaNow = () => new Date(Date.now() + IST_OFFSET_MS);
const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** Bengaluru address: by pincode (560xxx) once it's filled in, otherwise by the city name. */
export function isBengaluru(city: string, pincode: string) {
  const pin = pincode.trim();
  if (/^\d{6}$/.test(pin)) return pin.startsWith('560');
  return /bengaluru|bengalooru|bangalore|banglore|bangaluru|ಬೆಂಗಳೂರು/i.test(city);
}

export interface DeliveryWindow {
  /** Earliest date the customer can choose (YYYY-MM-DD) */
  earliest: string;
  bengaluru: boolean;
  /** Bengaluru, ordered before the cut-off: can be delivered today */
  sameDay: boolean;
}

/** Bengaluru: today before 6 pm, otherwise tomorrow. Elsewhere: the store's minimum days ahead. */
export function deliveryWindow(city: string, pincode: string, minDays: number): DeliveryWindow {
  const now = indiaNow();
  if (isBengaluru(city, pincode)) {
    const sameDay = now.getUTCHours() < SAME_DAY_CUTOFF_HOUR;
    return { bengaluru: true, sameDay, earliest: ymd(sameDay ? now : new Date(now.getTime() + DAY_MS)) };
  }
  return { bengaluru: false, sameDay: false, earliest: ymd(new Date(now.getTime() + minDays * DAY_MS)) };
}

/** True when the order's preferred date is the day it was placed (India time) — a same-day delivery. */
export function isSameDayOrder(createdAt: string, preferredDate: string | null) {
  return !!preferredDate && ymd(new Date(Date.parse(createdAt) + IST_OFFSET_MS)) === preferredDate;
}
