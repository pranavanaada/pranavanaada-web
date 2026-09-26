import type { Product, ProductVariant } from '../types/product';

// Optimized WebP versions of the photos in this folder. Full images (max 1400px
// wide) are used on the detail page/zoom; ~600px thumbs are used on cards.
import anjaneyaImg from '../assets/products/hand-bell-1.webp';
import anjaneyaThumb from '../assets/products/hand-bell-1-thumb.webp';
import anjaneyaCloseup from '../assets/products/anjaneya-closeup.webp';
import shankaChakraImg from '../assets/products/product-2.webp';
import shankaChakraThumb from '../assets/products/product-2-thumb.webp';
import shankaChakraCloseup from '../assets/products/shanka-chakra-closeup.webp';
import nandiImg from '../assets/products/product-5.webp';
import nandiThumb from '../assets/products/product-5-thumb.webp';
import nandiCloseup from '../assets/products/nandi-closeup.webp';
import pranavaImg from '../assets/products/pranava.webp';
import brahmandaGolaImg from '../assets/products/brahmanda-gola.webp';
import hangingBellImg from '../assets/products/hanging-bell-1.webp';
import hangingBellThumb from '../assets/products/hanging-bell-1-thumb.webp';
import jayaganteImg from '../assets/products/jayagante-1.webp';
import jayaganteThumb from '../assets/products/jayagante-1-thumb.webp';

// All five hand bell designs share the same price by weight.
const HAND_BELL_VARIANTS: ProductVariant[] = [
  { label: '1 kg', size: '9 in tall · 5 in wide', price: 10000 },
  { label: '1.5 kg', size: '10 in tall · 5.5 in wide', price: 12000 },
  { label: '2 kg', size: '11 in tall · 5.5 in wide', price: 14000 },
];

const HANGING_BELL_VARIANTS: ProductVariant[] = [
  { label: '2 kg', size: '7 in tall · 6 in dia.', price: 14000 },
  { label: '3.5 kg', size: '6 in tall · 6 in dia.', price: 16000 },
  { label: '5 kg', size: '9 in tall · 9 in dia.', price: 24000 },
  { label: '6 kg', size: '9 in tall · 9 in dia.', price: 26000 },
  { label: '12 kg', size: '10 in tall · 10 in dia.', price: 41000 },
];

const JAYAGANTE_VARIANTS: ProductVariant[] = [
  { label: '1000 g', size: '8 in long · 3 mm thick', price: 5000 },
  { label: '1500 g', size: '10 in long · 3 mm thick', price: 7000 },
];

/**
 * Local fallback catalog — used when Supabase isn't connected yet, and as the
 * seed data to insert into the `products` table (see supabase/schema.sql and
 * README.md → "Seeding your first products").
 *
 * Prices and sizes come from the GanteWebsite price list. The first four are
 * shown as "featured" on the home page.
 */
