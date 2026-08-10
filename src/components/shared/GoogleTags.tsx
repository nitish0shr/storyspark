import Script from "next/script";

import { configurableIds, isTaggingEnabled, readGoogleTagConfig } from "@/lib/analytics";

const config = readGoogleTagConfig({
  NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL:
    process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL,
});

/**
 * Loads gtag.js for GA4 and/or Google Ads.
 *
 * Renders nothing at all when no IDs are configured, so the site ships
 * untagged until marketing provides them.
 */
export default function GoogleTags() {
  if (isTaggingEnabled(config) === false) return null;

  const ids = configurableIds(config);

  const init = [
    "window.dataLayer = window.dataLayer || [];",
    "function gtag(){dataLayer.push(arguments);}",
    "gtag('js', new Date());",
    ...ids.map((id) => "gtag('config', '" + id + "');"),
  ].join("\n");

  return (
    <>
      <Script
        src={"https://www.googletagmanager.com/gtag/js?id=" + ids[0]}
        strategy="afterInteractive"
      />
      <Script id="google-tags-init" strategy="afterInteractive">
        {init}
      </Script>
    </>
  );
}
