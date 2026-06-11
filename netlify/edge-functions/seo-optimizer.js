export default async (request, context) => {
  const url = new URL(request.url);

  // Only run for document requests
  if (url.pathname.includes('.') && !url.pathname.endsWith('.html')) {
    return;
  }

  const response = await context.next();

  // Detect bots and crawlers (Google, Facebook, Twitter, Slack, etc.)
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = /bot|crawler|spider|facebook|twitter|linkedin|slack|discord|google/i.test(userAgent);

  // For humans, only execute for specific dynamic pages to improve perceived performance, otherwise let client-side handle it.
  const isDynamicRoute = url.pathname.startsWith('/menu/') || url.pathname.startsWith('/events/');
  if (!isBot && !isDynamicRoute) {
    return response;
  }

  let title = "visitKőszeg – Élmények. Élőben.";
  let description = "Kőszeg hivatalos digitális útitársa - látnivalók, programok, éttermek és események egy helyen.";
  let image = "https://visitkoszeg.hu/og-image.jpg";

  // Fetch Supabase configuration from Env
  const supabaseUrl = Deno.env.get("VITE_SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("VITE_SUPABASE_ANON_KEY");

  // Dynamic route rendering logic
  if (url.pathname.startsWith('/menu/') && supabaseUrl && supabaseAnonKey) {
    const parts = url.pathname.split('/');
    const restaurantId = parts[2]; // e.g., "pizzeria-palace"
    if (restaurantId) {
      try {
        const res = await fetch(`${supabaseUrl}/rest/v1/restaurants?id=eq.${restaurantId}&select=name,description,logo_url`, {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            title = `${data[0].name} | Digitális Pincér - visitKőszeg`;
            description = data[0].description || `Rendelj közvetlenül az asztalodtól a(z) ${data[0].name} kínálatából!`;
            if (data[0].logo_url) image = data[0].logo_url;
          }
        }
      } catch (err) {
        console.error("Error fetching restaurant edge data:", err);
      }
    }
  } else if (url.pathname.startsWith('/events/') && supabaseUrl && supabaseAnonKey) {
    const parts = url.pathname.split('/');
    const eventId = parts[2];
    if (eventId) {
      try {
        // Query ticket_events table
        const res = await fetch(`${supabaseUrl}/rest/v1/ticket_events?id=eq.${eventId}&select=name,description,image_url`, {
          headers: {
            "apikey": supabaseAnonKey,
            "Authorization": `Bearer ${supabaseAnonKey}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data[0]) {
            title = `${data[0].name} | Események - visitKőszeg`;
            description = data[0].description || `Nézd meg a(z) ${data[0].name} részleteit a visitKőszeg oldalon!`;
            if (data[0].image_url) image = data[0].image_url;
          }
        }
      } catch (err) {
        console.error("Error fetching event edge data:", err);
      }
    }
  } else if (url.pathname === '/eats') {
    title = "visitKőszeg Eats - Ételrendelés";
    description = "Rendelj heti menüt és állandó ételeket Kőszeg legjobb éttermeiből házhozszállítással!";
  }

  // Rewrite standard HTML response
  return new HTMLRewriter()
    .on("title", {
      element(el) {
        el.replace(`<title>${title}</title>`);
      }
    })
    .on("head", {
      element(el) {
        el.append(`<meta name="description" content="${description}" />`, { html: true });
        el.append(`<meta property="og:title" content="${title}" />`, { html: true });
        el.append(`<meta property="og:description" content="${description}" />`, { html: true });
        el.append(`<meta property="og:image" content="${image}" />`, { html: true });
        el.append(`<meta property="og:url" content="${request.url}" />`, { html: true });
        el.append(`<meta property="og:type" content="website" />`, { html: true });
        el.append(`<meta name="twitter:card" content="summary_large_image" />`, { html: true });
        el.append(`<meta name="twitter:title" content="${title}" />`, { html: true });
        el.append(`<meta name="twitter:description" content="${description}" />`, { html: true });
        el.append(`<meta name="twitter:image" content="${image}" />`, { html: true });
      }
    })
    .transform(response);
};
