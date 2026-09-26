import type { Review } from '../types/review';

import gopikrishnaDeshpandePhoto from '../assets/reviewers/gopikrishna-deshpande.webp';
import drNarendraKumarPhoto from '../assets/reviewers/dr-narendra-kumar.webp';
import drMKRaghavendraPhoto from '../assets/reviewers/dr-m-k-raghavendra.webp';
import drPuneethPadmanabhanPhoto from '../assets/reviewers/dr-puneeth-padmanabhan.webp';
import vidwanNarasimhaBhatBadaguPhoto from '../assets/reviewers/vidwan-narasimha-bhat-badagu.webp';
import vidwanPandurangJoshiPhoto from '../assets/reviewers/vidwan-pandurang-joshi.webp';
import drJeevanChakravarthyASPhoto from '../assets/reviewers/dr-jeevan-chakravarthy-a-s.webp';
import yogacharyaShriUmamaheshwarGurujiPhoto from '../assets/reviewers/yogacharya-shri-umamaheshwar-guruji.webp';
import jothsnaAPhoto from '../assets/reviewers/jothsna-a.webp';
import shriSubrahmanyaSomayajiPhoto from '../assets/reviewers/shri-subrahmanya-somayaji.webp';
import vidwanSriJagadeshSharmaSampaPhoto from '../assets/reviewers/vidwan-sri-jagadesh-sharma-sampa.webp';

/**
 * Customer reviews carried over from the GanteWebsite "Divine Experiences" page
 * (English) and the original Kannada site (`*_kn` fields), in the order those
 * sites showed them. Photos are 160px square avatars.
 */
