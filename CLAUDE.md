# Kush Human portfolio — notes for Claude

Portfolio of Kushagra Kumar ("Kush Human"), motion graphic designer in Bengaluru. Static site, no build step:
`index.html`, `style.css`, `app.js` (ES module), `tool-icons.js`, `logo-anim.js`, media in `assets/`.
Preview: `node serve.mjs` → http://127.0.0.1:4173 (supports video range requests).

## Hard rules
- Never re-encode or compress the showreels: `assets/videos/Section 01/webm/SHowreel 2026.webm` (horizontal) and `SHowreel 2026 Vertical.webm`.
- The brief form posts to FormSubmit `https://formsubmit.co/ajax/kushagra.kumar@kushhuman.com` — keep that address. The email icon / footer link is `mailto:kushagra3521@gmail.com`.
- Never submit the form in tests. Don't claim email delivery is verified.
- Don't change the live site (kushhuman.com) without the owner's go-ahead.
- `window.KH_PREVIEW` (set only on the claude.ai preview build) switches the form off; this repo does not set it.

## Type scale (multiples of 8)
CSS vars `--fs-s/m/l/xl/2xl/h/mark`: S 16, M 24, L 32, XL 48, 2XL 64, headers 72, wordmark 160 (laptop).
Phone: headers 40, XL 24, 2XL 48, wordmark 64. Overrides are appended at the end of `style.css` with `!important`.

## Page, top to bottom
1. Hero — framed showreel on white dotted paper.
2. About (`#hello`) — "Hi, I'm Kushagra.", SEO statement with 3 video pills, 4 stat boxes (2×2 on phones).
3. Services (`#services`) — 4 cards in a scroll-driven sticky stack; covered cards shrink, tilt and dim (JS near the end of `app.js`). Spacing lives on `.svc + .svc` margin-top (a bottom margin makes earlier cards un-stick early).
4. Work (`#work`, dark, film-strip edges) — bento of justified rows, true video ratios, seeded search for the best ordering; project player with two arrow buttons bottom-right. Project 04 (KGeN website) is hidden via `HIDDEN` until that site is live.
5. Brands (`#brands`, white dotted) — logo wheel + marquee, then a strip of quiet grey shapes that scatter from the pointer.
6. Work & experiences (`#journey`) — bordered box, collapsed by default behind a + button; the entry nearest the reading line turns pink on scroll.
7. Toolkit (`#toolkit`) — same collapsible bordered box; 19 tools (Higgsfield in Motion & edit, Marvelous Designer in 3D — its icon is a placeholder "MD" mark, swap in the official logo when available).
8. Contact (`#contact`) — "Let's make it move." one line; pink brief-builder panel (need → budget → timeline → name/email) beside the vertical showreel. Swipes inside the pill reel don't scroll the page.
9. Footer — playground of draggable windows behind the "Kush Human" wordmark, email + LinkedIn / WhatsApp / Fiverr icons, Navigate / Connect / Studio columns.

## Style notes
White dotted canvas for light sections, black for work + footer; brand colours pink #fd0149, blue #0068ff, yellow #fde300, green #b5ff6c; black-outline cards with offset shadow. Click/tap focus rings and tap highlights are suppressed (keyboard Tab still shows them).
