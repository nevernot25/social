// Simple Node.js backend for Stripe integration
// Install dependencies: npm install express stripe cors dotenv

require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Pricing logic (matches frontend)
const PRICES = {
    lyric: { first: 100, additional: 50 },
    topic: { first: 100, additional: 30 },
    combo: 150
};

// Calculate price on backend (security)
function calculateTotal(lyricCount, topicCount) {
    let total = 0;

    if (lyricCount > 0 && topicCount > 0) {
        total += PRICES.combo;
        if (lyricCount > 1) total += (lyricCount - 1) * PRICES.lyric.additional;
        if (topicCount > 1) total += (topicCount - 1) * PRICES.topic.additional;
    } else {
        if (lyricCount > 0) {
            total += PRICES.lyric.first;
            if (lyricCount > 1) total += (lyricCount - 1) * PRICES.lyric.additional;
        }
        if (topicCount > 0) {
            total += PRICES.topic.first;
            if (topicCount > 1) total += (topicCount - 1) * PRICES.topic.additional;
        }
    }

    return total;
}

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { lyricCount, topicCount, description, songLink, genre } = req.body;

        // Calculate price on server side for security
        const total = calculateTotal(lyricCount, topicCount);

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'PWRD TikTok Marketing Package',
                            description: description,
                        },
                        unit_amount: total * 100, // Stripe uses cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin}/#calculator`,
            metadata: {
                lyricCount: lyricCount.toString(),
                topicCount: topicCount.toString(),
                songLink: songLink,
                genre: genre
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error('Error creating checkout session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Webhook to handle successful payments
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // TODO: Add your business logic here
        // - Send confirmation email
        // - Add to CRM
        // - Notify team

        console.log('Payment successful:', {
            sessionId: session.id,
            customerEmail: session.customer_details.email,
            amount: session.amount_total / 100,
            lyricCount: session.metadata.lyricCount,
            topicCount: session.metadata.topicCount,
            songLink: session.metadata.songLink,
            genre: session.metadata.genre
        });
    }

    res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the website`);
});
