// Store policies (Returns, Shipping, Cancellation, Terms, Privacy) in English and Kannada.
// Shown at /policies/<slug>. Delivery times must match src/lib/delivery.ts.
// A paragraph is a string; a bulleted list is a string[].

export type PolicySlug = 'returns' | 'shipping' | 'cancellation' | 'terms' | 'privacy';

export interface Policy {
  slug: PolicySlug;
  title: string;
  /** Short name for links (footer, "other policies") */
  short: string;
  intro?: string;
  sections: { heading: string; body: (string | string[])[] }[];
}

export const POLICY_SLUGS: PolicySlug[] = ['returns', 'shipping', 'cancellation', 'terms', 'privacy'];
export const POLICIES_UPDATED = '2026-10-10';

const BUSINESS = 'Pranavanaada, 1006, Kalahasti Nagar, Prashanth Nagar, T. Dasarahalli, Bengaluru, Karnataka 560057';
const CONTACT_EN = 'Email pranavanaadaa@gmail.com, or call / WhatsApp +91 8050124365.';
const CONTACT_KN = 'ಇಮೇಲ್ pranavanaadaa@gmail.com, ಅಥವಾ ಕರೆ / WhatsApp +91 8050124365.';

const en: Policy[] = [
  {
    slug: 'returns',
    title: 'Returns, Replacements & Refunds',
    short: 'Returns & Refunds',
    intro:
      'Every Pranavanaada bell is handmade and checked before it is packed. If your order arrives damaged or has a manufacturing defect, we will replace it or refund it.',
    sections: [
      {
        heading: 'What can be returned',
        body: [
          'Items that arrive damaged in transit, or that have a manufacturing defect — for example a crack, a broken part, or a bell that does not ring as it should.',
        ],
      },
      {
        heading: 'Report it within 3 days of delivery',
        body: [
          'Report the problem within 3 days of delivery — use "Report a problem" on your order page (the link is in your order emails), or WhatsApp us on +91 8050124365. Requests made after 3 days cannot be accepted.',
        ],
      },
      {
        heading: 'Unboxing video required',
        body: [
          'Please record one continuous video while opening your package — starting from the sealed package with the shipping label visible, and showing the damage or defect. We cannot accept a damage or defect claim without an unboxing video. Photos are welcome too.',
        ],
      },
      {
        heading: 'What is not covered',
        body: [
          [
            'Small differences in finish, colour, texture, size, weight or tone — these are natural in handmade Panchaloha items and are not defects.',
            'Wear, scratches or damage that happens after delivery, through use or mishandling.',
            'Change of mind, or ordering the wrong item or weight.',
            'Items that are not sent back complete (with the striker stick and any accessories) and in the condition they arrived.',
          ],
        ],
      },
      {
        heading: 'Sending the item back',
        body: [
          'Once we approve your request, we will email you our return address. Pack the item securely with all its parts and a note with your order number, and send it by a trackable courier. Return shipping is at your cost.',
        ],
      },
      {
        heading: 'Refund or replacement — your choice',
        body: [
          'When the item reaches us and we have verified the problem:',
          [
            'Replacement: we send you a new item, and we pay for its delivery.',
            'Refund for online payments: back to the original payment method (card, UPI or net banking).',
            'Refund for pay-on-delivery orders: by UPI or bank transfer to the details you give us.',
          ],
          'Refunds are started within 2 working days of verification. Your bank may take 5–7 working days to show the money. Delivery charges are not refunded.',
        ],
      },
      { heading: 'Questions', body: [CONTACT_EN] },
    ],
  },
  {
    slug: 'shipping',
    title: 'Shipping & Delivery',
    short: 'Shipping',
    sections: [
      { heading: 'Where we deliver', body: ['We deliver across India.'] },
      {
        heading: 'Delivery times',
        body: [
          [
            'Bengaluru: the same day for orders placed before 12 pm, otherwise the next day.',
            'Rest of Karnataka: 1–2 days.',
            'Other states: 3–4 days.',
          ],
          'Your expected delivery date is shown at checkout and in your order confirmation. These are estimates — courier delays, public holidays or weather can occasionally add time, and we will let you know if that happens.',
        ],
      },
      {
        heading: 'Delivery charges',
        body: ['Any delivery charge is shown at checkout before you place your order.'],
      },
      {
        heading: 'Payment options',
        body: [
          'Pay online (UPI, cards, net banking — processed securely by Razorpay) or pay on delivery by cash or UPI. Pay on delivery may not be available above a certain order value; checkout shows what is available for your order.',
        ],
      },
      {
        heading: 'Tracking your order',
        body: [
          'Your order page (linked in your order emails) shows the latest status. We also send updates by email and may contact you by phone or WhatsApp to arrange delivery.',
        ],
      },
      {
        heading: 'Receiving your order',
        body: [
          'Please give a correct address and a phone number that is reachable on the delivery day. If a delivery fails because of a wrong address or because no one is available, re-delivery may cost extra.',
          'Please record an unboxing video when you open the package — it is needed if anything has been damaged (see Returns & Refunds).',
        ],
      },
      { heading: 'Questions', body: [CONTACT_EN] },
    ],
  },
  {
    slug: 'cancellation',
    title: 'Cancellation Policy',
    short: 'Cancellation',
    sections: [
      {
        heading: 'Before dispatch — cancel any time',
        body: [
          'You can cancel your order at any time until it has been dispatched, using "Cancel order" on your order page or by calling / WhatsApping us. There is no cancellation fee.',
          [
            'Paid online: the full amount is refunded to your original payment method. The refund starts straight away; your bank may take 5–7 working days to show it.',
            'Pay on delivery: nothing to pay.',
          ],
        ],
      },
      {
        heading: 'After dispatch',
        body: [
          'Once an order has been dispatched it cannot be cancelled. If it arrives damaged or defective, please see our Returns & Refunds policy.',
        ],
      },
      {
        heading: 'If we have to cancel',
        body: [
          'Rarely, we may need to cancel an order — for example if an item becomes unavailable or we cannot deliver to the address. We will tell you, and refund the full amount.',
        ],
      },
      { heading: 'Questions', body: [CONTACT_EN] },
    ],
  },
  {
    slug: 'terms',
    title: 'Terms & Conditions',
    short: 'Terms',
    intro: `This website is run by ${BUSINESS}. By using the website or placing an order, you agree to these terms.`,
    sections: [
      {
        heading: 'Our products',
        body: [
          'Our bells are handmade from Panchaloha. Photos and videos show the product as accurately as we can, but every piece is slightly different: small variations in finish, colour, size, weight and tone are natural and are not defects. Listed weights and sizes are approximate.',
        ],
      },
      {
        heading: 'Prices and payment',
        body: [
          'Prices are in Indian Rupees (₹) and are the prices shown on the website when you place your order. Online payments are processed securely by Razorpay — we never see or store your card or bank details. Pay on delivery may be limited by order value.',
        ],
      },
      {
        heading: 'Orders',
        body: [
          'You will receive an email when your order is placed. We may contact you to confirm details. We may decline or cancel an order — for example because of a pricing error or if an item is unavailable — and in that case we refund any amount paid in full.',
        ],
      },
      {
        heading: 'Delivery, cancellation and returns',
        body: [
          'Delivery, cancellations, returns, replacements and refunds follow our Shipping & Delivery, Cancellation, and Returns & Refunds policies, which form part of these terms.',
        ],
      },
      {
        heading: 'Website content',
        body: [
          'The photos, videos, text and designs on this website belong to Pranavanaada. Please do not copy or reuse them without our written permission.',
        ],
      },
      {
        heading: 'Liability',
        body: [
          'To the extent permitted by law, our responsibility for any order is limited to the amount paid for that order.',
        ],
      },
      {
        heading: 'Governing law',
        body: ['These terms are governed by the laws of India. Any dispute will be handled by the courts at Bengaluru, Karnataka.'],
      },
      {
        heading: 'Changes',
        body: ['We may update these terms from time to time. The version on the website when you place an order applies to that order.'],
      },
      { heading: 'Contact', body: [CONTACT_EN] },
    ],
  },
  {
    slug: 'privacy',
    title: 'Privacy Policy',
    short: 'Privacy',
    intro: `This policy explains what personal information ${BUSINESS.split(',')[0]} collects and how it is used.`,
    sections: [
      {
        heading: 'What we collect',
        body: [
          [
            'When you order: your name, phone number, email, delivery address, GSTIN (if you give one) and the details of your order.',
            'When you send an enquiry: your name, contact details and message.',
            'When you report a problem with an order: the photos and videos you upload and your refund details (UPI ID or bank details, for pay-on-delivery orders).',
          ],
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To process and deliver your order, contact you about it, send order updates by email or WhatsApp, handle returns, replacements and refunds, answer your enquiries, and keep the records required for accounting and tax.',
        ],
      },
      {
        heading: 'Payments',
        body: [
          'Online payments are handled by Razorpay. We receive only the payment status and a reference number — never your card, UPI PIN or bank login details.',
        ],
      },
      {
        heading: 'Who we share it with',
        body: [
          'Only with those who help us serve you: courier and delivery partners (your name, phone number and address), and the services that run this website — hosting (Vercel), database and file storage (Supabase) and email (Resend). We do not sell your information or use it for advertising.',
        ],
      },
      {
        heading: 'On your device',
        body: [
          'The website remembers your enquiry list, language choice and checkout details in your browser so you don’t have to type them again. We do not use advertising trackers.',
        ],
      },
      {
        heading: 'How long we keep it',
        body: ['Order records are kept for as long as the law requires for accounting and tax. Return photos and videos are kept until the request is closed and any follow-up period ends.'],
      },
      {
        heading: 'Your choices',
        body: ['You can ask for a copy of your information, or ask us to correct or delete it (except records we must keep by law) — just email us.'],
      },
      { heading: 'Contact', body: [CONTACT_EN] },
    ],
  },
];

