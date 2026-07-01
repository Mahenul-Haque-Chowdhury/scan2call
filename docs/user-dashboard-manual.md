# Scan2Call Customer Dashboard Manual

This guide covers the regular customer account area at **scan2call.com.au/dashboard** —
what a customer sees and can do after creating a free account and/or buying tags. Share
this with customers or support staff who need to help customers navigate their account.

---

## 1. Creating an Account & Signing In

1. Go to **scan2call.com.au/register** to create a free account (email/password, or
   Google/Facebook sign-in), or **scan2call.com.au/login** if you already have one.
2. An account is free — you only pay when you buy a physical tag from the Store.
3. Once signed in, the dashboard and its sidebar (Dashboard, Tags, Orders, Store, Saved
   Addresses, Redeem Gifts, Settings) become available from any page via the account menu.

---

## 2. Dashboard (`/dashboard`)

Your homepage after logging in. Shows:

| Card | What it means |
|---|---|
| **Total Tags** | How many QR tags you own. |
| **Active Tags** | Tags currently switched on and protecting an item. |
| **Lost Tags** | Tags you've marked as "lost mode" (see Tags section below). |
| **Total Scans** | How many times any of your tags have been scanned by a finder. |

Below that:
- **Recent Scans** — a feed of the latest times someone scanned one of your tags, so you
  can see activity as it happens.
- **Quick Actions** — shortcuts to **Add New Tag** (register a tag you already have),
  **Browse Store** (buy new tags), and **My Orders** (track existing orders).

If you're new and haven't bought or activated a tag yet, these will show zeros — that's
expected, not an error.

---

## 3. Tags (`/tags`)

Manage every QR tag linked to your account.

- If you have no tags yet, you'll see **"No tags yet"** with two options:
  - **Scan QR to Activate** — if you already have a physical tag in hand (bought in-store,
    received as a gift, or it shipped to you), use your camera to scan its QR code and
    link it to your account.
  - **Browse Store** — buy a new tag online.
- Click into a tag to see its full detail page, where you can:
  - **Upload a photo** of the item (JPG/PNG/WebP, max 5MB) — shown to help you recognize
    the tag in your list, not shown to finders.
  - **Edit its label and description** (e.g. "Max the Dog," "Blue Suitcase") so you can
    tell tags apart.
  - **Set Contact Preferences per tag** — four separate switches: Allow Voice Calls,
    Allow SMS, Allow WhatsApp, and Allow Send Location. Turn off any channel you don't
    want finders using for that specific item. There is no single "on/off" switch for the
    whole tag — these four toggles are what control how (and whether) a finder can reach
    you.
  - **Lost Mode** — the tag's most important safety setting:
    - When a tag is first activated, **Lost Mode starts disabled**, and the page shows a
      warning: *"Your tag is not protected. If this item is lost, finders won't be able
      to contact you."* You must turn Lost Mode on (or the item's status must be marked
      lost) before a finder who scans it will see any contact options.
    - Turning it on lets you add an optional custom message shown to finders.
    - Turning it back off asks for confirmation, since finders will no longer be able to
      contact you through that tag if it goes missing again.
  - **View scan history** — every time and place the tag has been scanned, and whether
    the finder actually tried to make contact ("Contacted") or just viewed the page
    ("View only").
  - **Copy the QR code's URL** — useful if you want to double check what's encoded on the
    physical tag.
  - **Delete the tag** — permanent, asks for confirmation first.
- A tag's status badge will show one of: **Active**, **Lost**, **Inactive** (assigned to
  your account but not yet activated), **Found** (someone reported finding it), or
  **Deactivated**.

---

## 4. Orders (`/orders`)

Your order history.

- Table shows order number, date, total, and status: **Pending**, **Paid**,
  **Processing**, **Shipped**, **Delivered**, **Cancelled**, or **Refunded**.
- Click an order to see full details: order summary (subtotal/shipping/tax/total), payment
  status, items purchased, and the shipping address used.
