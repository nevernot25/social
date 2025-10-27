# Notion Setup Guide

## Setup Time: 10 minutes

### Step 1: Create Notion Account
1. Go to [notion.so](https://notion.so)
2. Sign up (free forever)

---

### Step 2: Create Integration
1. Go to [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Name: `PWRD Orders`
4. Associated workspace: Select your workspace
5. Click **"Submit"**
6. Copy the **Internal Integration Token** (starts with `secret_`)
   - Save this! You'll need it for Vercel

---

### Step 3: Create Orders Database

1. In Notion, create a new page called **"PWRD Orders"**
2. Type `/database` and select **"Table - Inline"**
3. Add these properties (columns):

| Property Name     | Type          | Options                              |
|-------------------|---------------|--------------------------------------|
| Order             | Title         | (default)                            |
| Status            | Select        | Options: Pending, In Progress, Completed |
| Customer Name     | Text          |                                      |
| Customer Email    | Email         |                                      |
| Amount            | Number        | Format: USD                          |
| Lyric Posts       | Number        |                                      |
| Topic Posts       | Number        |                                      |
| Genre             | Select        | Options: Pop, Hip Hop, Country, EDM, Latin, R&B, Rock, Indie, Folk, Afrobeats |
| Delivery          | Select        | Options: Normal (2 weeks), Fast (5 days) |
| Voucher           | Text          |                                      |
| Song Link         | URL           |                                      |
| Order ID          | Text          |                                      |
| Date              | Date          |                                      |

4. Click **"..."** (top right) → **"Add connections"**
5. Select your **PWRD Orders** integration
6. Click **"Confirm"**
7. Copy the database ID from URL:
   - URL looks like: `notion.so/abc123def456?v=xyz`
   - Database ID is: `abc123def456` (between `.so/` and `?v=`)

---

### Step 4: Create Inquiries Database

1. Create another new page called **"PWRD Sell Inquiries"**
2. Type `/database` and select **"Table - Inline"**
3. Add these properties:

| Property Name     | Type    | Options                    |
|-------------------|---------|----------------------------|
| Inquiry           | Title   | (default)                  |
| Status            | Select  | Options: New, Reviewing, Contacted, Closed |
| Seller Name       | Text    |                            |
| Seller Email      | Email   |                            |
| TikTok Page       | URL     |                            |
| Price Expectation | Text    |                            |
| Date              | Date    |                            |

4. Click **"..."** → **"Add connections"** → Select **PWRD Orders** integration
5. Click **"Confirm"**
6. Copy the database ID from URL (same as before)


---

### Step 5: Add to Vercel

1. Go to [vercel.com](https://vercel.com) → Your project → **Settings** → **Environment Variables**
2. Add these 3 variables:

   - **Key:** `NOTION_API_KEY`
     - **Value:** `secret_...` (your integration token from Step 2)

   - **Key:** `NOTION_ORDERS_DATABASE_ID`
     - **Value:** (database ID from Step 3)

   - **Key:** `NOTION_INQUIRIES_DATABASE_ID`
     - **Value:** (database ID from Step 4)

3. Click **"Save"** for each
4. Go to **Deployments** → Click **"..."** on latest → **"Redeploy"**

---

### Step 6: Enable Stripe Customer Receipts

1. Go to [dashboard.stripe.com/settings/emails](https://dashboard.stripe.com/settings/emails)
2. Find **"Customer emails"** section
3. Enable **"Successful payments"**
4. Customers will now automatically get receipt emails from Stripe

---

## ✅ Done!

**What happens now:**
- ✅ Customers get automatic Stripe receipt emails
- ✅ Orders appear in your **"PWRD Orders"** Notion database
- ✅ Sell inquiries appear in your **"PWRD Sell Inquiries"** database
- ✅ Track status, add notes, set due dates in Notion
- ✅ 100% free forever

---

## Troubleshooting

**Orders not appearing in Notion?**
1. Check Vercel logs for errors
2. Verify database IDs are correct (no spaces, exact match)
3. Make sure integration is connected to both databases
4. Check integration token is valid

**Need help?**
- Test with a real order using voucher code: `TEST99` (99% off)
- Check Vercel function logs: Deployments → Click deployment → Functions tab