export const fallbackProducts: Product[] = [
  {
    id: 'anjaneya-hand-bell',
    name: 'Anjaneya Hand Bell',
    description: 'Panchaloha hand bell crowned with a finely cast Anjaneya (Hanuman) in namaskara pose, holding his gada.',
    name_kn: 'ಆಂಜನೇಯ ಕೈ ಘಂಟೆ',
    description_kn: 'ನಮಸ್ಕಾರ ಭಂಗಿಯಲ್ಲಿ ಗದೆ ಹಿಡಿದಿರುವ, ಸೂಕ್ಷ್ಮವಾಗಿ ಎರಕ ಹೊಯ್ದ ಆಂಜನೇಯನನ್ನು ಮೇಲ್ಭಾಗದಲ್ಲಿ ಹೊಂದಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
    price: 10000,
    category: 'hand-bell',
    image: anjaneyaImg,
    thumb: anjaneyaThumb,
    images: [anjaneyaCloseup],
    variants: HAND_BELL_VARIANTS,
    is_visible: true,
  },
  {
    id: 'shanka-chakra-hand-bell',
    name: 'Shanka Chakra Hand Bell',
    description: "Panchaloha hand bell topped with the Shanka–Chakra emblem of Lord Vishnu on a ribbed handle.",
    name_kn: 'ಶಂಖ ಚಕ್ರ ಕೈ ಘಂಟೆ',
    description_kn: 'ಉಂಗುರಗಳುಳ್ಳ ಹಿಡಿಕೆಯ ಮೇಲೆ ಶ್ರೀ ವಿಷ್ಣುವಿನ ಶಂಖ–ಚಕ್ರ ಲಾಂಛನವನ್ನು ಹೊಂದಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
    price: 10000,
    category: 'hand-bell',
    image: shankaChakraImg,
    thumb: shankaChakraThumb,
    images: [shankaChakraCloseup],
    variants: HAND_BELL_VARIANTS,
    is_visible: true,
  },
  {
    id: 'hanging-bell',
    name: 'Panchaloha Hanging Bell',
    description: 'Temple-style Panchaloha hanging bell with a deep, long-lasting resonance. Available from 2 kg up to 12 kg.',
    name_kn: 'ಪಂಚಲೋಹ ನೇತಾಡುವ ಘಂಟೆ',
    description_kn: 'ಆಳವಾದ, ದೀರ್ಘವಾಗಿ ಮೊಳಗುವ ನಾದದ ದೇವಾಲಯ ಶೈಲಿಯ ಪಂಚಲೋಹ ನೇತಾಡುವ ಘಂಟೆ. 2 ಕೆ.ಜಿ ಯಿಂದ 12 ಕೆ.ಜಿ ವರೆಗೆ ಲಭ್ಯ.',
    badge_kn: '5 ಅಳತೆಗಳು',
    price: 14000,
    category: 'hanging-bell',
    image: hangingBellImg,
    thumb: hangingBellThumb,
    variants: HANGING_BELL_VARIANTS,
    badge: '5 sizes',
    is_visible: true,
  },
  {
    id: 'jayagante',
    name: 'Panchaloha Jayagante',
    description: 'Traditional Panchaloha Jayagante (ritual gong) with a rich, ringing tone. Wooden striker stick included free.',
    name_kn: 'ಪಂಚಲೋಹ ಜಯಘಂಟೆ',
    description_kn: 'ಸಮೃದ್ಧ, ಮೊಳಗುವ ನಾದದ ಸಾಂಪ್ರದಾಯಿಕ ಪಂಚಲೋಹ ಜಯಘಂಟೆ. ಮರದ ಕೋಲು ಉಚಿತ.',
    badge_kn: 'ಮರದ ಕೋಲು ಉಚಿತ',
    price: 5000,
    category: 'jayagante',
    image: jayaganteImg,
    thumb: jayaganteThumb,
    variants: JAYAGANTE_VARIANTS,
    badge: 'Stick included',
    is_visible: true,
  },
  {
    id: 'nandi-hand-bell',
    name: 'Nandi Hand Bell',
    description: "Panchaloha hand bell topped with a seated Nandi, Lord Shiva's sacred bull, on a ribbed handle.",
    name_kn: 'ನಂದಿ ಕೈ ಘಂಟೆ',
    description_kn: 'ಉಂಗುರಗಳುಳ್ಳ ಹಿಡಿಕೆಯ ಮೇಲೆ ಶಿವನ ಪವಿತ್ರ ವಾಹನ ನಂದಿಯನ್ನು ಹೊಂದಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
    price: 10000,
    category: 'hand-bell',
    image: nandiImg,
    thumb: nandiThumb,
    images: [nandiCloseup],
    variants: HAND_BELL_VARIANTS,
    is_visible: true,
  },
  {
    id: 'pranava-hand-bell',
    name: 'Pranava Hand Bell',
    description: 'Panchaloha hand bell with the sacred Om (Pranava) engraved on its tapering finial.',
    name_kn: 'ಪ್ರಣವ ಕೈ ಘಂಟೆ',
    description_kn: 'ತುದಿಯಲ್ಲಿ ಪವಿತ್ರ ಓಂ (ಪ್ರಣವ) ಚಿಹ್ನೆಯನ್ನು ಕೆತ್ತಿರುವ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
    price: 10000,
    category: 'hand-bell',
    image: pranavaImg,
    variants: HAND_BELL_VARIANTS,
    is_visible: true,
  },
  {
    id: 'brahmanda-gola-hand-bell',
    name: 'Brahmanda Gola Hand Bell',
    description: 'Elegant Panchaloha hand bell with a rounded Brahmanda Gola finial and ribbed handle.',
    name_kn: 'ಬ್ರಹ್ಮಾಂಡ ಗೋಲ ಕೈ ಘಂಟೆ',
    description_kn: 'ದುಂಡಾದ ಬ್ರಹ್ಮಾಂಡ ಗೋಲ ತುದಿ ಮತ್ತು ಉಂಗುರಗಳುಳ್ಳ ಹಿಡಿಕೆಯ ಸೊಗಸಾದ ಪಂಚಲೋಹದ ಕೈ ಘಂಟೆ.',
    price: 10000,
    category: 'hand-bell',
    image: brahmandaGolaImg,
    variants: HAND_BELL_VARIANTS,
    is_visible: true,
  },
];
