// Makes a shop's own install link: shops/<slug>/ with the shop's name on the app icon.
// Usage: node tools/new_shop.js <slug> "<shop name>"
// The page loads the main app inside it, so app updates reach every shop without rebuilding.
const fs = require('fs'), path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const [slug, name] = process.argv.slice(2);
if (!slug || !name || !/^[a-z0-9-]+$/.test(slug)) { console.error('usage: new_shop.js <slug a-z0-9-> "<name>"'); process.exit(1); }
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const dir = path.join(__dirname, '..', 'shops', slug);
fs.mkdirSync(dir, { recursive: true });
const fs_ = name.length <= 8 ? 54 : name.length <= 12 ? 44 : name.length <= 16 ? 36 : 30;
const svg = fs.readFileSync(path.join(__dirname, '..', 'icon.svg'), 'utf8')
  .replace(/<text[^>]*>سوبر ماركت<\/text>/, `<text x="256" y="368" text-anchor="middle" font-family="Cairo" font-weight="800" font-size="${fs_}" fill="url(#gd)" textLength="${Math.min(250, name.length * fs_ * 0.62)}" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>`);
(async () => {
  const b = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  for (const s of [512, 192]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Cairo:wght@800&display=swap" rel="stylesheet"><style>body{margin:0}svg{display:block;width:${s}px;height:${s}px}</style></head><body>${svg}</body></html>`);
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(dir, `icon-${s}.png`) }); await p.close();
  }
  await b.close();
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify({
    name, short_name: name, id: './', start_url: './', scope: './', display: 'standalone', orientation: 'any', lang: 'ar', dir: 'rtl',
    background_color: '#1f3d12', theme_color: '#1f3d12',
    icons: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }],
    description: 'كاشير ' + name
  }, null, 2));
  fs.writeFileSync(path.join(dir, 'index.html'), `<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(name)}</title>
<link rel="manifest" href="manifest.json"><link rel="icon" href="icon-192.png"><link rel="apple-touch-icon" href="icon-192.png">
<meta name="theme-color" content="#1f3d12">
<style>html,body{margin:0;height:100%;background:#f8f5ea}iframe{border:0;width:100%;height:100%;display:block}</style>
</head><body>
<iframe src="../../index.html?shop=${encodeURIComponent(name)}" allow="camera; clipboard-read; clipboard-write; fullscreen"></iframe>
<script>if('serviceWorker' in navigator)navigator.serviceWorker.register('../../sw.js').catch(()=>{})</script>
</body></html>
`);
  console.log('made shops/' + slug);
})();
