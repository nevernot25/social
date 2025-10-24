# PWRD

Ultra-minimal, futuristic TikTok music marketing platform. 100M+ monthly views.

## Stack

- Pure HTML/CSS/JS (no frameworks)
- Inter typeface
- Stripe payments
- Node.js backend

## Setup

```bash
npm install
```

## Configure Stripe

1. Get API keys: [stripe.com/dashboard](https://dashboard.stripe.com/apikeys)
2. Copy `.env.example` to `.env`
3. Add your keys to `.env`
4. Update `script.js` line 11 with publishable key

## Run

```bash
npm start
```

Visit `http://localhost:3000`

## Pricing Logic

- Lyric: $100 first, $50 each additional
- Topic: $100 first, $30 each additional
- Combo: $150 for first lyric + first topic (save $50)

## Add Partner Logos

Replace placeholder in `index.html`:

```html
<div class="partners-grid">
    <img src="logo1.png" alt="Partner" class="partner-logo">
    <img src="logo2.png" alt="Partner" class="partner-logo">
</div>
```

## Deploy

**Vercel** (recommended):
```bash
vercel
```

**Netlify**: Connect repo, publish directory: `.`

Set environment variables in your hosting dashboard.

## Production Checklist

- [ ] Add live Stripe keys
- [ ] Set up webhook endpoint
- [ ] Add partner logos
- [ ] Test mobile responsive
- [ ] Custom domain + SSL

---

© 2024 PWRD