const kn: Policy[] = [
  {
    slug: 'returns',
    title: 'ಹಿಂತಿರುಗಿಸುವಿಕೆ, ಬದಲಿ ಮತ್ತು ಮರುಪಾವತಿ',
    short: 'ಹಿಂತಿರುಗಿಸುವಿಕೆ ಮತ್ತು ಮರುಪಾವತಿ',
    intro:
      'ಪ್ರತಿ ಪ್ರಣವನಾದ ಘಂಟೆಯನ್ನು ಕೈಯಿಂದ ತಯಾರಿಸಿ, ಪ್ಯಾಕ್ ಮಾಡುವ ಮೊದಲು ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಆರ್ಡರ್ ಹಾನಿಗೊಂಡು ತಲುಪಿದರೆ ಅಥವಾ ತಯಾರಿಕೆಯ ದೋಷವಿದ್ದರೆ, ನಾವು ಅದನ್ನು ಬದಲಿಸುತ್ತೇವೆ ಅಥವಾ ಹಣ ಮರುಪಾವತಿಸುತ್ತೇವೆ.',
    sections: [
      {
        heading: 'ಯಾವುದನ್ನು ಹಿಂತಿರುಗಿಸಬಹುದು',
        body: ['ಸಾಗಣೆಯಲ್ಲಿ ಹಾನಿಗೊಂಡು ತಲುಪಿದ ಅಥವಾ ತಯಾರಿಕೆಯ ದೋಷವಿರುವ ವಸ್ತುಗಳು — ಉದಾಹರಣೆಗೆ ಬಿರುಕು, ಮುರಿದ ಭಾಗ, ಅಥವಾ ಸರಿಯಾಗಿ ನಾದ ಮಾಡದ ಘಂಟೆ.'],
      },
      {
        heading: 'ವಿತರಣೆಯ 3 ದಿನಗಳೊಳಗೆ ತಿಳಿಸಿ',
        body: [
          'ವಿತರಣೆಯಾದ 3 ದಿನಗಳೊಳಗೆ ಸಮಸ್ಯೆಯನ್ನು ತಿಳಿಸಿ — ನಿಮ್ಮ ಆರ್ಡರ್ ಪುಟದಲ್ಲಿನ "ಸಮಸ್ಯೆ ತಿಳಿಸಿ" ಬಳಸಿ (ಲಿಂಕ್ ನಿಮ್ಮ ಆರ್ಡರ್ ಇಮೇಲ್‌ಗಳಲ್ಲಿದೆ), ಅಥವಾ +91 8050124365 ಗೆ WhatsApp ಮಾಡಿ. 3 ದಿನಗಳ ನಂತರದ ವಿನಂತಿಗಳನ್ನು ಸ್ವೀಕರಿಸಲಾಗುವುದಿಲ್ಲ.',
        ],
      },
      {
        heading: 'ಅನ್‌ಬಾಕ್ಸಿಂಗ್ ವಿಡಿಯೋ ಅಗತ್ಯ',
        body: [
          'ಪ್ಯಾಕೇಜ್ ತೆರೆಯುವಾಗ ಒಂದೇ ನಿರಂತರ ವಿಡಿಯೋ ಮಾಡಿ — ಶಿಪ್ಪಿಂಗ್ ಲೇಬಲ್ ಕಾಣುವಂತೆ ಮುಚ್ಚಿದ ಪ್ಯಾಕೇಜ್‌ನಿಂದ ಆರಂಭಿಸಿ, ಹಾನಿ ಅಥವಾ ದೋಷವನ್ನು ತೋರಿಸಿ. ಅನ್‌ಬಾಕ್ಸಿಂಗ್ ವಿಡಿಯೋ ಇಲ್ಲದೆ ಹಾನಿ ಅಥವಾ ದೋಷದ ದೂರನ್ನು ಸ್ವೀಕರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಫೋಟೋಗಳನ್ನೂ ಕಳುಹಿಸಬಹುದು.',
        ],
      },
      {
        heading: 'ಇವುಗಳಿಗೆ ಅನ್ವಯಿಸುವುದಿಲ್ಲ',
        body: [
          [
            'ಹೊಳಪು, ಬಣ್ಣ, ಮೇಲ್ಮೈ, ಗಾತ್ರ, ತೂಕ ಅಥವಾ ನಾದದಲ್ಲಿನ ಸಣ್ಣ ವ್ಯತ್ಯಾಸಗಳು — ಕೈಯಿಂದ ತಯಾರಿಸಿದ ಪಂಚಲೋಹ ವಸ್ತುಗಳಲ್ಲಿ ಇವು ಸಹಜ, ದೋಷಗಳಲ್ಲ.',
            'ವಿತರಣೆಯ ನಂತರ ಬಳಕೆ ಅಥವಾ ಅಜಾಗರೂಕತೆಯಿಂದಾದ ಸವೆತ, ಗೀರು ಅಥವಾ ಹಾನಿ.',
            'ಮನಸ್ಸು ಬದಲಾದರೆ, ಅಥವಾ ತಪ್ಪು ವಸ್ತು ಅಥವಾ ತೂಕ ಆರ್ಡರ್ ಮಾಡಿದ್ದರೆ.',
            'ಪೂರ್ಣವಾಗಿ (ಕೋಲು ಮತ್ತು ಇತರ ಭಾಗಗಳೊಂದಿಗೆ) ಮತ್ತು ತಲುಪಿದ ಸ್ಥಿತಿಯಲ್ಲೇ ಹಿಂತಿರುಗಿಸದ ವಸ್ತುಗಳು.',
          ],
        ],
      },
      {
        heading: 'ವಸ್ತುವನ್ನು ಹಿಂದಕ್ಕೆ ಕಳುಹಿಸುವುದು',
        body: [
          'ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ನಾವು ಅನುಮೋದಿಸಿದ ನಂತರ, ನಮ್ಮ ವಿಳಾಸವನ್ನು ಇಮೇಲ್ ಮಾಡುತ್ತೇವೆ. ಎಲ್ಲಾ ಭಾಗಗಳೊಂದಿಗೆ ವಸ್ತುವನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಪ್ಯಾಕ್ ಮಾಡಿ, ಆರ್ಡರ್ ಸಂಖ್ಯೆಯ ಚೀಟಿ ಇಟ್ಟು, ಟ್ರ್ಯಾಕ್ ಮಾಡಬಹುದಾದ ಕೊರಿಯರ್ ಮೂಲಕ ಕಳುಹಿಸಿ. ಹಿಂತಿರುಗಿಸುವ ಸಾಗಣೆ ವೆಚ್ಚ ನಿಮ್ಮದು.',
        ],
      },
      {
        heading: 'ಮರುಪಾವತಿ ಅಥವಾ ಬದಲಿ — ನಿಮ್ಮ ಆಯ್ಕೆ',
        body: [
          'ವಸ್ತು ನಮಗೆ ತಲುಪಿ, ಸಮಸ್ಯೆಯನ್ನು ಪರಿಶೀಲಿಸಿದ ನಂತರ:',
          [
            'ಬದಲಿ: ಹೊಸ ವಸ್ತುವನ್ನು ನಮ್ಮ ವೆಚ್ಚದಲ್ಲಿ ಕಳುಹಿಸುತ್ತೇವೆ.',
            'ಆನ್‌ಲೈನ್ ಪಾವತಿಗೆ ಮರುಪಾವತಿ: ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ (ಕಾರ್ಡ್, UPI ಅಥವಾ ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್).',
            'ವಿತರಣೆಯ ಸಮಯದ ಪಾವತಿ (COD) ಆರ್ಡರ್‌ಗಳಿಗೆ: ನೀವು ನೀಡುವ UPI ಅಥವಾ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ.',
          ],
          'ಪರಿಶೀಲನೆಯ 2 ಕೆಲಸದ ದಿನಗಳೊಳಗೆ ಮರುಪಾವತಿ ಆರಂಭಿಸುತ್ತೇವೆ. ಹಣ ನಿಮ್ಮ ಖಾತೆಯಲ್ಲಿ ಕಾಣಲು ಬ್ಯಾಂಕ್‌ಗೆ 5–7 ಕೆಲಸದ ದಿನಗಳು ಬೇಕಾಗಬಹುದು. ವಿತರಣಾ ಶುಲ್ಕವನ್ನು ಮರುಪಾವತಿಸಲಾಗುವುದಿಲ್ಲ.',
        ],
      },
      { heading: 'ಪ್ರಶ್ನೆಗಳು', body: [CONTACT_KN] },
    ],
  },
  {
    slug: 'shipping',
    title: 'ಸಾಗಣೆ ಮತ್ತು ವಿತರಣೆ',
    short: 'ಸಾಗಣೆ',
    sections: [
      { heading: 'ಎಲ್ಲಿಗೆ ವಿತರಿಸುತ್ತೇವೆ', body: ['ಭಾರತದಾದ್ಯಂತ ವಿತರಿಸುತ್ತೇವೆ.'] },
      {
        heading: 'ವಿತರಣಾ ಸಮಯ',
        body: [
          [
            'ಬೆಂಗಳೂರು: ಮಧ್ಯಾಹ್ನ 12 ಗಂಟೆಯೊಳಗಿನ ಆರ್ಡರ್‌ಗಳಿಗೆ ಅದೇ ದಿನ, ಇಲ್ಲದಿದ್ದರೆ ಮರುದಿನ.',
            'ಕರ್ನಾಟಕದ ಇತರೆಡೆ: 1–2 ದಿನಗಳು.',
            'ಇತರ ರಾಜ್ಯಗಳು: 3–4 ದಿನಗಳು.',
          ],
          'ನಿರೀಕ್ಷಿತ ವಿತರಣಾ ದಿನಾಂಕವನ್ನು ಚೆಕ್‌ಔಟ್‌ನಲ್ಲಿ ಮತ್ತು ಆರ್ಡರ್ ದೃಢೀಕರಣದಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ. ಇವು ಅಂದಾಜುಗಳು — ಕೊರಿಯರ್ ವಿಳಂಬ, ರಜೆಗಳು ಅಥವಾ ಹವಾಮಾನದಿಂದ ಕೆಲವೊಮ್ಮೆ ತಡವಾಗಬಹುದು; ಹಾಗಾದರೆ ನಿಮಗೆ ತಿಳಿಸುತ್ತೇವೆ.',
        ],
      },
      { heading: 'ವಿತರಣಾ ಶುಲ್ಕ', body: ['ಯಾವುದೇ ವಿತರಣಾ ಶುಲ್ಕವಿದ್ದರೆ ಆರ್ಡರ್ ಮಾಡುವ ಮೊದಲೇ ಚೆಕ್‌ಔಟ್‌ನಲ್ಲಿ ತೋರಿಸಲಾಗುತ್ತದೆ.'] },
      {
        heading: 'ಪಾವತಿ ಆಯ್ಕೆಗಳು',
        body: [
          'ಆನ್‌ಲೈನ್ ಪಾವತಿ (UPI, ಕಾರ್ಡ್, ನೆಟ್ ಬ್ಯಾಂಕಿಂಗ್ — Razorpay ಮೂಲಕ ಸುರಕ್ಷಿತವಾಗಿ) ಅಥವಾ ವಿತರಣೆಯ ಸಮಯದಲ್ಲಿ ನಗದು / UPI. ನಿರ್ದಿಷ್ಟ ಮೊತ್ತದ ಮೇಲಿನ ಆರ್ಡರ್‌ಗಳಿಗೆ ವಿತರಣೆಯ ಸಮಯದ ಪಾವತಿ ಲಭ್ಯವಿಲ್ಲದಿರಬಹುದು; ನಿಮ್ಮ ಆರ್ಡರ್‌ಗೆ ಲಭ್ಯವಿರುವುದನ್ನು ಚೆಕ್‌ಔಟ್ ತೋರಿಸುತ್ತದೆ.',
        ],
      },
      {
        heading: 'ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್ ಮಾಡುವುದು',
        body: ['ನಿಮ್ಮ ಆರ್ಡರ್ ಪುಟ (ಲಿಂಕ್ ಆರ್ಡರ್ ಇಮೇಲ್‌ಗಳಲ್ಲಿದೆ) ಇತ್ತೀಚಿನ ಸ್ಥಿತಿಯನ್ನು ತೋರಿಸುತ್ತದೆ. ಇಮೇಲ್ ಮೂಲಕವೂ ಮಾಹಿತಿ ಕಳುಹಿಸುತ್ತೇವೆ, ವಿತರಣೆಗಾಗಿ ಕರೆ ಅಥವಾ WhatsApp ಮಾಡಬಹುದು.'],
      },
      {
        heading: 'ಆರ್ಡರ್ ಸ್ವೀಕರಿಸುವಾಗ',
        body: [
          'ಸರಿಯಾದ ವಿಳಾಸ ಮತ್ತು ವಿತರಣೆಯ ದಿನ ಸಂಪರ್ಕಿಸಬಹುದಾದ ಫೋನ್ ಸಂಖ್ಯೆ ನೀಡಿ. ತಪ್ಪು ವಿಳಾಸ ಅಥವಾ ಯಾರೂ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ವಿತರಣೆ ವಿಫಲವಾದರೆ, ಮರು-ವಿತರಣೆಗೆ ಹೆಚ್ಚುವರಿ ಶುಲ್ಕ ಆಗಬಹುದು.',
          'ಪ್ಯಾಕೇಜ್ ತೆರೆಯುವಾಗ ಅನ್‌ಬಾಕ್ಸಿಂಗ್ ವಿಡಿಯೋ ಮಾಡಿ — ಏನಾದರೂ ಹಾನಿಯಾಗಿದ್ದರೆ ಅದು ಅಗತ್ಯ (ಹಿಂತಿರುಗಿಸುವಿಕೆ ಮತ್ತು ಮರುಪಾವತಿ ನೋಡಿ).',
        ],
      },
      { heading: 'ಪ್ರಶ್ನೆಗಳು', body: [CONTACT_KN] },
    ],
  },
  {
    slug: 'cancellation',
    title: 'ರದ್ದತಿ ನೀತಿ',
    short: 'ರದ್ದತಿ',
    sections: [
      {
        heading: 'ರವಾನೆಗೆ ಮುನ್ನ — ಯಾವಾಗ ಬೇಕಾದರೂ ರದ್ದುಮಾಡಿ',
        body: [
          'ಆರ್ಡರ್ ರವಾನೆಯಾಗುವವರೆಗೆ ಯಾವಾಗ ಬೇಕಾದರೂ ನಿಮ್ಮ ಆರ್ಡರ್ ಪುಟದಲ್ಲಿನ "ಆರ್ಡರ್ ರದ್ದುಮಾಡಿ" ಬಳಸಿ ಅಥವಾ ನಮಗೆ ಕರೆ / WhatsApp ಮಾಡಿ ರದ್ದುಮಾಡಬಹುದು. ರದ್ದತಿ ಶುಲ್ಕವಿಲ್ಲ.',
          [
            'ಆನ್‌ಲೈನ್ ಪಾವತಿ: ಪೂರ್ಣ ಮೊತ್ತ ಮೂಲ ಪಾವತಿ ವಿಧಾನಕ್ಕೆ ಮರುಪಾವತಿ. ತಕ್ಷಣ ಆರಂಭವಾಗುತ್ತದೆ; ಬ್ಯಾಂಕ್‌ನಲ್ಲಿ ಕಾಣಲು 5–7 ಕೆಲಸದ ದಿನಗಳು ಬೇಕಾಗಬಹುದು.',
            'ವಿತರಣೆಯ ಸಮಯದ ಪಾವತಿ: ಯಾವುದೇ ಪಾವತಿ ಇಲ್ಲ.',
          ],
        ],
      },
      {
        heading: 'ರವಾನೆಯ ನಂತರ',
        body: ['ರವಾನೆಯಾದ ಆರ್ಡರ್ ರದ್ದುಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ಅದು ಹಾನಿಗೊಂಡು ಅಥವಾ ದೋಷದೊಂದಿಗೆ ತಲುಪಿದರೆ, ಹಿಂತಿರುಗಿಸುವಿಕೆ ಮತ್ತು ಮರುಪಾವತಿ ನೀತಿ ನೋಡಿ.'],
      },
      {
        heading: 'ನಾವೇ ರದ್ದುಮಾಡಬೇಕಾದರೆ',
        body: ['ಅಪರೂಪವಾಗಿ, ವಸ್ತು ಲಭ್ಯವಿಲ್ಲದಿದ್ದರೆ ಅಥವಾ ವಿಳಾಸಕ್ಕೆ ವಿತರಿಸಲು ಸಾಧ್ಯವಾಗದಿದ್ದರೆ ಆರ್ಡರ್ ರದ್ದುಮಾಡಬೇಕಾಗಬಹುದು. ನಿಮಗೆ ತಿಳಿಸಿ, ಪೂರ್ಣ ಮೊತ್ತವನ್ನು ಮರುಪಾವತಿಸುತ್ತೇವೆ.'],
      },
      { heading: 'ಪ್ರಶ್ನೆಗಳು', body: [CONTACT_KN] },
    ],
  },
  {
    slug: 'terms',
    title: 'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು',
    short: 'ನಿಯಮಗಳು',
    intro: `ಈ ವೆಬ್‌ಸೈಟ್ ಅನ್ನು ${BUSINESS} ನಡೆಸುತ್ತದೆ. ವೆಬ್‌ಸೈಟ್ ಬಳಸುವ ಅಥವಾ ಆರ್ಡರ್ ಮಾಡುವ ಮೂಲಕ ನೀವು ಈ ನಿಯಮಗಳಿಗೆ ಒಪ್ಪುತ್ತೀರಿ. (ವ್ಯತ್ಯಾಸವಿದ್ದಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ಆವೃತ್ತಿ ಅನ್ವಯಿಸುತ್ತದೆ.)`,
    sections: [
      {
        heading: 'ನಮ್ಮ ಉತ್ಪನ್ನಗಳು',
        body: ['ನಮ್ಮ ಘಂಟೆಗಳನ್ನು ಪಂಚಲೋಹದಿಂದ ಕೈಯಿಂದ ತಯಾರಿಸಲಾಗುತ್ತದೆ. ಫೋಟೋ ಮತ್ತು ವಿಡಿಯೋಗಳು ಉತ್ಪನ್ನವನ್ನು ಸಾಧ್ಯವಾದಷ್ಟು ನಿಖರವಾಗಿ ತೋರಿಸುತ್ತವೆ, ಆದರೆ ಪ್ರತಿ ವಸ್ತು ಸ್ವಲ್ಪ ಭಿನ್ನ: ಹೊಳಪು, ಬಣ್ಣ, ಗಾತ್ರ, ತೂಕ ಮತ್ತು ನಾದದಲ್ಲಿನ ಸಣ್ಣ ವ್ಯತ್ಯಾಸಗಳು ಸಹಜ, ದೋಷಗಳಲ್ಲ. ನೀಡಿರುವ ತೂಕ ಮತ್ತು ಗಾತ್ರಗಳು ಅಂದಾಜು.'],
      },
      {
        heading: 'ಬೆಲೆ ಮತ್ತು ಪಾವತಿ',
        body: ['ಬೆಲೆಗಳು ಭಾರತೀಯ ರೂಪಾಯಿಯಲ್ಲಿ (₹), ಆರ್ಡರ್ ಮಾಡುವಾಗ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ತೋರಿಸಿದಂತೆ. ಆನ್‌ಲೈನ್ ಪಾವತಿಯನ್ನು Razorpay ಸುರಕ್ಷಿತವಾಗಿ ನಿರ್ವಹಿಸುತ್ತದೆ — ನಿಮ್ಮ ಕಾರ್ಡ್ ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರಗಳನ್ನು ನಾವು ನೋಡುವುದಿಲ್ಲ, ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ.'],
      },
      {
        heading: 'ಆರ್ಡರ್‌ಗಳು',
        body: ['ಆರ್ಡರ್ ಮಾಡಿದಾಗ ಇಮೇಲ್ ಬರುತ್ತದೆ. ವಿವರಗಳನ್ನು ಖಚಿತಪಡಿಸಲು ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಬಹುದು. ಬೆಲೆಯ ತಪ್ಪು ಅಥವಾ ವಸ್ತು ಲಭ್ಯವಿಲ್ಲದಂತಹ ಸಂದರ್ಭಗಳಲ್ಲಿ ಆರ್ಡರ್ ನಿರಾಕರಿಸಬಹುದು ಅಥವಾ ರದ್ದುಮಾಡಬಹುದು — ಆಗ ಪಾವತಿಸಿದ ಪೂರ್ಣ ಮೊತ್ತವನ್ನು ಮರುಪಾವತಿಸುತ್ತೇವೆ.'],
      },
      {
        heading: 'ವಿತರಣೆ, ರದ್ದತಿ ಮತ್ತು ಹಿಂತಿರುಗಿಸುವಿಕೆ',
        body: ['ಇವು ನಮ್ಮ ಸಾಗಣೆ ಮತ್ತು ವಿತರಣೆ, ರದ್ದತಿ, ಮತ್ತು ಹಿಂತಿರುಗಿಸುವಿಕೆ ಮತ್ತು ಮರುಪಾವತಿ ನೀತಿಗಳ ಪ್ರಕಾರ — ಅವು ಈ ನಿಯಮಗಳ ಭಾಗ.'],
      },
      {
        heading: 'ವೆಬ್‌ಸೈಟ್ ವಿಷಯ',
        body: ['ಈ ವೆಬ್‌ಸೈಟ್‌ನ ಫೋಟೋ, ವಿಡಿಯೋ, ಬರಹ ಮತ್ತು ವಿನ್ಯಾಸಗಳು ಪ್ರಣವನಾದಕ್ಕೆ ಸೇರಿವೆ. ನಮ್ಮ ಲಿಖಿತ ಅನುಮತಿಯಿಲ್ಲದೆ ನಕಲಿಸಬೇಡಿ ಅಥವಾ ಮರುಬಳಸಬೇಡಿ.'],
      },
      { heading: 'ಹೊಣೆಗಾರಿಕೆ', body: ['ಕಾನೂನು ಅನುಮತಿಸುವ ಮಟ್ಟಿಗೆ, ಯಾವುದೇ ಆರ್ಡರ್‌ಗೆ ನಮ್ಮ ಹೊಣೆ ಆ ಆರ್ಡರ್‌ಗೆ ಪಾವತಿಸಿದ ಮೊತ್ತಕ್ಕೆ ಸೀಮಿತ.'] },
      { heading: 'ಅನ್ವಯಿಸುವ ಕಾನೂನು', body: ['ಈ ನಿಯಮಗಳಿಗೆ ಭಾರತದ ಕಾನೂನುಗಳು ಅನ್ವಯಿಸುತ್ತವೆ. ಯಾವುದೇ ವಿವಾದವನ್ನು ಬೆಂಗಳೂರು, ಕರ್ನಾಟಕದ ನ್ಯಾಯಾಲಯಗಳು ನಿರ್ವಹಿಸುತ್ತವೆ.'] },
      { heading: 'ಬದಲಾವಣೆಗಳು', body: ['ಈ ನಿಯಮಗಳನ್ನು ಆಗಾಗ ನವೀಕರಿಸಬಹುದು. ಆರ್ಡರ್ ಮಾಡಿದಾಗ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿದ್ದ ಆವೃತ್ತಿ ಆ ಆರ್ಡರ್‌ಗೆ ಅನ್ವಯಿಸುತ್ತದೆ.'] },
      { heading: 'ಸಂಪರ್ಕ', body: [CONTACT_KN] },
    ],
  },
  {
    slug: 'privacy',
    title: 'ಗೌಪ್ಯತಾ ನೀತಿ',
    short: 'ಗೌಪ್ಯತೆ',
    intro: 'ಪ್ರಣವನಾದ ಯಾವ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಸಂಗ್ರಹಿಸುತ್ತದೆ ಮತ್ತು ಅದನ್ನು ಹೇಗೆ ಬಳಸುತ್ತದೆ ಎಂಬುದನ್ನು ಈ ನೀತಿ ವಿವರಿಸುತ್ತದೆ.',
    sections: [
      {
        heading: 'ನಾವು ಸಂಗ್ರಹಿಸುವುದು',
        body: [
          [
            'ಆರ್ಡರ್ ಮಾಡುವಾಗ: ನಿಮ್ಮ ಹೆಸರು, ಫೋನ್ ಸಂಖ್ಯೆ, ಇಮೇಲ್, ವಿತರಣಾ ವಿಳಾಸ, GSTIN (ನೀಡಿದ್ದರೆ) ಮತ್ತು ಆರ್ಡರ್ ವಿವರಗಳು.',
            'ವಿಚಾರಣೆ ಕಳುಹಿಸುವಾಗ: ನಿಮ್ಮ ಹೆಸರು, ಸಂಪರ್ಕ ವಿವರ ಮತ್ತು ಸಂದೇಶ.',
            'ಆರ್ಡರ್ ಸಮಸ್ಯೆ ತಿಳಿಸುವಾಗ: ನೀವು ಅಪ್‌ಲೋಡ್ ಮಾಡುವ ಫೋಟೋ, ವಿಡಿಯೋ ಮತ್ತು ಮರುಪಾವತಿ ವಿವರ (COD ಆರ್ಡರ್‌ಗಳಿಗೆ UPI ಅಥವಾ ಬ್ಯಾಂಕ್ ವಿವರ).',
          ],
        ],
      },
      {
        heading: 'ಹೇಗೆ ಬಳಸುತ್ತೇವೆ',
        body: ['ನಿಮ್ಮ ಆರ್ಡರ್ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಿ ವಿತರಿಸಲು, ಅದರ ಬಗ್ಗೆ ಸಂಪರ್ಕಿಸಲು, ಇಮೇಲ್ / WhatsApp ಮೂಲಕ ಮಾಹಿತಿ ಕಳುಹಿಸಲು, ಹಿಂತಿರುಗಿಸುವಿಕೆ, ಬದಲಿ ಮತ್ತು ಮರುಪಾವತಿ ನಿರ್ವಹಿಸಲು, ವಿಚಾರಣೆಗಳಿಗೆ ಉತ್ತರಿಸಲು ಮತ್ತು ಲೆಕ್ಕಪತ್ರ / ತೆರಿಗೆಗೆ ಅಗತ್ಯವಾದ ದಾಖಲೆಗಳಿಗಾಗಿ.'],
      },
      {
        heading: 'ಪಾವತಿಗಳು',
        body: ['ಆನ್‌ಲೈನ್ ಪಾವತಿಗಳನ್ನು Razorpay ನಿರ್ವಹಿಸುತ್ತದೆ. ನಮಗೆ ಪಾವತಿಯ ಸ್ಥಿತಿ ಮತ್ತು ಉಲ್ಲೇಖ ಸಂಖ್ಯೆ ಮಾತ್ರ ಬರುತ್ತದೆ — ನಿಮ್ಮ ಕಾರ್ಡ್, UPI PIN ಅಥವಾ ಬ್ಯಾಂಕ್ ಲಾಗಿನ್ ವಿವರಗಳಲ್ಲ.'],
      },
      {
        heading: 'ಯಾರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳುತ್ತೇವೆ',
        body: ['ನಿಮ್ಮ ಸೇವೆಗೆ ಸಹಾಯ ಮಾಡುವವರೊಂದಿಗೆ ಮಾತ್ರ: ಕೊರಿಯರ್ / ವಿತರಣಾ ಪಾಲುದಾರರು (ಹೆಸರು, ಫೋನ್, ವಿಳಾಸ), ಮತ್ತು ಈ ವೆಬ್‌ಸೈಟ್ ನಡೆಸುವ ಸೇವೆಗಳು — ಹೋಸ್ಟಿಂಗ್ (Vercel), ಡೇಟಾಬೇಸ್ ಮತ್ತು ಫೈಲ್ ಸಂಗ್ರಹ (Supabase), ಇಮೇಲ್ (Resend). ನಿಮ್ಮ ಮಾಹಿತಿಯನ್ನು ಮಾರುವುದಿಲ್ಲ, ಜಾಹೀರಾತಿಗೆ ಬಳಸುವುದಿಲ್ಲ.'],
      },
      {
        heading: 'ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ',
        body: ['ವಿಚಾರಣಾ ಪಟ್ಟಿ, ಭಾಷೆ ಮತ್ತು ಚೆಕ್‌ಔಟ್ ವಿವರಗಳನ್ನು ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ನೆನಪಿಟ್ಟುಕೊಳ್ಳಲಾಗುತ್ತದೆ, ಮತ್ತೆ ಟೈಪ್ ಮಾಡಬೇಕಿಲ್ಲ. ಜಾಹೀರಾತು ಟ್ರ್ಯಾಕರ್‌ಗಳನ್ನು ಬಳಸುವುದಿಲ್ಲ.'],
      },
      {
        heading: 'ಎಷ್ಟು ಕಾಲ ಇಡುತ್ತೇವೆ',
        body: ['ಲೆಕ್ಕಪತ್ರ ಮತ್ತು ತೆರಿಗೆ ಕಾನೂನು ಅಗತ್ಯವಿರುವಷ್ಟು ಕಾಲ ಆರ್ಡರ್ ದಾಖಲೆಗಳನ್ನು ಇಡುತ್ತೇವೆ. ಹಿಂತಿರುಗಿಸುವಿಕೆಯ ಫೋಟೋ / ವಿಡಿಯೋಗಳನ್ನು ವಿನಂತಿ ಮುಗಿಯುವವರೆಗೆ ಇಡುತ್ತೇವೆ.'],
      },
      {
        heading: 'ನಿಮ್ಮ ಆಯ್ಕೆಗಳು',
        body: ['ನಿಮ್ಮ ಮಾಹಿತಿಯ ಪ್ರತಿ ಕೇಳಬಹುದು, ಅಥವಾ ತಿದ್ದಲು / ಅಳಿಸಲು ಕೇಳಬಹುದು (ಕಾನೂನು ಪ್ರಕಾರ ಇಡಬೇಕಾದ ದಾಖಲೆಗಳನ್ನು ಹೊರತುಪಡಿಸಿ) — ನಮಗೆ ಇಮೇಲ್ ಮಾಡಿ.'],
      },
      { heading: 'ಸಂಪರ್ಕ', body: [CONTACT_KN] },
    ],
  },
];

export const POLICIES: Record<'en' | 'kn', Policy[]> = { en, kn };

export const findPolicy = (lang: 'en' | 'kn', slug: string | undefined) => POLICIES[lang].find((p) => p.slug === slug);
