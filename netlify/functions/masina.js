// Netlify Function: generates a page with correct Open Graph meta tags
// for a specific car, so Facebook/Meta/Instagram crawlers show the right
// title, description and image when the link is shared or used in ads.
// Real human visitors are instantly redirected to the normal site.

const SUPA_URL = "https://gpcnnrzimzomrixzrnqy.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwY25ucnppbXpvbXJpeHpybnF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTE2NjUsImV4cCI6MjA5NzI2NzY2NX0.2aLmKZkiW-iF52zHFMyj5aEfKZO9rwKRQmwInbhv_4A";
const SITE_URL = "https://tafauto.ro";

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.handler = async function (event) {
  let id = event.queryStringParameters && event.queryStringParameters.id;
  if (!id && event.path) {
    const parts = event.path.split("/").filter(Boolean);
    id = parts[parts.length - 1];
    if (id === "masina") id = null;
  }
  const target = SITE_URL + (id ? "/?masina=" + encodeURIComponent(id) : "/");

  if (!id) {
    return {
      statusCode: 302,
      headers: { Location: target },
      body: "",
    };
  }

  let car = null;
  try {
    const res = await fetch(
      SUPA_URL + "/rest/v1/masini?select=*&id=eq." + encodeURIComponent(id),
      {
        headers: {
          apikey: SUPA_KEY,
          Authorization: "Bearer " + SUPA_KEY,
        },
      }
    );
    const data = await res.json();
    car = Array.isArray(data) && data.length ? data[0] : null;
  } catch (e) {
    car = null;
  }

  const title = car
    ? escapeHtml((car.make || "") + " " + (car.model || "") + " " + (car.year || "") + " — TAF AUTO")
    : "TAF AUTO — Mașina ta te așteaptă";

  const description = car
    ? escapeHtml(
        (car.km ? car.km + " · " : "") +
          (car.engine ? car.engine + " · " : "") +
          (car.power ? car.power + " · " : "") +
          (car.price ? "Preț: " + car.price : "") +
          " · Garanție 12 luni fără limită de km."
      )
    : "Vehicule selectate cu garanție 12 luni și rate fără avans.";

  const image = car && car.img1 ? car.img1 : SITE_URL + "/og-default.jpg";

  const html = `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8"/>
<meta property="og:type" content="product"/>
<meta property="og:title" content="${title}"/>
<meta property="og:description" content="${description}"/>
<meta property="og:image" content="${escapeHtml(image)}"/>
<meta property="og:url" content="${escapeHtml(target)}"/>
<meta property="og:site_name" content="TAF AUTO"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${title}"/>
<meta name="twitter:description" content="${description}"/>
<meta name="twitter:image" content="${escapeHtml(image)}"/>
<meta http-equiv="refresh" content="0; url=${escapeHtml(target)}"/>
<title>${title}</title>
</head>
<body>
<p>Redirecting to <a href="${escapeHtml(target)}">${title}</a>...</p>
<script>window.location.replace(${JSON.stringify(target)});</script>
</body>
</html>`;

  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
