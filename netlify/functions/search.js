// netlify/functions/search.js
import googleIt from 'google-it';

/**
 * Végrehajt egy HTML‑scraping alapú Google‑keresést.
 *
 * @param {string} query A keresési lekérdezés.
 * @returns {Promise<Array<{title:string, link:string, snippet:string}>>}
 */
export async function searchWeb(query) {
  console.log('[searchWeb] called with query:', query);
  try {
    // limit: 3 találat, de átírhatod többre is
    const rawResults = await googleIt({ query, limit: 3 });
    console.log('[searchWeb] rawResults:', rawResults);

    return rawResults.map(r => ({
      title:   r.title,
      link:    r.link,
      snippet: r.snippet
    }));
  } catch (err) {
    console.error('[searchWeb] error:', err);
    return [];
  }
}
