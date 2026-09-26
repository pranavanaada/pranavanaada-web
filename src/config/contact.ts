export const WHATSAPP_NUMBER_INTL = '918050124365'; // International format without leading +
export const WHATSAPP_DISPLAY = '+91 8050124365';

export const WHATSAPP_WA_LINK = (text: string) => {
  const encoded = encodeURIComponent(text || 'Hi, I would like to know more.');
  return `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encoded}`;
};

export const EMAIL = 'pranavanaadaa@gmail.com';

/** Phone number for tel: links (calls). */
export const PHONE_TEL = '+918050124365';

/**
 * Shown in the footer's "Get in touch" column. Leave empty to hide.
 * Fill in the registered business name, address lines and opening hours.
 */
export const BUSINESS_NAME = '';
export const ADDRESS_LINES: string[] = [];
export const BUSINESS_HOURS = '';

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/pranavanaadaa_bells/',
  facebook: 'https://www.facebook.com/share/1J2y1WPpSR/',
  // Channel handle is in Kannada (@ಜೀವೋದ್ಧಾರಭಗವಂತ), kept URL-encoded.
  youtube:
    'https://www.youtube.com/@%E0%B2%9C%E0%B3%80%E0%B2%B5%E0%B3%8B%E0%B2%A6%E0%B3%8D%E0%B2%A7%E0%B2%BE%E0%B2%B0%E0%B2%AD%E0%B2%97%E0%B2%B5%E0%B2%82%E0%B2%A4',
};
export const MAILTO_LINK = (subject?: string, body?: string) => {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const qs = params.toString();
  return `mailto:${EMAIL}${qs ? `?${qs}` : ''}`;
};
