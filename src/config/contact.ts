export const WHATSAPP_NUMBER_INTL = '918050124365'; // International format without leading +
export const WHATSAPP_DISPLAY = '+91 8050124365';

export const WHATSAPP_WA_LINK = (text: string) => {
  const encoded = encodeURIComponent(text || 'Hi, I would like to know more.');
  return `https://wa.me/${WHATSAPP_NUMBER_INTL}?text=${encoded}`;
};

export const EMAIL = 'pranavanaadaa@gmail.com';
export const MAILTO_LINK = (subject?: string, body?: string) => {
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  const qs = params.toString();
  return `mailto:${EMAIL}${qs ? `?${qs}` : ''}`;
};
