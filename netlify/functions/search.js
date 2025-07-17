import googleIt from 'google-it';

export async function searchWeb(query) {
  try {
    // limit: 3 találat, de tetszőlegesen módosíthatod
    const results = await googleIt({ query, limit: 3 });
    return results.map(r => ({
      title:   r.title,
      link:    r.link,
      snippet: r.snippet
    }));
  } catch (err) {
    console.error('searchWeb error:', err);
    return [];
  }
}
