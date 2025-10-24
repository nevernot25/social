const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tiktokLink, name, email, priceExpectation } = req.body;

        // Send email notification to PWRD
        await resend.emails.send({
            from: 'PWRD <onboarding@resend.dev>',
            to: 'get@pwrd.live',
            subject: `New Sell Inquiry: ${name} - ${priceExpectation}`,
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

                    <div class="title">📬 New Sell Inquiry</div>

                    <div class="section">
                        <div class="row">
                            <span class="label">Seller Name</span>
                            <span class="value">${name}</span>
                        </div>
                        <div class="row">
                            <span class="label">Seller Email</span>
                            <span class="value">${email}</span>
                        </div>
                        <div class="row">
                            <span class="label">TikTok Page</span>
                            <span class="value"><a href="${tiktokLink}" style="color: #000;">${tiktokLink}</a></span>
                        </div>
                        <div class="row">
                            <span class="label">Price Expectation</span>
                            <span class="value">${priceExpectation}</span>
                        </div>
                        <div class="row">
                            <span class="label">Date</span>
                            <span class="value">${new Date().toLocaleString('en-US', { timeZone: 'Europe/Zurich' })}</span>
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

        // Send confirmation email to user
        await resend.emails.send({
            from: 'PWRD <onboarding@resend.dev>',
            to: email,
            subject: 'We received your inquiry!',
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
                        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">PWRD</div>
                    </div>

                    <div class="title">Thanks for reaching out, ${name}!</div>

                    <div class="content">
                        <p>We've received your inquiry to sell your TikTok page and will review it shortly.</p>
                        <p>Our team will get back to you within 24-48 hours with an evaluation and next steps.</p>
                    </div>

                    <div class="section">
                        <strong>Your submission:</strong><br>
                        TikTok Page: <a href="${tiktokLink}" style="color: #000;">${tiktokLink}</a><br>
                        Price Expectation: ${priceExpectation}
                    </div>

                    <div class="footer">
                        PWRD · Premium TikTok Marketing<br>
                        Questions? Reply to this email or contact us at get@pwrd.live
                    </div>
                </body>
                </html>
            `
        });

        res.status(200).json({ success: true, message: 'Inquiry submitted successfully' });
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
};
