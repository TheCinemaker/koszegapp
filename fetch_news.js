const fs = require('fs');
const cheerio = require('cheerio');

// Node 18+ has native fetch, but if strictly needed we can use node-fetch
// We will try native fetch first.

const OUTPUT_FILE = 'src/data/news.json';
const NEWS_URL = 'https://koszeg.hu/hu/onkormanyzat/hirek';
const BASE_URL = 'https://koszeg.hu';

async function scrapeNews() {
    console.log(`Fetching news from ${NEWS_URL}...`);

    try {
        const response = await fetch(NEWS_URL);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const newsItems = [];

        // Selector based on inspection: .nlbox contains date and titlelink
        $('.nlbox').each((i, el) => {
            if (i >= 6) return; // Limit to top 6 items

            const dateText = $(el).find('.nlbdate').text().trim();
            const titleLink = $(el).find('.nlbtitle a');
            const title = titleLink.text().trim();
            let href = titleLink.attr('href');

            if (title && href) {
                href = href.trim();
                try {
                    // Resolve relative URLs correctly against the base
                    // The news list is at https://koszeg.hu/hu/onkormanyzat/hirek
                    // Links are often relative to that, or root.
                    // Using new URL() handles absolute paths, root-relative, and relative paths.
                    // If href is "content.php...", it is relative to "https://koszeg.hu/hu/onkormanyzat/hirek" (trailing slash matters?)
                    // The page is "https://koszeg.hu/hu/onkormanyzat/hirek". No trailing slash implies it is "https://koszeg.hu/hu/onkormanyzat/".
                    // But usually browsers treat "hirek" as the resource.
                    // Let's assume links are relative to "https://koszeg.hu/hu/onkormanyzat/".

                    const baseUrl = 'https://koszeg.hu/hu/onkormanyzat/';
                    href = new URL(href, baseUrl).toString();

                } catch (e) {
                    // Fallback to simpler concat if something weird happens, or keep original
                    console.warn('Failed to resolve URL:', href);
                }

                newsItems.push({
                    id: href, // use url as id
                    date: dateText,
                    title: title,
                    url: href
                });
            }
        });

        const data = {
            updatedAt: new Date().toISOString(),
            items: newsItems
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Successfully scraped ${newsItems.length} news items to ${OUTPUT_FILE}`);
        console.log(newsItems);

    } catch (error) {
        console.error('Error scraping news:', error);
    }
}

scrapeNews();
