import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema } from "@/lib/schema";
import { blogListItems } from "@/content/blog";
import { BlogSearch } from "@/components/BlogSearch";

export const metadata: Metadata = {
  title: "Las Vegas Real Estate Blog",
  description:
    "Market updates, new construction, and buyer & seller guides for Las Vegas and Henderson real estate from Roland Luxury.",
  alternates: { canonical: "/blog" },
};

export default async function BlogIndex({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const items = blogListItems();

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <BlogSearch items={items} initialCategory={category} />
    </>
  );
}
