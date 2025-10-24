const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { tiktokLink, name, email, priceExpectation } = req.body;

        // Create Notion page
        await notion.pages.create({
            parent: { database_id: process.env.NOTION_INQUIRIES_DATABASE_ID },
            properties: {
                'Inquiry': {
                    title: [{ text: { content: `${name} - ${priceExpectation}` } }]
                },
                'Status': {
                    select: { name: 'New' }
                },
                'Seller Name': {
                    rich_text: [{ text: { content: name } }]
                },
                'Seller Email': {
                    email: email
                },
                'TikTok Page': {
                    url: tiktokLink
                },
                'Price Expectation': {
                    rich_text: [{ text: { content: priceExpectation } }]
                },
                'Date': {
                    date: { start: new Date().toISOString() }
                }
            }
        });

        res.status(200).json({ success: true, message: 'Inquiry submitted successfully' });
    } catch (error) {
        console.error('Error creating Notion page:', error);
        res.status(500).json({ error: 'Failed to submit inquiry' });
    }
};
