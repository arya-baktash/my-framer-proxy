// File: /api/data.js
import * as cheerio from 'cheerio';

export default async function handler(request, response) {
    const { url } = request.query;
    if (!url || !url.includes("myfxbook.com/members")) {
        return response.status(400).json({ error: "A valid MyFXBook profile URL is required." });
    }

    try {
        const myfxbookResponse = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        if (!myfxbookResponse.ok) throw new Error(`Fetch failed: ${myfxbookResponse.status}`);
        
        const html = await myfxbookResponse.text();
        const $ = cheerio.load(html);

        // --- سلکتورهای جدید و اصلاح‌شده بر اساس ساختار فعلی MyFXBook ---
        const growth = $('#widget-gain-value').text().trim();
        const drawdown = $('#widget-drawdown-value').text().trim();
        const profitability = $('td:contains("Profitability")').next('td').text().trim();
        
        let chartData = [];
        const scriptTags = $('script[type="text/javascript"]');
        scriptTags.each((i, el) => {
            const scriptContent = $(el).html();
            if (scriptContent && scriptContent.includes('var chartData')) {
                const match = scriptContent.match(/var chartData\s*=\s*(\[.*?\]);/);
                if (match && match[1]) {
                    chartData = JSON.parse(match[1].replace(/'/g, '"'));
                }
            }
        });

        const extractedData = {
            totalProfit: growth,
            maxDrawdown: drawdown,
            winRate: profitability,
            chartData: chartData.map(item => ({ value: item[1] }))
        };
        
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
        return response.status(200).json(extractedData);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: `Server Error: ${error.message}` });
    }
}
