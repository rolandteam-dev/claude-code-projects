import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The dedicated "luxury" landing page was retired; send old links and
      // search-engine equity to the general communities page.
      { source: "/las-vegas-luxury-real-estate", destination: "/communities", permanent: true },
      // Blog posts whose slugs dropped the old wording.
      { source: "/blog/how-to-sell-a-luxury-home-in-las-vegas", destination: "/blog/how-to-sell-a-home-in-las-vegas", permanent: true },
      { source: "/blog/macdonald-highlands-vs-ascaya-which-luxury-community-fits-you", destination: "/blog/macdonald-highlands-vs-ascaya-which-community-fits-you", permanent: true },
      { source: "/blog/las-vegas-luxury-seller-net-proceeds", destination: "/blog/las-vegas-seller-net-proceeds", permanent: true },
      { source: "/blog/off-market-luxury-homes-las-vegas", destination: "/blog/off-market-homes-las-vegas", permanent: true },
      { source: "/blog/las-vegas-luxury-market-what-makes-it-unique", destination: "/blog/las-vegas-custom-and-guard-gated-homes-what-makes-them-unique", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "d8j0ntlcm91z4.cloudfront.net" },
      { protocol: "https", hostname: "cdn.repliers.io" },
    ],
  },
};

export default nextConfig;
