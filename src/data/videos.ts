/**
 * YouTube videos from the original Pranavanaada site's video section, in the
 * order that site listed them. Titles/channels were looked up via YouTube
 * oEmbed. `bell` = about the bell & Omkara, `talks` = talks and stories.
 */
export type VideoCategory = 'bell' | 'talks';

export interface Video {
  id: string;
  title: string;
  channel: string;
  category: VideoCategory;
}

/** Shown large on the home page. */
export const FEATURED_VIDEO_ID = 'DHCXuPPhlOM';

export const videos: Video[] = [
  { id: "6kM2ltwt2Mo", title: "ಘಂಟಾನಾದದ ಹಿಂದಿನ ರಹಸ್ಯ ತಿಳ್ಕೊಳ್ಳಿ I Secret Behind Temple Bells Part 01I Badekkila Pradeep I Dive Deep", channel: "Badekkila Pradeep", category: 'bell' },
  { id: "LCY6JcwXZjA", title: "ಮಣ್ಣಿನ ಗಣೇಶ ಪೂಜೆ ಆರಂಭವಾಗಿದ್ದು ಯಾಕ್ ಗೊತ್ತಾ? I Badekkila Pradeep I Dive Deep", channel: "Badekkila Pradeep", category: 'talks' },
  { id: "Bosmx31sCBE", title: "ನಿಮ್ಮ ದೇಹದಲ್ಲಿದೆ ಕಂಡು ಕೇಳರಿಯದ ಅದ್ಭುತ ಶಕ್ತಿ! | What is Omkara? | Pranava Naada Bell | Omkara Nad", channel: "BOSS TV", category: 'bell' },
  { id: "10SwbBvNSOk", title: "ಓಂಕಾರ ಎಂದರೆ ಏನು? ಇದರಿಂದ ಇಷ್ಟೆಲ್ಲಾ ಲಾಭ ಇದ್ಯಾ? | What is Omkara? | Benefits of Omkar Chanting", channel: "BOSS TV", category: 'bell' },
  { id: "iKsMNUcOYpU", title: "ಓಂ ಶಬ್ಧದಲ್ಲಿ ಅಡಿಗಿರುವ ಆ ದೈವ ರಹಸ್ಯವೇನು? | What is Omkara? | Benefits of Omkar Chanting Benefits", channel: "BOSS TV", category: 'bell' },
  { id: "DHCXuPPhlOM", title: "ನಿಮ್ಮ ಮನೇಲಿರೋ ಘಂಟೆ ಪೂಜೆಗೆ ಯೋಗ್ಯನಾ..?|What is Pranavanaada Ghante?| Vadiraja Prasanna| Gaurish Akki", channel: "Gaurish Akki Studio", category: 'bell' },
  { id: "VIo7OQFon74", title: "ಪಂಚಲೋಹದ ಗಂಟೆ ಮತ್ತು ಜಯ ಗಂಟೆಗಳು ಯಾಕೆ ಇಷ್ಟು ದುಬಾರಿ? ಇಲ್ಲಿದೆ ಸ್ಪಷ್ಟ ವಿವರ!", channel: "Alaya Darshana", category: 'bell' },
  { id: "N5pdhtqXgJE", title: "ಉತ್ತನಹಳ್ಳಿಯ ಶ್ರೀಕೃಷ್ಣನ ದೇವಸ್ಥಾನದಲ್ಲಿ ನಡೆಯಿತು ವಿಸ್ಮಯ! ದೇವಾಲಯಕ್ಕೆ ಘಂಟೆ ಅರ್ಪಿಸಲು ಹೋದ ಸಂದರ್ಭದ ಅನುಭವ!", channel: "Alaya Darshana", category: 'bell' },
  { id: "kwGfFnvfep8", title: "ಯಾವುದೊ ಗಂಟೆ ಬಾರಿಸುವುದಲ್ಲ । ಓಂ ಪ್ರಣವನಾದ ಘಂಟೆಯೇ ಯಾಕೆ ಬಾರಿಸಬೇಕು? ಏನೆಲ್ಲಾ ಲಾಭಗಳಿವೆ?", channel: "Swadesh Media 2.0", category: 'bell' },
  { id: "WBDGGzC6YZg", title: "ನಿಮ್ಮ ಮನೇಲಿರೋ ಘಂಟೆ ಪೂಜೆಗೆ ಯೋಗ್ಯನಾ..? | ಓಂ ಪ್ರಣವನಾದ ಘಂಟೆಯೇ ಯಾಕೆ ಬಾರಿಸಬೇಕು? ಏನೆಲ್ಲಾ ಲಾಭಗಳಿವೆ?", channel: "V.P Vishwa Priya - ವಿಶ್ವ ಪ್ರಿಯಾ", category: 'bell' },
  { id: "03IOPwF-s5M", title: "E-2 ಸಾಧಕರು ಯಾವ ಕೈಯಲ್ಲಿ ಘಂಟಾವಾದನ ಮಾಡಬಾರದು... ಪ್ರಣವನಾದ ಘಂಟೆ", channel: "V.P Vishwa Priya - ವಿಶ್ವ ಪ್ರಿಯಾ", category: 'bell' },
  { id: "hLH04PVfrxY", title: "E-3 ಈ ಮೂರು ವಸ್ತುಗಳು ದೇವರ ಪೂಜೆಗೆ ಬಹು ಮುಖ್ಯ......ಸಾಧಕನ ಏಕಾಗ್ರತೆಗೆ ಬೇಕಾಗಿರುವ ಉತ್ತಮ ಮಾರ್ಗ !", channel: "V.P Vishwa Priya - ವಿಶ್ವ ಪ್ರಿಯಾ", category: 'bell' },
  { id: "uhrp75AnyrI", title: "Benefits Of Bell Sound | PART 01 | ಘಂಟೆಯ ನಾದದಿಂದ ನಮ್ಮ ಭವಿಷ್ಯವೇ ಬದಲಾಗಬಹುದು! Scientific ವಿಶ್ಲೇಷಣೆ", channel: "Vishwavani TV Special", category: 'bell' },
  { id: "ypZL6g5TqmQ", title: "What times do the bells refer to? | PART 2 | ಯಾವ ಸಮಯದಲ್ಲಿ ಘಂಟೆ ಬಾರಿಸಿದರೆ ಉತ್ತಮ ಫಲ ಸಿಗುತ್ತದೆ", channel: "Vishwavani TV Special", category: 'bell' },
  { id: "WyAozYF5h7k", title: "Vadiraj: ಕೌಶಿಕನಿಗೆ ಪಕ್ಷಿಯೊಂದು ಕಲಿಸಿತು ಕೃತಜ್ಞತೆಯ ಪಾಠ | Vistara Omkara", channel: "Vistara Omkara", category: 'talks' },
  { id: "Vu5Qxz1LQrA", title: "ಗುರು ಅಂದ್ರೇನು? ಗುರು ಅಂದರೆ ಯಾರು? | Who Is A Guru | Vistara Omkara", channel: "Vistara Omkara", category: 'talks' },
  { id: "5KS4b-pv8Dc", title: "ಸತ್ಯಭಾಮಳ ಗರ್ವವನ್ನು ಕೃಷ್ಣ ತೊಡೆದು ಹಾಕಿದ್ದೇಕೆ? | Kannada Motivational Video | Vistara Prerane", channel: "Vistara Omkara", category: 'talks' },
  { id: "M2PTX72cfys", title: "ಅಹಂಕಾರದಿಂದ ಆಗುವ ಅನಾನುಕೂಲಗಳನ್ನು ತಿಳಿಯಿರಿ..! | Vistara Omkara | Kannada Motivational Video", channel: "Vistara Omkara", category: 'talks' },
  { id: "lP37cYpO1u4", title: "Vijayavani Samskruthi: ಈ ಪಕ್ಷಿಯ ಗುಣ ಇದ್ದರೆ ಜೀವನವನ್ನು ಸುಲಭವಾಗಿ ಜೀವಿಸಬಹುದು!", channel: "VIJAYAVANI | ವಿಜಯವಾಣಿ", category: 'talks' },
  { id: "RBM6A28rRTU", title: "Vijayavani Samskruthi: ಈ ಗುಣ ನಮ್ಮಲ್ಲಿದ್ದರೆ ಮೋಕ್ಷದಿಂದ ದೂರವಾಗುತ್ತಿದ್ದೀವಿ ಎಂದರ್ಥ!", channel: "VIJAYAVANI | ವಿಜಯವಾಣಿ", category: 'talks' },
  { id: "BnqOe8ZKXTM", title: "Vijayavani Samskruthi: ದೇವರಲ್ಲಿ ಎಂತಹ ವರವನ್ನು ಕೇಳಬೇಕು ಎಂದು ತಿಳಿಸುವ ಕಥೆ ಇದು!", channel: "VIJAYAVANI | ವಿಜಯವಾಣಿ", category: 'talks' },
  { id: "tf2cOpccz6s", title: "ಜೀವನದಲ್ಲಿ ನಿಮ್ಮ ಉದ್ದೇಶಗಳು ಹೇಗೆ ಇರಬೇಕು..? | Vistara Omkara | Kannada Motivational Video | Motivation", channel: "Vistara Omkara", category: 'talks' },
  { id: "xGOFeVmnDZE", title: "Vijayavani Samskruthi: ಮೇಲ್ನೋಟಕ್ಕೆ ದುಃಖ ಎಂದು ಅನಿಸುವ ಈ ಕಥೆಯಲ್ಲಿ ಸುಖವಿದೆ!", channel: "VIJAYAVANI | ವಿಜಯವಾಣಿ", category: 'talks' },
  { id: "02PYDCx-JDE", title: "Vijayavani Samskruthi | ದೀಪ ಹಚ್ಚುವುದರ ಮಹತ್ವ ತಿಳಿಸಿದ ಮಹಾಭಾರತದ ಈ ಕಥೆ...! | Mahabharatha | Samskruthi", channel: "VIJAYAVANI | ವಿಜಯವಾಣಿ", category: 'talks' },
  { id: "QG4wEDIaxU8", title: "ಘಂಟಾ ನಾದದ ಮಹತ್ವ - ನೀವು ಅರಿತುಕೊಳ್ಳದ ದೇವಾಲಯದ ಘಂಟೆಯ ಹಿಂದಿನ ಸತ್ಯ | Decoding the Temple Bells", channel: "Sannidhi", category: 'bell' },
];

export const thumbnail = (id: string, quality: 'mq' | 'hq' | 'sd' = 'mq') => `https://i.ytimg.com/vi/${id}/${quality}default.jpg`;
