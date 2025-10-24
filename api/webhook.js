const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

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

        // Send email notification
        try {
            await resend.emails.send({
                from: 'PWRD Orders <orders@pwrd.live>',
                to: 'get@pwrd.live',
                subject: `New PWRD Order: ${orderDetails.lyricCount} Lyric + ${orderDetails.topicCount} Topic Posts | $${orderDetails.amount}`,
                html: `
                    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 800;">PWRD</h1>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">New Campaign Order</p>
                        </div>

                        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #000;">
                            <h3 style="margin-top: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Order Information</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Order ID:</td>
                                    <td style="padding: 8px 0; text-align: right;"><code>${orderDetails.orderId}</code></td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Date:</td>
                                    <td style="padding: 8px 0; text-align: right;">${orderDetails.date}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Total Amount:</td>
                                    <td style="padding: 8px 0; text-align: right; font-size: 20px; font-weight: 700;">$${orderDetails.amount}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #000;">
                            <h3 style="margin-top: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Campaign Details</h3>
                            <p style="margin: 0 0 15px 0; font-size: 14px; color: #666;">Create and schedule the following content for this campaign:</p>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Lyric Posts:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${orderDetails.lyricCount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Topic Posts:</td>
                                    <td style="padding: 8px 0; text-align: right; font-weight: 600;">${orderDetails.topicCount}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Genre:</td>
                                    <td style="padding: 8px 0; text-align: right;">${orderDetails.genre}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Delivery:</td>
                                    <td style="padding: 8px 0; text-align: right;">${orderDetails.delivery}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Voucher Used:</td>
                                    <td style="padding: 8px 0; text-align: right;">${orderDetails.voucher}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Song Link:</td>
                                    <td style="padding: 8px 0; text-align: right;">
                                        <a href="${orderDetails.songLink}" style="color: #000; text-decoration: underline;">${orderDetails.songLink}</a>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; border-left: 4px solid #000;">
                            <h3 style="margin-top: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Customer Information</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Name:</td>
                                    <td style="padding: 8px 0; text-align: right;">${orderDetails.customerName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                                    <td style="padding: 8px 0; text-align: right;">
                                        <a href="mailto:${orderDetails.customerEmail}" style="color: #000; text-decoration: underline;">${orderDetails.customerEmail}</a>
                                    </td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: #000; color: #fff; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700;">Next Steps</h3>
                            <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                                <li>Download the song from the provided TikTok link</li>
                                <li>Create ${parseInt(orderDetails.lyricCount) + parseInt(orderDetails.topicCount)} videos (${orderDetails.lyricCount} lyric + ${orderDetails.topicCount} topic)</li>
                                <li>Schedule posts across your pages in the ${orderDetails.genre} niche</li>
                                <li>Target delivery: ${orderDetails.delivery}</li>
                                <li>Send confirmation email to customer once posted</li>
                            </ul>
                        </div>

                        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
                            <p style="margin: 0; color: #999; font-size: 13px;">
                                <a href="https://dashboard.stripe.com/payments/${session.payment_intent}" style="color: #000; text-decoration: underline;">View Full Payment Details in Stripe</a>
                            </p>
                            <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">PWRD · Premium TikTok Marketing</p>
                        </div>
                    </div>
                `
            });
            console.log('Email notification sent successfully');
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the webhook if email fails
        }
    }

    res.json({ received: true });
};