export const reviews: Review[] = [
  {
    id: "gopikrishna-deshpande",
    name: "Gopikrishna Deshpande",
    title: "Professor, MRI Research Center · Department of Electrical and Computer Engineering, Department of Psychological Sciences, Center for Neuroscience · Auburn University, USA",
    photo: gopikrishnaDeshpandePhoto,
    text: [
      "I highly recommend the bells created by Mr Vadiraj from Pranavanaada. He has a deep understanding of how to create that perfect bell with a divine sound and is committed to the cause. He is not in it just for the business. The sounds from the bells themselves are some of the best I have come across in my life",
    ],
    name_kn: "ಗೋಪಿಕೃಷ್ಣ ದೇಶಪಾಂಡೆ",
    title_kn: "ಪ್ರಾಧ್ಯಾಪಕರು, ಎಂಆರ್ಐ ಸಂಶೋಧನಾ ಕೇಂದ್ರ · ಎಲೆಕ್ಟ್ರಿಕಲ್ ಮತ್ತು ಕಂಪ್ಯೂಟರ್ ಎಂಜಿನಿಯರಿಂಗ್ ವಿಭಾಗ, ಮಾನಸಿಕ ವಿಜ್ಞಾನ ವಿಭಾಗ, ನರವಿಜ್ಞಾನ ಕೇಂದ್ರ · ಆಬರ್ನ್ ವಿಶ್ವವಿದ್ಯಾಲಯ, ಯುಎಸ್ಎ",
    text_kn: [
      "ಪ್ರಣವನಾಡದ ಶ್ರೀ ವಾದಿರಾಜ್ ರಚಿಸಿದ ಗಂಟೆಗಳನ್ನು ನಾನು ಹೆಚ್ಚು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ. ದೈವಿಕ ಧ್ವನಿಯೊಂದಿಗೆ ಆ ಪರಿಪೂರ್ಣ ಗಂಟೆಯನ್ನು ಹೇಗೆ ರಚಿಸುವುದು ಎಂಬುದರ ಬಗ್ಗೆ ಅವರಿಗೆ ಆಳವಾದ ತಿಳುವಳಿಕೆ ಇದೆ ಮತ್ತು ಆ ಉದ್ದೇಶಕ್ಕೆ ಬದ್ಧರಾಗಿದ್ದಾರೆ. ಅವರು ಕೇವಲ ವ್ಯವಹಾರಕ್ಕಾಗಿ ಅದರಲ್ಲಿಲ್ಲ. ಗಂಟೆಗಳಿಂದ ಬರುವ ಶಬ್ದಗಳು ನನ್ನ ಜೀವನದಲ್ಲಿ ನಾನು ಕಂಡ ಕೆಲವು ಅತ್ಯುತ್ತಮವಾದವುಗಳಾಗಿವೆ",
    ],
  },
  {
    id: "dr-narendra-kumar",
    name: "Dr. Narendra kumar",
    title: "Professor, Artificial Intelligence and Machine Learning · Visvesvaraya Technological University",
    photo: drNarendraKumarPhoto,
    text: [
      "Creation of this divine bell by Mr Vadiraj is truly remarkable, as it embodies the profound connection between the Ghanta and the Pranava sound (AUM). The sacred harmony it produces evokes a deep reverence for the wisdom of the Indian sages, beautifully capturing the timeless link between the bell's physical sound and the cosmic vibrations of the universe. The imagery of the Ghanta guiding us inward and uniting us with the eternal is especially powerful, resonating with the very essence of spiritual enlightenment. We are deeply grateful for this exquisite masterpiece that serves as a beacon of spiritual connection and inner peace.",
    ],
    name_kn: "ಡಾ. ನರೇಂದ್ರ ಕುಮಾರ್",
    title_kn: "ಪ್ರೊಫೆಸರ್, ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಮತ್ತು ಯಂತ್ರ ಕಲಿಕೆ · ವಿಶ್ವೇಶ್ವರಯ್ಯ ತಾಂತ್ರಿಕ ವಿಶ್ವವಿದ್ಯಾಲಯ",
    text_kn: [
      "ಶ್ರೀ ವಾದಿರಾಜ್ ಅವರು ಈ ದೈವಿಕ ಗಂಟೆಯ ಸೃಷ್ಟಿ ನಿಜಕ್ಕೂ ಗಮನಾರ್ಹವಾಗಿದೆ, ಏಕೆಂದರೆ ಇದು ಘಂಟಾ ಮತ್ತು ಪ್ರಣವ ಧ್ವನಿ (AUM) ನಡುವಿನ ಆಳವಾದ ಸಂಪರ್ಕವನ್ನು ಸಾಕಾರಗೊಳಿಸುತ್ತದೆ. ಇದು ಉತ್ಪಾದಿಸುವ ಪವಿತ್ರ ಸಾಮರಸ್ಯವು ಭಾರತೀಯ ಋಷಿಗಳ ಬುದ್ಧಿವಂತಿಕೆಯ ಬಗ್ಗೆ ಆಳವಾದ ಗೌರವವನ್ನು ಹುಟ್ಟುಹಾಕುತ್ತದೆ, ಗಂಟೆಯ ಭೌತಿಕ ಧ್ವನಿ ಮತ್ತು ಬ್ರಹ್ಮಾಂಡದ ಕಾಸ್ಮಿಕ್ ಕಂಪನಗಳ ನಡುವಿನ ಕಾಲಾತೀತ ಸಂಪರ್ಕವನ್ನು ಸುಂದರವಾಗಿ ಸೆರೆಹಿಡಿಯುತ್ತದೆ. ಘಂಟಾ ನಮ್ಮನ್ನು ಒಳಮುಖವಾಗಿ ಮಾರ್ಗದರ್ಶನ ಮಾಡುವ ಮತ್ತು ಶಾಶ್ವತತೆಯೊಂದಿಗೆ ನಮ್ಮನ್ನು ಒಂದುಗೂಡಿಸುವ ಚಿತ್ರಣವು ವಿಶೇಷವಾಗಿ ಶಕ್ತಿಯುತವಾಗಿದೆ, ಆಧ್ಯಾತ್ಮಿಕ ಜ್ಞಾನೋದಯದ ಸಾರದೊಂದಿಗೆ ಪ್ರತಿಧ್ವನಿಸುತ್ತದೆ. ಆಧ್ಯಾತ್ಮಿಕ ಸಂಪರ್ಕ ಮತ್ತು ಆಂತರಿಕ ಶಾಂತಿಯ ದಾರಿದೀಪವಾಗಿ ಕಾರ್ಯನಿರ್ವಹಿಸುವ ಈ ಸೊಗಸಾದ ಮೇರುಕೃತಿಗೆ ನಾವು ತುಂಬಾ ಕೃತಜ್ಞರಾಗಿರುತ್ತೇವೆ.",
    ],
  },
  {
    id: "dr-m-k-raghavendra",
    name: "Dr M K Raghavendra",
    title: "Director · Jnanadhara Centre For Excellence, Programme Manager, ABCMC · IISc, Bangalore",
    photo: drMKRaghavendraPhoto,
    text: [
      "Music therapy is the age-old method of self-healing, which has a divine source of connectivity to the inner self. The importance of the sound waves or vibrations in healing of the inner self and connectivity with the Bagavantha is well known fact. Musical instruments play a very crucial role in aiding the connection of Athma with Paramathma, which basically is self-realization. There are instances where the musical instrument itself is considered as God. A musical instrument is a tool of virtue, by which one can even attain salvation, ‘provided it is calibrated to the requirement’.",
      "In this regard the Pranava Gantae, an outcome of sleepless research; dedication; determination; pure devotion; of many eminent personalities in the field led by Mr Vadhiraj uncle, can be considered as perfection tried to reach scientifically. In today’s era of acceptance of facts through scientific proofs, the strive towards the upliftment of the Dharmika Maulyas through science by Vadhi uncle is highly appreciable. As the current generation we are greatly thankful for an wonderful tool which makes it one step closer to GOD.",
    ],
    name_kn: "ಡಾ. ಎಂ. ಕೆ. ರಾಘವೇಂದ್ರ",
    title_kn: "ನಿರ್ದೇಶಕರು · ಜ್ಞಾನಧಾರ ಸೆಂಟರ್ ಫಾರ್ ಎಕ್ಸಲೆನ್ಸ್, ಕಾರ್ಯಕ್ರಮ ವ್ಯವಸ್ಥಾಪಕರು, ಎಬಿಸಿಎಂಸಿ · ಐಐಎಸ್ಸಿ, ಬೆಂಗಳೂರು",
    text_kn: [
      "ಸಂಗೀತ ಚಿಕಿತ್ಸೆಯು ಸ್ವ-ಚಿಕಿತ್ಸೆಯ ಪ್ರಾಚೀನ ವಿಧಾನವಾಗಿದ್ದು, ಇದು ಆಂತರಿಕ ಆತ್ಮಕ್ಕೆ ದೈವಿಕ ಸಂಪರ್ಕವನ್ನು ಹೊಂದಿದೆ. ಆಂತರಿಕ ಆತ್ಮವನ್ನು ಗುಣಪಡಿಸುವಲ್ಲಿ ಮತ್ತು ಭಗವಂತನೊಂದಿಗಿನ ಸಂಪರ್ಕದಲ್ಲಿ ಧ್ವನಿ ತರಂಗಗಳು ಅಥವಾ ಕಂಪನಗಳ ಪ್ರಾಮುಖ್ಯತೆಯು ಎಲ್ಲರಿಗೂ ತಿಳಿದಿರುವ ಸತ್ಯ. ಸಂಗೀತ ವಾದ್ಯಗಳು ಪರಮಾತ್ಮನೊಂದಿಗೆ ಆತ್ಮನ ಸಂಪರ್ಕವನ್ನು ಸಹಾಯ ಮಾಡುವಲ್ಲಿ ಬಹಳ ನಿರ್ಣಾಯಕ ಪಾತ್ರವನ್ನು ವಹಿಸುತ್ತವೆ, ಇದು ಮೂಲತಃ ಸ್ವಯಂ-ಸಾಕ್ಷಾತ್ಕಾರವಾಗಿದೆ. ಸಂಗೀತ ವಾದ್ಯವನ್ನು ಸ್ವತಃ ದೇವರು ಎಂದು ಪರಿಗಣಿಸುವ ಸಂದರ್ಭಗಳಿವೆ. ಸಂಗೀತ ವಾದ್ಯವು ಸದ್ಗುಣದ ಸಾಧನವಾಗಿದ್ದು, ಅದರ ಮೂಲಕ ಒಬ್ಬರು 'ಅಗತ್ಯಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಮಾಪನಾಂಕ ನಿರ್ಣಯಿಸಿದರೆ' ಮೋಕ್ಷವನ್ನು ಸಹ ಪಡೆಯಬಹುದು.",
      "ಈ ನಿಟ್ಟಿನಲ್ಲಿ ಶ್ರೀ ವಾಧಿರಾಜ್ ಚಿಕ್ಕಪ್ಪ ನೇತೃತ್ವದ ಕ್ಷೇತ್ರದ ಅನೇಕ ಶ್ರೇಷ್ಠ ವ್ಯಕ್ತಿಗಳ ನಿದ್ರಾಹೀನ ಸಂಶೋಧನೆ; ಸಮರ್ಪಣೆ; ದೃಢನಿಶ್ಚಯ; ಶುದ್ಧ ಭಕ್ತಿ; ಫಲಿತಾಂಶವಾದ ಪ್ರಣವ ಗಂಟೆಯನ್ನು ವೈಜ್ಞಾನಿಕವಾಗಿ ತಲುಪಲು ಪ್ರಯತ್ನಿಸಿದ ಪರಿಪೂರ್ಣತೆ ಎಂದು ಪರಿಗಣಿಸಬಹುದು. ವೈಜ್ಞಾನಿಕ ಪುರಾವೆಗಳ ಮೂಲಕ ಸತ್ಯಗಳನ್ನು ಸ್ವೀಕರಿಸುವ ಇಂದಿನ ಯುಗದಲ್ಲಿ, ವಾಧಿ ಚಿಕ್ಕಪ್ಪ ವಿಜ್ಞಾನದ ಮೂಲಕ ಧಾರ್ಮಿಕ ಮೌಲ್ಯರ ಉನ್ನತಿಯತ್ತ ಶ್ರಮಿಸುವುದು ಹೆಚ್ಚು ಶ್ಲಾಘನೀಯ. ಪ್ರಸ್ತುತ ಪೀಳಿಗೆಯಾಗಿ ನಾವು ದೇವರಿಗೆ ಒಂದು ಹೆಜ್ಜೆ ಹತ್ತಿರವಾಗುವಂತೆ ಮಾಡುವ ಅದ್ಭುತ ಸಾಧನಕ್ಕಾಗಿ ತುಂಬಾ ಕೃತಜ್ಞರಾಗಿದ್ದೇವೆ.",
    ],
  },
  {
    id: "dr-puneeth-padmanabhan",
    name: "Dr. Puneeth Padmanabhan",
    title: "Ayurvedic Practitioner · Sriranga Ayurveda · Bangalore",
    photo: drPuneethPadmanabhanPhoto,
    text: [
      "I would like to tell the beneficiaries of the Pranava bell.",
      "\"It is the order of our Guru, Srirangamahaguru, that we should understand the scriptures through experiment. I played the bell made and given to me by Sri Vadiraja and asked my 9-year-old son Siddanta Krishna; What is it that you are hearing? He, who has no previous experience, replied that it is hearing Om Om Om Om Om Om!",
      "From this small experiment alone, you can understand that you do not have to believe in the scriptures by force; naturally, the truth lies in them. I recommend you to buy this Pranava bell, which is made according to the scriptures.\"",
    ],
    name_kn: "ಡಾ. ಪುನೀತ್ ಪದ್ಮನಾಭನ್",
    title_kn: "ಆಯುರ್ವೇದ ವೈದ್ಯರು · ಶ್ರೀರಂಗ ಆಯುರ್ವೇದ · ಬೆಂಗಳೂರು",
    text_kn: [
      "ಪ್ರಣವ ಗಂಟೆಯ ಫಲಾನುಭವಿಗಳಿಗೆ ನಾನು ಹೇಳಲು ಬಯಸುತ್ತೇನೆ.",
      "\"ನಮ್ಮ ಗುರುಗಳಾದ ಶ್ರೀರಂಗಮಹಾಗುರುಗಳು, ನಾವು ಪ್ರಯೋಗದ ಮೂಲಕ ಶಾಸ್ತ್ರಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬೇಕು ಎಂಬುದು ಆದೇಶವಾಗಿದೆ. ಶ್ರೀ ವಾದಿರಾಜರು ನನಗೆ ಮಾಡಿ ಕೊಟ್ಟ ಗಂಟೆಯನ್ನು ನಾನು ನುಡಿಸಿದೆ ಮತ್ತು ನನ್ನ 9 ವರ್ಷದ ಮಗ ಸಿದ್ದಾಂತ ಕೃಷ್ಣನನ್ನು ಕೇಳಿದೆ; ನೀವು ಏನು ಕೇಳುತ್ತಿದ್ದೀರಿ? ಹಿಂದಿನ ಅನುಭವವಿಲ್ಲದ ಅವರು, ಅದು ಓಂ ಓಂ ಓಂ ಓಂ ಓಂ ಓಂ ಎಂದು ಕೇಳುತ್ತಿದೆ ಎಂದು ಉತ್ತರಿಸಿದರು!",
      "ಈ ಸಣ್ಣ ಪ್ರಯೋಗದಿಂದ ಮಾತ್ರ, ನೀವು ಬಲವಂತವಾಗಿ ಶಾಸ್ತ್ರಗಳನ್ನು ನಂಬಬೇಕಾಗಿಲ್ಲ ಎಂದು ನೀವು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಬಹುದು; ಸ್ವಾಭಾವಿಕವಾಗಿ, ಸತ್ಯವು ಅವುಗಳಲ್ಲಿದೆ. ಶಾಸ್ತ್ರಗಳ ಪ್ರಕಾರ ತಯಾರಿಸಲಾದ ಈ ಪ್ರಣವ ಗಂಟೆಯನ್ನು ಖರೀದಿಸಲು ನಾನು ನಿಮಗೆ ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ.\"",
    ],
  },
  {
    id: "vidwan-narasimha-bhat-badagu",
    name: "Vidwan Narasimha Bhat Badagu",
    title: "Principal Parampara Gurukul · Vishnugupta University, Ashoka · Gokarna",
    photo: vidwanNarasimhaBhatBadaguPhoto,
    text: [
      "I am using the bell manufactured by Shri Vadiraj's 'Pranavanaada' company during the worship of God. I am really happy to say that the sound coming from this bell has added joy to my worship. Usually, the bells available outside do not have the sound of Pranava. Only a sound comes out of it. The scriptures say that only the bell that imitates the incomparable sound of Pranava heard by the sages within themselves is suitable for worship. It is in accordance with this matter, so I recommend it. I have come to know that this bell is made scientifically and in accordance with Nadishastha. He is not just a business-minded person. Rather, he is manufacturing these bells with the feeling that good quality bells should reach everyone. May everyone get the benefit of it.",
    ],
    name_kn: "ವಿದ್ವಾನ್ ನರಸಿಂಹ ಭಟ್ ಬಡಗು",
    title_kn: "ಪ್ರಾಂಶುಪಾಲ ಪರಂಪರ ಗುರುಕುಲ · ವಿಷ್ಣುಗುಪ್ತ ವಿಶ್ವವಿದ್ಯಾಲಯ, ಅಶೋಕ · ಗೋಕರ್ಣ",
    text_kn: [
      "ನಾನು ಶ್ರೀ ವಾದಿರಾಜ್ ಅವರ 'ಪ್ರಣವನಾದ' ತಯಾರಿಸಿದ ಗಂಟೆಯನ್ನು ಬಳಸುತ್ತಿದ್ದೇನೆ. ಈ ಗಂಟೆಯಿಂದ ಬರುವ ಶಬ್ದವು ನನ್ನ ಪೂಜೆಗೆ ಸಂತೋಷವನ್ನು ನೀಡಿದೆ ಎಂದು ಹೇಳಲು ನನಗೆ ನಿಜವಾಗಿಯೂ ಸಂತೋಷವಾಗಿದೆ. ಸಾಮಾನ್ಯವಾಗಿ, ಹೊರಗೆ ಲಭ್ಯವಿರುವ ಗಂಟೆಗಳಲ್ಲಿ ಪ್ರಣವದ ಶಬ್ದವಿರುವುದಿಲ್ಲ. ಅದರಿಂದ ಕೇವಲ ಒಂದು ಶಬ್ದ ಹೊರಬರುತ್ತದೆ. ಋಷಿಗಳು ತಮ್ಮೊಳಗೆ ಕೇಳುವ ಪ್ರಣವದ ಅನುಪಮ ಧ್ವನಿಯನ್ನು ಅನುಕರಿಸುವ ಗಂಟೆ ಮಾತ್ರ ಪೂಜೆಗೆ ಸೂಕ್ತವಾಗಿದೆ ಎಂದು ಶಾಸ್ತ್ರಗಳು ಹೇಳುತ್ತವೆ. ಇದು ಈ ವಿಷಯಕ್ಕೆ ಅನುಗುಣವಾಗಿದೆ, ಆದ್ದರಿಂದ ನಾನು ಅದನ್ನು ಶಿಫಾರಸು ಮಾಡುತ್ತೇನೆ. ಈ ಗಂಟೆಯನ್ನು ವೈಜ್ಞಾನಿಕವಾಗಿ ಮತ್ತು ನಾದಿಶಾಸ್ತಕ್ಕೆ ಅನುಗುಣವಾಗಿ ತಯಾರಿಸಲಾಗುತ್ತದೆ ಎಂದು ನನಗೆ ತಿಳಿದುಬಂದಿದೆ. ಅವರು ಕೇವಲ ವ್ಯವಹಾರ ಮನಸ್ಸಿನ ವ್ಯಕ್ತಿಯಲ್ಲ. ಬದಲಿಗೆ, ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಗಂಟೆಗಳು ಎಲ್ಲರಿಗೂ ತಲುಪಬೇಕು ಎಂಬ ಭಾವನೆಯೊಂದಿಗೆ ಅವರು ಈ ಗಂಟೆಗಳನ್ನು ತಯಾರಿಸುತ್ತಿದ್ದಾರೆ. ಪ್ರತಿಯೊಬ್ಬರೂ ಅದರ ಪ್ರಯೋಜನವನ್ನು ಪಡೆಯಲಿ.",
    ],
  },
  {
    id: "vidwan-pandurang-joshi",
    name: "Vidwan Pandurang Joshi",
    photo: vidwanPandurangJoshiPhoto,
    text: [
      "Are we big enough to write an opinion about a bell?",
      "All we can honestly say is that the sound from outside is good, sweet, and melodious.",
    ],
    name_kn: "ವಿದ್ವಾನ್ ಪಾಂಡುರಂಗ ಜೋಶಿ",
    text_kn: [
      "ನಾವು ಗಂಟೆಯ ಬಗ್ಗೆ ಅಭಿಪ್ರಾಯ ಬರೆಯುವಷ್ಟು ದೊಡ್ಡವರೇ?",
      "ಹೊರಗಿನಿಂದ ಬರುವ ಧ್ವನಿ ಒಳ್ಳೆಯದು, ಮಧುರ ಮತ್ತು ಮಧುರವಾಗಿದೆ ಎಂದು ಮಾತ್ರ ನಾವು ಪ್ರಾಮಾಣಿಕವಾಗಿ ಹೇಳಬಲ್ಲೆವು.",
    ],
  },
  {
    id: "dr-jeevan-chakravarthy-a-s",
    name: "Dr Jeevan Chakravarthy A S",
    title: "Assistant Professor, Department of Chemistry · BMSIT&M, Bengaluru · Former RA at JNCASR",
    photo: drJeevanChakravarthyASPhoto,
    text: [
      "Music therapy is the age-old method of self-healing, which has a divine source of connectivity to the inner self. The importance of the sound waves or vibrations in healing of the inner self and connectivity with the Bagavantha is well known fact. Musical instruments play a very crucial role in aiding the connection of Athma with Paramathma, which basically is self-realization. There are instances where the musical instrument itself is considered as God. A musical instrument is a tool of virtue, by which one can even attain salvation, ‘provided it is calibrated to the requirement’.",
      "In this regard the Pranava Gantae, an outcome of sleepless research; dedication; determination; pure devotion; of many eminent personalities in the field led by Mr Vadhiraj uncle, can be considered as perfection tried to reach scientifically. In today’s era of acceptance of facts through scientific proofs, the strive towards the upliftment of the Dharmika Maulyas through science by Vadhi uncle is highly appreciable. As the current generation we are greatly thankful for an wonderful tool which makes it one step closer to GOD.",
    ],
    name_kn: "ಡಾ ಜೀವನ್ ಚಕ್ರವರ್ತಿ ಎ ಎಸ್",
    title_kn: "ಸಹಾಯಕ ಪ್ರಾಧ್ಯಾಪಕರು, ರಸಾಯನಶಾಸ್ತ್ರ ವಿಭಾಗ · BMSIT&M, ಬೆಂಗಳೂರು · JNCASR ನಲ್ಲಿ ಮಾಜಿ ಆರ್.ಎ",
    text_kn: [
      "ಸಂಗೀತ ಚಿಕಿತ್ಸೆಯು ಸ್ವ-ಚಿಕಿತ್ಸೆಯ ಪ್ರಾಚೀನ ವಿಧಾನವಾಗಿದ್ದು, ಇದು ಆಂತರಿಕ ಆತ್ಮಕ್ಕೆ ದೈವಿಕ ಸಂಪರ್ಕವನ್ನು ಹೊಂದಿದೆ. ಆಂತರಿಕ ಆತ್ಮವನ್ನು ಗುಣಪಡಿಸುವಲ್ಲಿ ಮತ್ತು ಭಗವಂತನೊಂದಿಗಿನ ಸಂಪರ್ಕದಲ್ಲಿ ಧ್ವನಿ ತರಂಗಗಳು ಅಥವಾ ಕಂಪನಗಳ ಪ್ರಾಮುಖ್ಯತೆಯು ಎಲ್ಲರಿಗೂ ತಿಳಿದಿರುವ ಸತ್ಯ. ಸಂಗೀತ ವಾದ್ಯಗಳು ಪರಮಾತ್ಮನೊಂದಿಗೆ ಆತ್ಮನ ಸಂಪರ್ಕವನ್ನು ಸಹಾಯ ಮಾಡುವಲ್ಲಿ ಬಹಳ ನಿರ್ಣಾಯಕ ಪಾತ್ರವನ್ನು ವಹಿಸುತ್ತವೆ, ಇದು ಮೂಲತಃ ಸ್ವಯಂ-ಸಾಕ್ಷಾತ್ಕಾರವಾಗಿದೆ. ಸಂಗೀತ ವಾದ್ಯವನ್ನು ಸ್ವತಃ ದೇವರು ಎಂದು ಪರಿಗಣಿಸುವ ಸಂದರ್ಭಗಳಿವೆ. ಸಂಗೀತ ವಾದ್ಯವು ಸದ್ಗುಣದ ಸಾಧನವಾಗಿದ್ದು, ಅದರ ಮೂಲಕ ಒಬ್ಬರು 'ಅಗತ್ಯಕ್ಕೆ ಅನುಗುಣವಾಗಿ ಮಾಪನಾಂಕ ನಿರ್ಣಯಿಸಿದರೆ' ಮೋಕ್ಷವನ್ನು ಸಹ ಪಡೆಯಬಹುದು.",
      "ಈ ನಿಟ್ಟಿನಲ್ಲಿ ಶ್ರೀ ವಾಧಿರಾಜ್ ಚಿಕ್ಕಪ್ಪ ನೇತೃತ್ವದ ಕ್ಷೇತ್ರದ ಅನೇಕ ಶ್ರೇಷ್ಠ ವ್ಯಕ್ತಿಗಳ ನಿದ್ರಾಹೀನ ಸಂಶೋಧನೆ; ಸಮರ್ಪಣೆ; ದೃಢನಿಶ್ಚಯ; ಶುದ್ಧ ಭಕ್ತಿ; ಫಲಿತಾಂಶವಾದ ಪ್ರಣವ ಗಂಟೆಯನ್ನು ವೈಜ್ಞಾನಿಕವಾಗಿ ತಲುಪಲು ಪ್ರಯತ್ನಿಸಿದ ಪರಿಪೂರ್ಣತೆ ಎಂದು ಪರಿಗಣಿಸಬಹುದು. ವೈಜ್ಞಾನಿಕ ಪುರಾವೆಗಳ ಮೂಲಕ ಸತ್ಯಗಳನ್ನು ಸ್ವೀಕರಿಸುವ ಇಂದಿನ ಯುಗದಲ್ಲಿ, ವಾಧಿ ಚಿಕ್ಕಪ್ಪ ವಿಜ್ಞಾನದ ಮೂಲಕ ಧಾರ್ಮಿಕ ಮೌಲ್ಯರ ಉನ್ನತಿಯತ್ತ ಶ್ರಮಿಸುವುದು ಹೆಚ್ಚು ಶ್ಲಾಘನೀಯ. ಪ್ರಸ್ತುತ ಪೀಳಿಗೆಯಾಗಿ ನಾವು ದೇವರಿಗೆ ಒಂದು ಹೆಜ್ಜೆ ಹತ್ತಿರವಾಗುವಂತೆ ಮಾಡುವ ಅದ್ಭುತ ಸಾಧನಕ್ಕಾಗಿ ತುಂಬಾ ಕೃತಜ್ಞರಾಗಿದ್ದೇವೆ.",
    ],
  },
  {
    id: "yogacharya-shri-umamaheshwar-guruji",
    name: "Yogacharya Shri Umamaheshwar Guruji",
    title: "Swastha International Yoga · Ayurveda Naturopathy Cultural Religious Spiritual Activities Centre · Vivekananda Adarsh Sadhana Kendra Yoga and Health Research Institute Bangalore",
    photo: yogacharyaShriUmamaheshwarGurujiPhoto,
    text: [
      "Shri Vadiraja, who has been running a business in the commercial world for many years along with a traditional family and a sattvic life, has been interested in the special features of the conch, bell, and jar used during daily practice of the sound waves of Shabda Brahma with a research spirit in the background of spirituality and science. This bell is one of the alloy tools prepared by him. This special bell has a devotional scriptural traditional spiritual scientific background prepared for its introduction and use. In the methods that we have already scientifically tested, the effect of the bell has many effects on the body and mind and has given a hundred-fold result.",
      "Not only the worshippers of God, the worshippers of the gods, those who perform priestly or daily worship, but also those who place bells in some parts of the house as a decoration so that the air often makes a sound, can also use this bell to remove all the evils in the atmosphere of the house. The achievement of Shri Vadiraja, who has made such a unique bell tool, is commendable. We hope that its dissemination and promotion will reach the entire world and bring a sense of spiritual bliss to humanity.",
      "Thank you",
    ],
    name_kn: "ಯೋಗಾಚಾರ್ಯ ಶ್ರೀ ಉಮಾಮಹೇಶ್ವರ ಗುರೂಜಿ",
    title_kn: "ಸ್ವಸ್ಥ ಅಂತರರಾಷ್ಟ್ರೀಯ ಯೋಗ · ಆಯುರ್ವೇದ ಪ್ರಕೃತಿ ಚಿಕಿತ್ಸೆ ಸಾಂಸ್ಕೃತಿಕ ಧಾರ್ಮಿಕ ಆಧ್ಯಾತ್ಮಿಕ ಚಟುವಟಿಕೆಗಳ ಕೇಂದ್ರ · ವಿವೇಕಾನಂದ ಆದರ್ಶ ಸಾಧನ ಕೇಂದ್ರ ಯೋಗ ಮತ್ತು ಆರೋಗ್ಯ ಸಂಶೋಧನಾ ಸಂಸ್ಥೆ ಬೆಂಗಳೂರು",
    text_kn: [
      "ಸಾಂಪ್ರದಾಯಿಕ ಕುಟುಂಬ ಮತ್ತು ಸಾತ್ವಿಕ ಜೀವನದೊಂದಿಗೆ ಹಲವು ವರ್ಷಗಳಿಂದ ವಾಣಿಜ್ಯ ಜಗತ್ತಿನಲ್ಲಿ ವ್ಯವಹಾರ ನಡೆಸುತ್ತಿರುವ ಶ್ರೀ ವಾದಿರಾಜರು, ಆಧ್ಯಾತ್ಮಿಕತೆ ಮತ್ತು ವಿಜ್ಞಾನದ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಸಂಶೋಧನಾ ಮನೋಭಾವದೊಂದಿಗೆ ಶಬ್ದ ಬ್ರಹ್ಮನ ಧ್ವನಿ ತರಂಗಗಳ ದೈನಂದಿನ ಅಭ್ಯಾಸದ ಸಮಯದಲ್ಲಿ ಬಳಸುವ ಶಂಖ, ಗಂಟೆ ಮತ್ತು ಜಾಡಿಗಳ ವಿಶೇಷ ಲಕ್ಷಣಗಳಲ್ಲಿ ಆಸಕ್ತಿ ಹೊಂದಿದ್ದಾರೆ. ಈ ಗಂಟೆ ಅವರು ಸಿದ್ಧಪಡಿಸಿದ ಮಿಶ್ರಲೋಹ ಸಾಧನಗಳಲ್ಲಿ ಒಂದಾಗಿದೆ. ಈ ವಿಶೇಷ ಗಂಟೆಯು ಅದರ ಪರಿಚಯ ಮತ್ತು ಬಳಕೆಗೆ ಸಿದ್ಧಪಡಿಸಲಾದ ಭಕ್ತಿ ಶಾಸ್ತ್ರಬದ್ಧ ಸಾಂಪ್ರದಾಯಿಕ ಆಧ್ಯಾತ್ಮಿಕ ವೈಜ್ಞಾನಿಕ ಹಿನ್ನೆಲೆಯನ್ನು ಹೊಂದಿದೆ. ನಾವು ಈಗಾಗಲೇ ವೈಜ್ಞಾನಿಕವಾಗಿ ಪರೀಕ್ಷಿಸಿರುವ ವಿಧಾನಗಳಲ್ಲಿ, ಗಂಟೆಯ ಪರಿಣಾಮವು ದೇಹ ಮತ್ತು ಮನಸ್ಸಿನ ಮೇಲೆ ಅನೇಕ ಪರಿಣಾಮಗಳನ್ನು ಬೀರುತ್ತದೆ ಮತ್ತು ನೂರು ಪಟ್ಟು ಫಲಿತಾಂಶವನ್ನು ನೀಡಿದೆ.",
      "ದೇವರ ಆರಾಧಕರು, ದೇವರುಗಳ ಆರಾಧಕರು, ಪುರೋಹಿತಶಾಹಿ ಅಥವಾ ದೈನಂದಿನ ಪೂಜೆಯನ್ನು ಮಾಡುವವರು ಮಾತ್ರವಲ್ಲದೆ, ಗಾಳಿಯು ಆಗಾಗ್ಗೆ ಶಬ್ದ ಮಾಡುವಂತೆ ಮನೆಯ ಕೆಲವು ಭಾಗಗಳಲ್ಲಿ ಅಲಂಕಾರವಾಗಿ ಗಂಟೆಗಳನ್ನು ಇಡುವವರು ಸಹ ಮನೆಯ ವಾತಾವರಣದಲ್ಲಿರುವ ಎಲ್ಲಾ ದುಷ್ಟಶಕ್ತಿಗಳನ್ನು ತೆಗೆದುಹಾಕಲು ಈ ಗಂಟೆಯನ್ನು ಬಳಸಬಹುದು. ಇಂತಹ ವಿಶಿಷ್ಟ ಗಂಟೆ ಸಾಧನವನ್ನು ಮಾಡಿದ ಶ್ರೀ ವಾದಿರಾಜರ ಸಾಧನೆ ಶ್ಲಾಘನೀಯ. ಇದರ ಪ್ರಸಾರ ಮತ್ತು ಪ್ರಚಾರವು ಇಡೀ ಜಗತ್ತನ್ನು ತಲುಪುತ್ತದೆ ಮತ್ತು ಮಾನವೀಯತೆಗೆ ಆಧ್ಯಾತ್ಮಿಕ ಆನಂದದ ಭಾವನೆಯನ್ನು ತರುತ್ತದೆ ಎಂದು ನಾವು ಭಾವಿಸುತ್ತೇವೆ.",
      "ಧನ್ಯವಾದಗಳು",
    ],
  },
  {
    id: "jothsna-a",
    name: "Jothsna A",
    title: "M.A. and SHIKSHA SHASTRI",
    photo: jothsnaAPhoto,
    text: [
      "The bells being manufactured by Mr. Vadiraja's company create a special experience during worship. With the meaningful and unique title they possess, his efforts in manufacturing bells with the aspiration of continuing the tradition are worthy. I hope that more people buy these bells and experience the true meaning of worship.",
    ],
    name_kn: "ಜೋತ್ಸ್ನಾ. ಎ",
    title_kn: "ಎಂ.ಎ. ಮತ್ತು ಶಿಕ್ಷಾ ಶಾಸ್ತ್ರಿ",
    text_kn: [
      "ಪ್ರಣವದ ಧ್ವನಿಯನ್ನು ಉಂಟುಮಾಡುವ ಗಂಟೆಗಳು",
      "ಅರ್ಥಪೂರ್ಣ ಮತ್ತು ವಿಶಿಷ್ಟ ಶೀರ್ಷಿಕೆಯನ್ನು ಹೊಂದಿರುವ ಶ್ರೀವಾದಿರಾಜರ ಕಂಪನಿಯು ತಯಾರಿಸುತ್ತಿರುವ ಗಂಟೆಗಳು ಪೂಜೆಯ ಸಮಯದಲ್ಲಿ ವಿಶೇಷ ಅನುಭವವನ್ನು ಸೃಷ್ಟಿಸುತ್ತವೆ. ಸಂಪ್ರದಾಯವನ್ನು ಮುಂದುವರಿಸುವ ಆಶಯದೊಂದಿಗೆ, ಗಂಟೆಗಳನ್ನು ತಯಾರಿಸುವಲ್ಲಿ ಅವರ ಪ್ರಯತ್ನಗಳು ಸಾರ್ಥಕವಾಗುತ್ತವೆ, ಇದರಿಂದ ಹೆಚ್ಚು ಹೆಚ್ಚು ಜನರು ಗಂಟೆಗಳನ್ನು ಖರೀದಿಸುತ್ತಾರೆ. ಈ ಮೂಲಕ ಅವರೂ ಸಹ ಪೂಜೆಯ ಅರ್ಥವನ್ನು ಅನುಭವಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತದೆ ಎಂದು ನಾನು ಭಾವಿಸುತ್ತೇನೆ.",
    ],
  },
  {
    id: "shri-subrahmanya-somayaji",
    name: "Shri Subrahmanya Somayaji",
    title: "Sanskrit Thinker",
    photo: shriSubrahmanyaSomayajiPhoto,
    text: [
      "The bell is an integral part of Indian worship rituals. Its sound must resonate before the worship. It marks the arrival of the divine and the departure of the demonic forces.",
      "Mahayogi Sriranga Mahaguru draws attention to the spirituality of the bell. He makes it experiential within the context of scripture and experiment.",
      "Thus, the bell is essential for spirituality and for worship, which is a part of it. However, it is noteworthy that the bell must be in a specific condition to fulfill its purpose. If the sound comes out in just any way, it does not produce the intended effect. It is effective only when it is divine.",
      "Knowledge of Arsha Vidya (ancient wisdom) is required to prepare a bell that produces such a divine sound. Without it, the prepared bells are useless.",
      "Currently, Shri Vadiraja is preparing bells with such Arsha consciousness. This is a very rare occurrence in the field of bell making.",
      "If the bells he constructs become essential in our temples and home prayer rooms, it will be a tribute to his hard work and a meaningful contribution to our worship.",
      "I have purchased a Pranava sound bell made by Shri Vadiraja and am using it in worship. It resonates with a very solemn, melodious sound. Even after stopping the bell, the resonant Omkara remains in the heart. It is very helpful in focusing the mind on worshipping the Lord. His effort in making such effective bells is truly commendable. We always pray to the Lord for the success of this sacred work.",
    ],
    name_kn: "ಶ್ರೀ ಸುಬ್ರಹ್ಮಣ್ಯ ಸೋಮಯಾಜಿ",
    title_kn: "ಸಂಸ್ಕೃತ ಚಿಂತಕರು",
    text_kn: [
      "ಭಾರತೀಯ ಪೂಜಾ ವಿಧಿಯ ಅವಿಭಾಜ್ಯ ಅಂಗವೆಂದರೆ ಗಂಟೆ. ಪೂಜೆಗೆ ಮುನ್ನ ಅದರ ಶಬ್ದವನ್ನು ಪ್ರತಿಧ್ವನಿಸಬೇಕು. ದೇವರುಗಳ ಆಗಮನ ಮತ್ತು ರಾಕ್ಷಸರ ನಿರ್ಗಮನಕ್ಕೆ ಅದು ಕಾರಣವಾಗಿದೆ.",
      "ಮಹಾಯೋಗಿ ಶ್ರೀರಂಗ ಮಹಾಗುರುಗಳು ಗಂಟೆಯ ಆಧ್ಯಾತ್ಮಿಕತೆಯತ್ತ ಗಮನ ಸೆಳೆಯುತ್ತಾರೆ. ಅವರು ಶಾಸ್ತ್ರ ಮತ್ತು ಪ್ರಯೋಗದ ಸಂದರ್ಭದಲ್ಲಿ ಅದನ್ನು ಅನುಭವಾತ್ಮಕವಾಗಿಸುತ್ತಾರೆ.",
      "ಹೀಗಾಗಿ, ಗಂಟೆಯು ಆಧ್ಯಾತ್ಮಿಕತೆಗೆ ಮತ್ತು ಅದರದೇ ಆದ ಪೂಜೆಯ ಭಾಗಕ್ಕೆ ಅವಶ್ಯಕವಾಗಿದೆ. ಆದರೆ ಆ ಗಂಟೆಯು ಇರುವ ಸ್ಥಿತಿಯಲ್ಲಿದ್ದಾಗ ಮಾತ್ರ ಉದ್ದೇಶವು ಈಡೇರುತ್ತದೆ ಎಂಬುದು ಗಮನಾರ್ಹ. ಶಬ್ದವು ಹೇಗಾದರೂ ಬಂದರೆ, ಅದು ಉದ್ದೇಶಿತ ಪರಿಣಾಮವನ್ನು ಉಂಟುಮಾಡುವುದಿಲ್ಲ. ಅದು ದೈವಿಕವಾಗಿದ್ದಾಗ ಮಾತ್ರ ಅದು ಪರಿಣಾಮಕಾರಿಯಾಗಿದೆ.",
      "ಅಂತಹ ದೈವಿಕ ಧ್ವನಿಯನ್ನು ಉಂಟುಮಾಡಲು ಗಂಟೆಯನ್ನು ತಯಾರಿಸಲು, ಆರ್ಷ ವಿಜ್ಞಾನದ ಜ್ಞಾನದ ಅಗತ್ಯವಿದೆ. ಅದು ಇಲ್ಲದೆ, ಸಿದ್ಧಪಡಿಸಿದ ಗಂಟೆಗಳು ನಿಷ್ಪ್ರಯೋಜಕವಾಗಿವೆ.",
      "ಪ್ರಸ್ತುತ ಶ್ರೀ ವಾದಿರಾಜರು ಅಂತಹ ಆರ್ಷ ಪ್ರಜ್ಞೆಯ ಸಂದರ್ಭದಲ್ಲಿ ಗಂಟೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದಾರೆ. ಇದು ಗಂಟೆ ತಯಾರಿಕೆಯ ಕ್ಷೇತ್ರದಲ್ಲಿ ಬಹಳ ಅಪರೂಪದ ವಿಷಯ.",
      "ಅವರು ನಿರ್ಮಿಸಿದ ಗಂಟೆಗಳು ನಮ್ಮ ದೇವಾಲಯಗಳು ಮತ್ತು ಮನೆಗಳಲ್ಲಿ ಅತ್ಯಗತ್ಯವಾಗಿದ್ದರೆ, ಅದು ಅವರ ಕಠಿಣ ಪರಿಶ್ರಮಕ್ಕೆ ಮತ್ತು ನಮ್ಮ ಪೂಜೆಗೆ ಅರ್ಥಪೂರ್ಣ ಕೊಡುಗೆಗೆ ಸಂದ ಗೌರವವಾಗುತ್ತದೆ.",
      "ನಾನು ಶ್ರೀ ವಾದಿರಾಜರಿಂದ ಮಾಡಲ್ಪಟ್ಟ ಪ್ರಣವ ಧ್ವನಿಯ ಗಂಟೆಯನ್ನು ಖರೀದಿಸಿದ್ದೇನೆ ಮತ್ತು ಅದನ್ನು ಪೂಜೆಯಲ್ಲಿ ಬಳಸುತ್ತಿದ್ದೇನೆ. ಅದು ಬಹಳ ಗಂಭೀರವಾದ, ಮಧುರವಾದ ಧ್ವನಿಯೊಂದಿಗೆ ಮೊಳಗುತ್ತದೆ. ಗಂಟೆಯನ್ನು ನಿಲ್ಲಿಸಿದ ನಂತರವೂ, ಹೃದಯದ ಪ್ರತಿಧ್ವನಿಸುವ ಓಂಕಾರ ಉಳಿಯುತ್ತದೆ. ಭಗವಂತನನ್ನು ಪೂಜಿಸುವಲ್ಲಿ ಮನಸ್ಸನ್ನು ಕೇಂದ್ರೀಕರಿಸಲು ಇದು ತುಂಬಾ ಸಹಾಯಕವಾಗಿದೆ. ಅಂತಹ ಪರಿಣಾಮಕಾರಿ ಗಂಟೆಗಳನ್ನು ಮಾಡುವಲ್ಲಿ ಅವರ ಪ್ರಯತ್ನ ನಿಜಕ್ಕೂ ಶ್ಲಾಘನೀಯ. ಈ ಪವಿತ್ರ ಕಾರ್ಯದ ಯಶಸ್ಸಿಗಾಗಿ ನಾವು ಯಾವಾಗಲೂ ಭಗವಂತನನ್ನು ಪ್ರಾರ್ಥಿಸುತ್ತೇವೆ.",
    ],
  },
  {
    id: "vidwan-sri-jagadesh-sharma-sampa",
    name: "Vidwan Sri Jagadesh Sharma Sampa",
    photo: vidwanSriJagadeshSharmaSampaPhoto,
    text: [
      "Bell sound is an integral part of Indian worship rituals. Its sound must resonate before the worship. It causes the arrival of deities and the departure of demons. Mahayogi Sriranga Mahaguru draws attention to the spirituality of bell sound. He makes it experienceable in the background of scripture and experiment. Thus, bell sound is essential for spirituality and worship, which is a part of it. But it is noteworthy how that bell sound should be for the purpose to be fulfilled. If the sound comes anyhow, it does not produce the intended effect. It is only when it is a divine sound that the work is accomplished. Knowledge of ancient science (Arsha Vijnana) is needed to prepare a bell that emits such knowledge-sound. Bells prepared without it are useless. Currently, Sri Vadiraja is preparing bells in the background of such ancient wisdom (Arsha Prajna). This is a very rare occurrence in the field of bell construction. If the bells built by him become essential in our temples and in the prayer rooms of homes, it will be a gratitude to his hard work and meaningfulness to our worship.",
    ],
    name_kn: "ವಿದ್ವಾನ್ ಶ್ರೀ ಜಗದೀಶ್ ಶರ್ಮಾ ಸಂಪ",
    text_kn: [
      "ಘಂಟಾನಾದ ಭಾರತೀಯರ ಉಪಾಸನಾ ವಿಧಿಯ ಅವಿಭಾಜ್ಯ ಅಂಗ. ಪೂಜೆಯ ಮೊದಲು ಅದರ ನಾದ ಅನುರಣಿಸಬೇಕು. ಅದು ದೇವತೆಗಳ ಆಗಮನಲ್ಲಿ ಮತ್ತು ರಾಕ್ಷಸರ ನಿರ್ಗಮನಕ್ಕೆ ಕಾರಣ. ಮಹಾಯೋಗಿ ಶ್ರೀರಂಗ ಮಹಾಗುರುಗಳು ಘಂಟಾನಾದದ ಅಧ್ಯಾತ್ಮಿಕತೆಯತ್ತ ಗಮನ ಸೆಳೆಯುತ್ತಾರೆ. ಶಾಸ್ತ್ರ ಮತ್ತು ಪ್ರಯೋಗದ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಅದನ್ನು ಅನುಭವಗಮ್ಯವಾಗಿಸುತ್ತಾರೆ. ಹೀಗೆ ಅಧ್ಯಾತ್ಮಕ್ಕೂ ಅದರದೇ ಭಾಗವಾದ ಉಪಾಸನೆಗೂ ಘಂಟಾನಾದ ಅವಶ್ಯಕ. ಆದರೆ ಆ ಘಂಟಾನಾದ ಹೇಗಿದ್ದಾಗ ಉದ್ದೇಶ ಈಡೇರುತ್ತದೆ ಎನ್ನುವುದು ಗಮನಾರ್ಹ. ಹೆಂಗೆಹೇಗೋ ಶಬ್ದ ಬಂದರೆ ಅದು ಉದ್ದೇಶಿತ ಪರಿಣಾಮವನ್ನು ಉಂಟುಮಾಡುವುದಿಲ್ಲ. ಅದು ದಿವ್ಯನಾದವಾದಾಗ ಮಾತ್ರ ಕಾರ್ಯಸಿದ್ಧಿ.",
      "ಅಂತಹ ವಿದ್ಯನಾದವನ್ನು ಹೊರಹೊಮ್ಮಿಸುವಂತೆ ಘಂಟೆಯನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಅರ್ಷವಿಜ್ಞಾನದ ಅರಿವು ಬೇಕು. ಅದಿಲ್ಲದೆ ಸಿದ್ಧವಾದ ಘಂಟೆಗಳು ವ್ಯರ್ಥ. ಪ್ರಕೃತ. ಶ್ರೀ ವಾದಿರಾಜರು ಅಂತಹ ಆರ್ಷಪ್ರಜ್ಞೆಯ ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಘಂಟೆಗಳನ್ನು ಸಿದ್ಧಪಡಿಸುತ್ತಿದ್ದಾರೆ. ಇದು ಘಂಟೆಯ ನಿರ್ಮಾಣದ ಕ್ಷೇತ್ರದಲ್ಲೇ ಅತ್ಯಪರೂಪದ ಸಂಗತಿ. ಇವರು ನಿರ್ಮಿಸಿದ ಘಂಟೆಗಳು ನಮ್ಮ ದೇವಾಲಯಗಳಲ್ಲಿ, ಮನೆಗಳ ಪೂಜಾಗೃಹದಲ್ಲಿ ಅವಶ್ಯ ಇರುವಂತಾದರೆ ಅವರ ಪರಿಶ್ರಮಕ್ಕೆ ಧನ್ಯತೆ, ನಮ್ಮ ಉಪಾಸನೆಗೆ ಸಾರ್ಥಕತೆ.",
    ],
  },
];