- **If an order stays "Pending" for a long time**, it usually means checkout was started
  but payment was never completed (e.g. closed the browser tab on the Stripe payment
  page). Go back to the Store and re-order, or use the cart to try checkout again — a
  pending, unpaid order does not ship and does not charge you.

---

## 5. Store (`/store`)

Browse and buy QR tags — this is public (you don't need to be logged in to browse), but
you'll need an account to check out.

- Each product shows price, tag type, and stock status.
- **Add to Cart** to buy online. A mini-cart preview appears; the cart icon in the top nav
  shows your item count.
- Click into a product for full details, images, and a quantity selector.
- At checkout, you choose how long you want the QR active (1–5 years) and whether to turn
  on **auto-renewal** so it never lapses without you doing anything.

---

## 6. Saved Addresses (`/saved-addresses`)

Store one or more shipping addresses so checkout is faster next time.

- **Create a new address** to add one; mark one as **Default** so it's pre-selected at
  checkout.
- **Edit** or **Delete** any saved address.
- Saved addresses are used only for shipping — Scan2Call does not store your payment
  details here (that's handled securely by Stripe).

---

## 7. Redeem Gifts (`/redeem-gifts`)

If someone gives you a gift code (format `Scan2Call-Gift-XXXXXXXX`), enter it here and
click **Redeem Code** to add that tag to your account for free.

---

## 8. Settings (`/settings`)

Manage your profile and preferences.

- **Profile** — update your first/last name and phone number (used for SMS notifications
  and the anonymous call relay). Your email is fixed and can't be changed here — contact
  support if you need to change it.
- **Phone verification is required.** Adding or changing your phone number doesn't take
  effect for finder contact until you verify it:
  1. Enter the new number and click **Save Changes**.
  2. A **"Verify your phone number"** prompt appears. Click **Verify** to receive a
     6-digit code by SMS.
  3. Enter the code and click **Confirm** (or **Resend** if it didn't arrive).
  4. Once confirmed, the number shows a green **Verified** badge.
  - Until verified, finders may not be able to reach you by call/SMS/WhatsApp through
    your tags — verify your number as soon as you add or change it.
- Turn on **"Use the same number for WhatsApp"** if your WhatsApp uses the same phone
  number, or turn it off to set a different one.
- **Notifications** (`/settings/notifications`) — toggle how you're alerted when a tag is
  scanned:
  - **Scan notifications** — master toggle for scan alerts.
  - **Email notifications** — get scan alerts and account updates by email.
  - **SMS notifications** — get scan alerts by text to your registered phone number.
  - **Push notifications** — real-time browser notifications for scans (only works while
    you have the site open or have allowed browser notifications).
- **Orders & Receipts** section — quick link back to your order history and past
  payments.

---

## How the Anonymous Relay Works (for context)

When someone finds your lost item and scans the QR tag:
1. They're taken to a scan page — no app required.
2. They can call, text, or WhatsApp you through Scan2Call's relay.
3. Your real phone number, email, and address are **never shown** to them — the relay uses
   a temporary proxy number that expires automatically.

This is why keeping your phone number and notification settings up to date in **Settings**
matters — it's how finders actually reach you.

---

## Quick Reference: Common Tasks

| I want to... | Go to |
|---|---|
| Activate a tag I just received | Tags → Scan QR to Activate |
| Buy a new tag | Store → Add to Cart → Checkout |
| Check if my order shipped | Orders → click the order |
| Add/change my shipping address | Saved Addresses |
| Use a gift code someone gave me | Redeem Gifts |
| Change my phone number | Settings → Profile → Save, then verify the new number by SMS code |
| Turn off SMS alerts | Settings → Notifications |
| Turn on Lost Mode so finders can contact me | Tags → select tag → Actions → enable Lost Mode |
| Stop a finder from calling (but allow text) | Tags → select tag → Contact Preferences → turn off Allow Voice Calls |
| Add a photo of my item | Tags → select tag → Photo → Upload Photo |
