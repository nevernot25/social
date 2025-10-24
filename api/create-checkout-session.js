const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
    lyric: { first: 80, additional: 40 },
    topic: { first: 60, additional: 30 },
    combo: 120,
    fastDelivery: 20
};

const VOUCHERS = {
    'FRIENDS10': 0.10
};

const TAX_RATE = 0.081;

function calculateTotal(lyricCount, topicCount, fastDelivery, voucherCode) {
    let subtotal = 0;

    if (lyricCount > 0 && topicCount > 0) {
        subtotal += PRICES.combo;
        if (lyricCount > 1) subtotal += (lyricCount - 1) * PRICES.lyric.additional;
        if (topicCount > 1) subtotal += (topicCount - 1) * PRICES.topic.additional;
    } else {
        if (lyricCount > 0) {
            subtotal += PRICES.lyric.first;
            if (lyricCount > 1) subtotal += (lyricCount - 1) * PRICES.lyric.additional;
        }
        if (topicCount > 0) {
            subtotal += PRICES.topic.first;
            if (topicCount > 1) subtotal += (topicCount - 1) * PRICES.topic.additional;
        }
    }

    if (fastDelivery) {
        subtotal += PRICES.fastDelivery;
    }

    // Apply voucher
    if (voucherCode && VOUCHERS[voucherCode.toUpperCase()]) {
        subtotal -= subtotal * VOUCHERS[voucherCode.toUpperCase()];
    }

    // Add tax
    const total = subtotal + (subtotal * TAX_RATE);

    return Math.round(total * 100) / 100; // Round to 2 decimals
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { lyricCount, topicCount, fastDelivery, voucherCode, description, songLink, genre } = req.body;

        const total = calculateTotal(lyricCount, topicCount, fastDelivery, voucherCode);

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
                        unit_amount: total * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${req.headers.origin || req.headers.referer}/success.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || req.headers.referer}/#pricing`,
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
};
