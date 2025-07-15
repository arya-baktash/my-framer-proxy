// فایل نهایی: /api/feed.js

export default async function handler(request, response) {
    // کلید API را به صورت امن از متغیرهای محیطی Vercel می‌خوانیم
    const apiKey = process.env.ALPHAVANTAGE_API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'Alpha Vantage API key is not configured.' });
    }

    // موضوعات مرتبط با فارکس و بازارهای مالی
    const topics = 'financial_markets,economy_monetary,earnings,blockchain';
    
    // ساخت URL نهایی برای Alpha Vantage
    const alphaVantageUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topics}&limit=50&apikey=${apiKey}`;

    try {
        const newsResponse = await fetch(alphaVantageUrl);
        if (!newsResponse.ok) {
            throw new Error(`Alpha Vantage API error: ${newsResponse.statusText}`);
        }
        
        const newsData = await newsResponse.json();

        // بررسی اینکه آیا پاسخی دریافت شده یا نه (ممکن است به خاطر محدودیت API خالی باشد)
        if (!newsData.feed || newsData.feed.length === 0) {
            console.log("Alpha Vantage returned an empty feed. This might be due to API rate limits.");
            return response.status(200).json({ items: [] });
        }

        // **پردازش و تمیزکاری داده‌ها برای کامپوننت فریمر**
        const processedItems = newsData.feed
            // فقط اخباری که عکس دارند را نگه دار
            .filter(item => item.banner_image)
            // ساختار داده را به فرمت مورد نیاز کامپوننت خودمان تغییر بده
            .map(item => ({
                title: item.title,
                link: item.url,
                contentSnippet: item.summary, // Alpha Vantage از summary استفاده می‌کند
                image: item.banner_image,   // و برای عکس از banner_image
                guid: item.url,
            }));

        // تنظیم هدرهای لازم
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate'); // کش برای ۱۰ دقیقه

        return response.status(200).json({ items: processedItems });

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to fetch news from Alpha Vantage' });
    }
}
