import type { Config, Context } from "@netlify/edge-functions";

// ─── Edit these two to change the banner ──────────────────────────────────
// TODO: replace with the final destination URL + copy.
const BANNER_URL = "https://take.survey.stackoverflow.co/jfe/form/SV_4GHunpL3IfJ3rRc?utm_medium=referral&utm_source=survey-archive&utm_campaign=dev-survey-2026&utm_content=announcement-banner-survey";
const BANNER_TEXT = "The 2026 Stack Overflow Developer Survey is live — take it now →";
// ──────────────────────────────────────────────────────────────────────────

// `all:revert` insulates the banner from each year's wildly different CSS
// (old Bootstrap `data-spy` years, the `theme-dark` years, the SvelteKit 2024
// site). Styles are inline so no archived stylesheet can override them.
const BANNER = `
<aside id="ds-promo-banner" style="all:revert;display:block;position:fixed;bottom:0;left:0;right:0;z-index:99999;
  background:#0a95ff;color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
  font-size:15px;line-height:1.4;text-align:center;box-sizing:border-box">
  <a href="${BANNER_URL}" style="all:revert;color:#fff;padding:10px 16px;text-decoration:underline;font-weight:600;display:block;text-decoration:none"
    >${BANNER_TEXT}</a>
</aside>`;

export default async function handler(_req: Request, context: Context) {
  const res = await context.next();
  if (!res.headers.get("content-type")?.includes("text/html")) return res;

  // Inject right after the opening <body> tag
  const html = await res.text();
  const injected = html.replace(/(<body[^>]*>)/i, `$1\n${BANNER}`);

  // Drop length/encoding headers as we’ve changed the page
  const headers = new Headers(res.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");

  return new Response(injected, { status: res.status, headers });
}

export const config: Config = {
  // Run on every page; skip static asset trees that never serve HTML.
  path: "/*",
  excludedPath: ["/legacy-assets/*", "/*/site/_app/*"],
};
