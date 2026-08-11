import Script from "next/script";

import { isMetaEnabled, readTagConfig } from "@/lib/analytics";

const config = readTagConfig({
  NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
});

// Meta's official bootstrap, written without "!" so it survives being
// authored through a shell heredoc. Behaviour is identical.
const BOOTSTRAP = [
  "(function(f,b,e,v){",
  "  if (f.fbq) return;",
  "  var n = f.fbq = function(){",
  "    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);",
  "  };",
  "  if (f._fbq === undefined) f._fbq = n;",
  "  n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];",
  "  var t = b.createElement(e); t.async = true; t.src = v;",
  "  var s = b.getElementsByTagName(e)[0];",
  "  s.parentNode.insertBefore(t, s);",
  "})(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');",
].join("\n");

/**
 * Loads the Meta pixel and fires PageView.
 *
 * Purchase and AddToCart are fired separately by ConversionTracker, so this
 * only bootstraps fbq. Renders nothing when no pixel ID is configured.
 */
export default function MetaPixel() {
  if (isMetaEnabled(config) === false) return null;

  const pixelId = config.metaPixelId;

  const init = [
    BOOTSTRAP,
    "fbq('init', '" + pixelId + "');",
    "fbq('track', 'PageView');",
  ].join("\n");

  return (
    <>
      <Script id="meta-pixel-init" strategy="afterInteractive">
        {init}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={
            "https://www.facebook.com/tr?id=" + pixelId + "&ev=PageView&noscript=1"
          }
        />
      </noscript>
    </>
  );
}
