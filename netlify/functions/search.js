// netlify/functions/search.js
import { request } from 'undici';
import { load } from 'cheerio';     // ← named import

/**
 * Lekéri a Google keresőoldal HTML-jét, és Cheerio-val kinyeri az első 3 találatot.
 * @param {string} query A keresési lekérdezés.
 * @returns {Promise<Array<{title:string, link:string, snippet:string}>>}
 */
export async function searchWeb(query) {
  console.log('[searchWeb] fetching Google for:', query);
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=hu&gl=hu`;

  try {
    const { body } = await request(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
      }
    });
    const html = await body.text();
    const $ = load(html);    // ← use load()

    const results = [];
    $('div.g').each((_, el) => {
      if (results.length >= 3) return false;
      const title   = $(el).find('h3').text().trim();
      const link    = $(el).find('a').attr('href');
      const snippet = $(el).find('.VwiC3b').text().trim();

      if (title && link) {
        results.push({ title, link, snippet });
      }
    });

    console.log('[searchWeb] scraped results:', results);
    return results;
  } catch (err) {
    console.error('[searchWeb] error:', err);
    return [];
  }
}
