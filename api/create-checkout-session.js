const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const PRICES = {
    lyric: { first: 100, additional: 50 },
    topic: { first: 100, additional: 30 },
    combo: 150
};

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

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { lyricCount, topicCount, description, songLink, genre } = req.body;

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
