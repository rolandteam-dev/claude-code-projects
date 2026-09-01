import "./globals.css";

/**
 * Shared root layout — provides the document shell and global styles only.
 * Per-experience chrome lives in the route-group layouts: (site) for the
 * Roland Luxury marketing site, (homeowner) for the Roland Team homeowner
 * dashboards. This split lets the two experiences carry different branding,
 * navigation, and metadata while sharing one app and deployment.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
