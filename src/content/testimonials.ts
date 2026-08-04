/**
 * Client testimonials. `testimonialsAreSample` MUST stay true until these
 * are replaced with real, verified client reviews — the page shows an
 * honest banner while it's true. Do not present placeholder quotes as real.
 */
export type Testimonial = {
  quote: string;
  author: string;
  location: string;
  rating: number; // 1–5
};

export const testimonialsAreSample = true;

export const testimonials: Testimonial[] = [
  {
    quote:
      "[Sample placeholder] They knew our community inside and out and made a stressful move feel effortless. Replace with a real client review.",
    author: "Client name",
    location: "Henderson, NV",
    rating: 5,
  },
  {
    quote:
      "[Sample placeholder] Priced our home perfectly and negotiated hard on our behalf. Replace with a real client review.",
    author: "Client name",
    location: "Summerlin, Las Vegas",
    rating: 5,
  },
  {
    quote:
      "[Sample placeholder] First-time buyers and they guided us through every step. Replace with a real client review.",
    author: "Client name",
    location: "Las Vegas, NV",
    rating: 5,
  },
];
