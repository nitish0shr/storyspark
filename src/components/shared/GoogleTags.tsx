import Script from "next/script";

import {
  configurableIds,
  isGoogleEnabled,
  readTagConfig,
} from "@/lib/analytics";

const config = readTagConfig({
  NEXT_PUBLIC_GA4_ID: process.env.NEXT_PUBLIC_GA4_ID,
  NEXT_PUBLIC_GOOGLE_ADS_ID: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
});

/**
 * Loads gtag.js for GA4 and/or Google Ads, and opens window.dataLayer so a
 * Google Tag Manager container could read our ecommerce pushes.
 *
 * Renders nothing when no Google IDs are configured.
 */
export default function GoogleTags() {
  if (isGoogleEnabled(config) === false) return null;

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
