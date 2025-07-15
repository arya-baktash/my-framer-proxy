// فایل نهایی و ضدضربه: /api/feed.js

export default async function handler(request, response) {
    // مدیریت کامل CORS (بدون تغییر)
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;
    if (!apiKey) {
        return response.status(500).json({ error: 'Alpha Vantage API key is not configured.' });
    }

    const topics = 'financial_markets,economy_monetary,earnings,blockchain';
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topics}&limit=50&apikey=${apiKey}`;

    try {
        const newsResponse = await fetch(alphaVantageUrl);
        if (!newsResponse.ok) {
            throw new Error(`Alpha Vantage API error: ${newsResponse.statusText}`);
        }
        
        const newsData = await newsResponse.json();

        // *** بخش جدید و هوشمند برای تشخیص محدودیت API ***
        // اگر پاسخی حاوی این کلیدها بود، یعنی محدودیت API تمام شده است.
        if (newsData["Information"] || newsData["Note"]) {
            console.warn("Alpha Vantage API limit likely reached:", newsData);
            // به جای برگرداندن لیست خالی، یک خطای واضح به فریمر می‌فرستیم.
            return response.status(429).json({ error: 'محدودیت روزانه API تمام شده است. این یک مشکل موقتی است.' });
        }
        
        if (!newsData.feed || newsData.feed.length === 0) {
            return response.status(200).json({ items: [] });
        }

        const processedItems = newsData.feed
            .filter(item => item.banner_image)
            .map(item => ({
                title: item.title,
                link: item.url,
                contentSnippet: item.summary,
                image: item.banner_image,
                guid: item.url,
            }));
            
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        return response.status(200).json({ items: processedItems });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to fetch news from Alpha Vantage' });
    }
}
