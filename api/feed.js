// فایل نهایی و اصلاح شده: /api/feed.js

export default async function handler(request, response) {
    // ---- بخش جدید و مهم برای مدیریت کامل CORS ----
    // این هدرها به مرورگر می‌گویند که سایت فریمر شما مجاز به درخواست است
    response.setHeader('Access-Control-Allow-Origin', '*'); // به هر دامنه‌ای اجازه بده
    response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // اگر درخواست از نوع "pre-flight" (OPTIONS) بود، فوراً پاسخ موفقیت‌آمیز بده
    if (request.method === 'OPTIONS') {
        return response.status(200).end();
    }
    // ---------------------------------------------

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

        // تنظیم کش برای ۱۰ دقیقه
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

        return response.status(200).json({ items: processedItems });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to fetch news from Alpha Vantage' });
    }
}
