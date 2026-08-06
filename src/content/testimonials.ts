/**
 * Client testimonials. These are real review excerpts from Roland Luxury's
 * public profiles. Full reviews (800+ across all sites) live on Zillow, Yelp,
 * and Google — linked from the testimonials page.
 */
export type Testimonial = {
  quote: string;
  author: string;
  location: string;
  rating: number; // 1–5
};

export const testimonialsAreSample = false;

export const testimonials: Testimonial[] = [
  {
    quote:
      "Mike lent his expertise throughout the negotiation process and made everything feel easy from start to finish.",
    author: "Verified client review",
    location: "Zillow",
    rating: 5,
  },
  {
    quote:
      "He is always easy to get ahold of and will go to bat for you during the negotiation process.",
    author: "Verified client review",
    location: "Zillow",
    rating: 5,
  },
];
