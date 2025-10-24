const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tiktokLink, name, email, priceExpectation } = req.body;

        // Send email notification
        await resend.emails.send({
            from: 'PWRD Inquiries <inquiries@pwrd.live>',
            to: 'get@pwrd.live',
            replyTo: email,
            subject: `New Page Sale Inquiry from ${name}`,
            html: `
                <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 800;">PWRD</h1>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">New TikTok Page Sale Inquiry</p>
                    </div>

                    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #000;">
                        <h3 style="margin-top: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Page Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 600;">TikTok Page:</td>
                                <td style="padding: 8px 0; text-align: right;">
                                    <a href="${tiktokLink}" style="color: #000; text-decoration: underline; word-break: break-all;">${tiktokLink}</a>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 600;">Price Expectation:</td>
                                <td style="padding: 8px 0; text-align: right; font-size: 18px; font-weight: 700;">${priceExpectation}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; border-left: 4px solid #000;">
                        <h3 style="margin-top: 0; font-size: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Seller Information</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 600;">Name:</td>
                                <td style="padding: 8px 0; text-align: right;">${name}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px 0; color: #666; font-weight: 600;">Email:</td>
                                <td style="padding: 8px 0; text-align: right;">
                                    <a href="mailto:${email}" style="color: #000; text-decoration: underline;">${email}</a>
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #000; color: #fff; border-radius: 8px; padding: 20px; margin: 30px 0;">
                        <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: 700;">Next Steps</h3>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                            <li>Review the TikTok page analytics and engagement</li>
                            <li>Check follower quality and niche relevance</li>
                            <li>Evaluate if the price matches page performance</li>
                            <li>Reply to ${email} with an offer or request more info</li>
                        </ul>
                    </div>

                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center;">
                        <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">PWRD · Premium TikTok Marketing</p>
                    </div>
                </div>
            `
        });

        res.status(200).json({ success: true, message: 'Inquiry submitted successfully' });
    } catch (error) {
        console.error('Error sending inquiry email:', error);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
};
