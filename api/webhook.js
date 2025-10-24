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

        // Send email notifications
        try {
            // Notification to PWRD
            await resend.emails.send({
                from: 'PWRD <onboarding@resend.dev>',
                to: 'get@pwrd.live',
                subject: `New Order: ${orderDetails.lyricCount} Lyric + ${orderDetails.topicCount} Topic - $${orderDetails.amount}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #000; max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                            .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
                            .title { font-size: 20px; font-weight: 700; margin: 20px 0 10px; }
                            .section { margin: 25px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
                            .row:last-child { border-bottom: none; }
                            .label { font-weight: 600; color: #666; }
                            .value { font-weight: 500; color: #000; }
                            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="logo">PWRD</div>
                        </div>

                        <div class="title">🎉 New Order Received</div>

                        <div class="section">
                            <div class="row">
                                <span class="label">Customer Name</span>
                                <span class="value">${orderDetails.customerName}</span>
                            </div>
                            <div class="row">
                                <span class="label">Customer Email</span>
                                <span class="value">${orderDetails.customerEmail}</span>
                            </div>
                            <div class="row">
                                <span class="label">Order ID</span>
                                <span class="value">${orderDetails.orderId}</span>
                            </div>
                            <div class="row">
                                <span class="label">Date</span>
                                <span class="value">${orderDetails.date}</span>
                            </div>
                        </div>

                        <div class="section">
                            <div class="row">
                                <span class="label">Lyric Videos</span>
                                <span class="value">${orderDetails.lyricCount}</span>
                            </div>
                            <div class="row">
                                <span class="label">Topic Videos</span>
                                <span class="value">${orderDetails.topicCount}</span>
                            </div>
                            <div class="row">
                                <span class="label">Genre</span>
                                <span class="value">${orderDetails.genre}</span>
                            </div>
                            <div class="row">
                                <span class="label">Delivery</span>
                                <span class="value">${orderDetails.delivery}</span>
                            </div>
                            <div class="row">
                                <span class="label">Song Link</span>
                                <span class="value"><a href="${orderDetails.songLink}" style="color: #000;">${orderDetails.songLink}</a></span>
                            </div>
                        </div>

                        <div class="section">
                            <div class="row">
                                <span class="label">Voucher Used</span>
                                <span class="value">${orderDetails.voucher}</span>
                            </div>
                            <div class="row">
                                <span class="label" style="font-size: 18px; font-weight: 700;">Total Amount</span>
                                <span class="value" style="font-size: 18px; font-weight: 700;">$${orderDetails.amount}</span>
                            </div>
                        </div>

                        <div class="footer">
                            PWRD · Premium TikTok Marketing<br>
                            This is an automated notification from your website.
                        </div>
                    </body>
                    </html>
                `
            });

            // Confirmation email to customer
            await resend.emails.send({
                from: 'PWRD <onboarding@resend.dev>',
                to: orderDetails.customerEmail,
                subject: 'Order Confirmed - PWRD',
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <style>
                            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.6; color: #000; max-width: 600px; margin: 0 auto; padding: 20px; }
                            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
                            .logo { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
                            .title { font-size: 20px; font-weight: 700; margin: 20px 0 10px; }
                            .content { margin: 25px 0; line-height: 1.8; }
                            .section { margin: 25px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
                            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; }
                            .row:last-child { border-bottom: none; }
                            .label { font-weight: 600; color: #666; }
                            .value { font-weight: 500; color: #000; }
                            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <div class="logo">PWRD</div>
                        </div>

                        <div class="title">Thank you for your order!</div>

                        <div class="content">
                            <p>Hey ${orderDetails.customerName},</p>
                            <p>Your order has been confirmed and we'll start working on your videos right away.</p>
                            <p>You'll receive your ${orderDetails.delivery === 'Express (24h)' ? 'express delivery' : 'videos'} according to the timeline selected.</p>
                        </div>

                        <div class="section">
                            <strong>Order Summary</strong>
                            <div style="margin-top: 15px;">
                                <div class="row">
                                    <span class="label">Order ID</span>
                                    <span class="value">${orderDetails.orderId}</span>
                                </div>
                                <div class="row">
                                    <span class="label">Lyric Videos</span>
                                    <span class="value">${orderDetails.lyricCount}</span>
                                </div>
                                <div class="row">
                                    <span class="label">Topic Videos</span>
                                    <span class="value">${orderDetails.topicCount}</span>
                                </div>
                                <div class="row">
                                    <span class="label">Genre</span>
                                    <span class="value">${orderDetails.genre}</span>
                                </div>
                                <div class="row">
                                    <span class="label">Delivery</span>
                                    <span class="value">${orderDetails.delivery}</span>
                                </div>
                                <div class="row">
                                    <span class="label" style="font-weight: 700;">Total</span>
                                    <span class="value" style="font-weight: 700;">$${orderDetails.amount}</span>
                                </div>
                            </div>
                        </div>

                        <div class="footer">
                            PWRD · Premium TikTok Marketing<br>
                            Questions? Reply to this email or contact us at get@pwrd.live
                        </div>
                    </body>
                    </html>
                `
            });

            console.log('Emails sent successfully');
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // Don't fail the webhook if email fails
        }
    }

    res.json({ received: true });
};
