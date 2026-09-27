// Delivery-date rules — the same as src/lib/delivery.ts on the website; keep the two in sync.

/** Bengaluru orders placed before this hour (India time) are delivered the same day. */
export const SAME_DAY_CUTOFF_HOUR = 18;
/** An order sent at 5:59 pm can reach the server a little later — allow for that. */
const GRACE_MS = 15 * 60 * 1000;

const IST_OFFSET_MS = 330 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);

export function isBengaluru(city: string, pincode: string) {
  const pin = pincode.trim();
  if (/^\d{6}$/.test(pin)) return pin.startsWith('560');
  return /bengaluru|bengalooru|bangalore|banglore|bangaluru|ಬೆಂಗಳೂರು/i.test(city);
}

/** Earliest allowed delivery date (YYYY-MM-DD, India): Bengaluru today before 6 pm / tomorrow after; elsewhere minDays ahead. */
export function earliestDelivery(city: string, pincode: string, minDays: number) {
  if (isBengaluru(city, pincode)) {
    const now = new Date(Date.now() + IST_OFFSET_MS - GRACE_MS);
    const sameDay = now.getUTCHours() < SAME_DAY_CUTOFF_HOUR;
    return ymd(sameDay ? now : new Date(now.getTime() + DAY_MS));
  }
  // Other places: a day's leeway, as the visitor's "today" may differ slightly from the server's
  return ymd(new Date(Date.now() + IST_OFFSET_MS + (minDays - 1) * DAY_MS));
}

/** The order's preferred date is the day it was placed (India time). */
export function isSameDayOrder(createdAt: string, preferredDate: string | null) {
  return !!preferredDate && ymd(new Date(Date.parse(createdAt) + IST_OFFSET_MS)) === preferredDate;
}
