const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

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

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        const orderDetails = {
            orderId: session.id,
            customerEmail: session.customer_details.email,
            customerName: session.customer_details.name || 'N/A',
            amount: (session.amount_total / 100).toFixed(2),
            lyricCount: session.metadata.lyricCount,
            topicCount: session.metadata.topicCount,
            songLink: session.metadata.songLink,
            genre: session.metadata.genre,
            delivery: session.metadata.delivery || 'Normal',
            voucher: session.metadata.voucher || 'None',
            date: new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })
        };

        console.log('Payment successful:', orderDetails);

        // Create Notion page
        try {
            await notion.pages.create({
                parent: { database_id: process.env.NOTION_ORDERS_DATABASE_ID },
                properties: {
                    'Order': {
                        title: [{ text: { content: `${orderDetails.lyricCount} Lyric + ${orderDetails.topicCount} Topic | ${orderDetails.customerName}` } }]
                    },
                    'Status': {
                        select: { name: 'Pending' }
                    },
                    'Customer Email': {
                        email: orderDetails.customerEmail
                    },
                    'Customer Name': {
                        rich_text: [{ text: { content: orderDetails.customerName } }]
                    },
                    'Amount': {
                        number: parseFloat(orderDetails.amount)
                    },
                    'Lyric Posts': {
                        number: parseInt(orderDetails.lyricCount)
                    },
                    'Topic Posts': {
                        number: parseInt(orderDetails.topicCount)
                    },
                    'Genre': {
                        select: { name: orderDetails.genre }
                    },
                    'Delivery': {
                        select: { name: orderDetails.delivery }
                    },
                    'Voucher': {
                        rich_text: [{ text: { content: orderDetails.voucher } }]
                    },
                    'Song Link': {
                        url: orderDetails.songLink
                    },
                    'Order ID': {
                        rich_text: [{ text: { content: orderDetails.orderId } }]
                    },
                    'Date': {
                        date: { start: new Date().toISOString() }
                    }
                }
            });
            console.log('Notion page created successfully');
        } catch (notionError) {
            console.error('Failed to create Notion page:', notionError);
            // Don't fail the webhook if Notion fails
        }
    }

    res.json({ received: true });
};
