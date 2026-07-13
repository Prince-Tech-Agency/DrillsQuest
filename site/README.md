# DRILLS — now with a client-editable product manager

Your client can now log in at **yoursite.com/admin** and edit products —
change prices, swap photos, add or remove pieces, edit sizes — with zero
code. Changes they publish go live on the site automatically.

## What changed from the old version

- `products.js` is gone. Product data now lives in `content/products.json`,
  which the CMS reads and writes.
- `script.js` now fetches `content/products.json` on page load instead of
  using a hardcoded list.
- Added `/admin/index.html` and `/admin/config.yml` — this is **Decap CMS**
  (free, open-source), the actual editing tool your client will use.
- Fixed the hero image, which was pointing at the hoodie photo but labeled
  as the briefcase — it now shows the bag to match.

## One-time setup on Netlify (you do this, not your client)

1. **Deploy this folder to Netlify** as normal (drag-and-drop, or connect a
   Git repo — a Git repo is required for the CMS to save edits, so if you
   used drag-and-drop before, connect a GitHub repo this time instead).
2. In your Netlify site dashboard: **Site configuration → Identity → Enable Identity**.
3. Still under Identity: **Registration → set to "Invite only"** (so random
   people can't sign up).
4. Under **Identity → Services → Git Gateway → Enable Git Gateway**. This is
   what lets the CMS save changes back to your site.
5. Go to **Identity → Invite users**, and invite your client by email.
   They'll get an email to set a password.

## What your client does

1. Go to `yoursite.com/admin`.
2. Log in with the email/password from their invite.
3. Click **Products** → pick a product to edit, or **+ Add Product** for a
   new one.
4. Change the price, drag in a new photo, edit sizes, or add a "limited
   stock" note.
5. Click **Publish** — the live site updates within a minute or two.

No file paths, no JSON, no code — the form handles all of it.

## Notes

- Photos your client uploads through the CMS land in `images/uploads/` —
  keep that distinct from the original `images/` folder where your 4
  starting product photos live; both work fine, the CMS just needs
  somewhere to put new ones.
- The WhatsApp number, checkout flow, and everything else from before is
  unchanged — see the earlier README section below for that.
- If a client edit ever looks broken on the live site, the most common
  cause is a required field (like Photo) left empty — Decap CMS won't let
  them publish with a truly empty required field, but double-check if
  something looks off.

---

## Original store info (unchanged)

Orders go straight to your WhatsApp — no payment gateway, no monthly
platform fee.

- **WhatsApp number**: set in `script.js` (`WHATSAPP_NUMBER`) — already
  filled in as `2349157312667`. Update if that changes.
- **Checkout flow**: customer picks size → adds to bag → fills in
  name/phone/address → hits "Send order on WhatsApp" → their browser opens
  WhatsApp with the order pre-filled → they tap send → you confirm payment
  and delivery directly with them.
- **Not included**: order storage/admin dashboard beyond the product
  manager above (orders live in your WhatsApp chat history), inventory
  auto-tracking, and a real payment gateway. Happy to add Paystack later if
  you want card payments too.
