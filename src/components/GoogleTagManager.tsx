import Script from "next/script";

/**
 * Google Tag Manager — Mike's own container, the one the AgentLoft site ran
 * before the move to this app. It fires his GA4 property (G-274CW35DCF), so
 * GA4 is NOT loaded separately here; adding gtag.js too would double-count.
 *
 * The ID is public (it ships in every page's HTML), so it is safe in the repo.
 * Override per environment with NEXT_PUBLIC_GTM_ID. Set it to an empty string
 * to switch tracking off entirely (e.g. on a staging project).
 *
 * Deliberately NOT included: GTM-P5TVXXCW. AgentLoft loaded that second
 * container (it carries a Google Ads tag, AW-18036391353) and it is not in
 * Mike's GTM account. Ownership is unconfirmed, so it is not copied over.
 * Until that Ads conversion tag is recreated in GTM-KMV9VQFH, Google Ads
 * conversions from this site will not be recorded.
 */
const DEFAULT_GTM_ID = "GTM-KMV9VQFH";
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? DEFAULT_GTM_ID;

export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
