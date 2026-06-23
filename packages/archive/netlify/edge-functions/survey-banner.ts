import type { Config, Context } from '@netlify/edge-functions'

const BANNER_URL = 'https://take.survey.stackoverflow.co/jfe/form/SV_4GHunpL3IfJ3rRc?utm_medium=referral&utm_source=survey-archive&utm_campaign=dev-survey-2026&utm_content=announcement-banner-survey'
const BANNER_TEXT = 'The 2026 Stack Overflow Developer Survey is live — take it now →'

const BANNER = `
<aside id="ds-promo-banner" style="all:revert;display:flex;align-items:center;justify-content:center;position:fixed;bottom:0;left:0;right:0;z-index:99999;
  background:#0a95ff;color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;
  font-size:15px;line-height:1.4;text-align:center;padding:10px 56px;box-sizing:border-box">
  <a href="${BANNER_URL}" style="all:revert;color:#fff;text-decoration:none;font-weight:600"
    >${BANNER_TEXT}</a>
  <button id="ds-promo-close" type="button" aria-label="Close" style="all:revert;position:absolute;right:16px;top:50%;transform:translateY(-50%);
    background:none;border:none;color:#fff;font:inherit;text-decoration:underline;cursor:pointer;padding:4px 8px">Close</button>
</aside>
<script>
  (function () {
    var KEY = 'ds-promo-dismissed';
    var bar = document.getElementById('ds-promo-banner');
    if (!bar) return;
    try { if (localStorage.getItem(KEY)) { bar.style.display = 'none'; return; } } catch (e) {}
    document.getElementById('ds-promo-close').addEventListener('click', function () {
      bar.style.display = 'none';
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
    });
  })();
</script>`

export default async function handler(_req: Request, context: Context) {
  const res = await context.next()

  if (!res.headers.get('content-type')?.includes('text/html')) return res

  // Inject right after the opening <body> tag
  const html = await res.text()
  const injected = html.replace(/(<body[^>]*>)/i, `$1\n${BANNER}`)

  // Drop length/encoding headers as we’ve changed the page
  const headers = new Headers(res.headers)
  headers.delete('content-length')
  headers.delete('content-encoding')

  return new Response(injected, { status: res.status, headers })
}

// Run on every page; skip static asset trees that never serve HTML.
export const config: Config = {
  path: '/*',
  excludedPath: ['/legacy-assets/*', '/*/site/_app/*'],
}
