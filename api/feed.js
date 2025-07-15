// فایل نهایی و ضدضربه: /api/feed.js

export default async function handler(request, response) {
    // مدیریت CORS
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
        const newsData = await newsResponse.json();

        if (newsData["Information"] || newsData["Note"]) {
            return response.status(429).json({ error: 'محدودیت روزانه API تمام شده است.' });
        }
        
        if (!newsData.feed || newsData.feed.length === 0) {
            return response.status(200).json({ items: [] });
        }

        // *** تغییر اصلی: ما دیگر اخبار بدون عکس را حذف نمی‌کنیم ***
        const processedItems = newsData.feed.map(item => ({
            title: item.title,
            link: item.url,
            contentSnippet: item.summary,
            // اگر عکس وجود داشت، آن را ارسال می‌کنیم، در غیر این صورت مقدارش null خواهد بود
            image: item.banner_image || null,
            guid: item.url,
        }));
            
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
        return response.status(200).json({ items: processedItems });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to fetch or process news' });
    }
}
