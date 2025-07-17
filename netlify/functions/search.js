// netlify/functions/search.js
exports.handler = async function(event, context) {
  // Naplózzuk a bejövő kérést
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Ellenőrizzük, hogy van-e body
    if (!event.body) {
      console.error('Missing request body');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing request body', results: [] })
      };
    }

    // Parse-oljuk a JSON body-t
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON format', results: [] })
      };
    }

    // Ellenőrizzük a query paramétert
    const query = body.query;
    if (!query || typeof query !== 'string') {
      console.error('Missing or invalid query parameter');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing or invalid query parameter', results: [] })
      };
    }

    // Ellenőrizzük a környezeti változókat
    const apiKey = process.env.GOOGLE_API_KEY;
    const cx = process.env.GOOGLE_CX;
    
    if (!apiKey || !cx) {
      console.error('Missing Google API configuration');
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Server misconfiguration - missing API keys', 
          results: [] 
        })
      };
    }

    // Elkészítjük a Google keresési URL-t
    const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
    searchUrl.searchParams.append('key', apiKey);
    searchUrl.searchParams.append('cx', cx);
    searchUrl.searchParams.append('q', query);
    
    console.log('Making request to:', searchUrl.toString());

    // Elküldjük a kérést a Google API-nak
    const response = await fetch(searchUrl.toString());
    const responseData = await response.json();

    if (!response.ok) {
      console.error('Google API error:', responseData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ 
          error: responseData.error?.message || 'Google API error',
          results: [] 
        })
      };
    }

    // Feldolgozzuk a választ
    const results = (responseData.items || []).map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link
    }));

    console.log(`Returning ${results.length} results`);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ results })
    };
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Internal server error: ' + err.message, 
        results: [] 
      })
    };
  }
};
