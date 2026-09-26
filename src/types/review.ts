export interface Review {
  id: string;
  name: string;
  /** Role / affiliation shown under the name. */
  title?: string;
  photo: string;
  /** Paragraphs of the review. */
  text: string[];
  /** Kannada versions — fall back to English when missing. */
  name_kn?: string;
  title_kn?: string;
  text_kn?: string[];
}
