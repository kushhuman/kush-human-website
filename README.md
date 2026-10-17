# Kush Human — portfolio

Personal portfolio of Kushagra Kumar (Kush Human), motion graphic designer in Bengaluru.
Static site: plain HTML, CSS and ES modules, no build step.

## Run locally
```
node serve.mjs
```
Then open http://127.0.0.1:4173 (the server supports video range requests).

## Structure
- `index.html` — the page (SEO meta, JSON-LD, all sections)
- `style.css` — styles
- `app.js` — interactions: work bento grid + project player, service card stack, brief builder form, brands wheel, footer playground
- `tool-icons.js`, `logo-anim.js` — toolkit icons and the animated bird logo
- `assets/` — fonts, images and videos (`videos/hq` MP4s, `videos/Section 01/webm` showreels)

## Contact form
The brief builder posts to FormSubmit (`https://formsubmit.co/ajax/kushagra.kumar@kushhuman.com`).
Send one test brief after deploying to confirm delivery.
