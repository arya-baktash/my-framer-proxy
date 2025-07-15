// فایل: /api/feed.js

// ما به یک کتابخانه برای خواندن RSS نیاز داریم. Vercel آن را خودکار نصب می‌کند.
const Parser = require('rss-parser');
const parser = new Parser();

export default async function handler(request, response) {
    // آدرس RSS را از URL می‌خوانیم (مثال: .../api/feed?rssUrl=...)
    const { rssUrl } = request.query;

    if (!rssUrl) {
        return response.status(400).json({ error: 'rssUrl is required' });
    }

    try {
        const feed = await parser.parseURL(rssUrl);

        // این هدرها برای جلوگیری از خطای CORS در فریمر ضروری هستند
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET');
        
        // **مهم‌ترین بخش: تنظیم کش به مدت ۱۰ دقیقه (۶۰۰ ثانیه)**
        // این کار باعث پایداری و سرعت فوق‌العاده می‌شود
        response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');

        return response.status(200).json(feed);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Failed to fetch RSS feed' });
    }
}
