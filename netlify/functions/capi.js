// Fonction serveur Netlify — Meta Conversions API
//
// Reçoit l'event "Lead" envoyé par le formulaire (index.html), hash les
// données personnelles côté serveur (jamais en clair vers Meta), puis
// relaie l'événement à l'API Graph de Meta avec le même event_id que le
// Pixel client pour permettre la déduplication automatique.
//
// Variables d'environnement à configurer dans Netlify (Site settings →
// Environment variables) — JAMAIS commitées dans le repo :
//   META_PIXEL_ID       -> l'ID du pixel (le même que dans index.html)
//   META_ACCESS_TOKEN    -> token d'accès système généré dans Events Manager
//                            (Paramètres des événements > API Conversions >
//                            Générer un token d'accès)

const crypto = require('crypto');

function sha256(value) {
  if (!value) return undefined;
  return crypto
    .createHash('sha256')
    .update(String(value).trim().toLowerCase())
    .digest('hex');
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const PIXEL_ID = process.env.META_PIXEL_ID;
  const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    // Config manquante : on répond 200 pour ne jamais bloquer l'UX du
    // formulaire, mais on logue l'erreur côté Netlify (Functions > Logs).
    console.error('META_PIXEL_ID ou META_ACCESS_TOKEN manquant dans les variables d\'environnement.');
    return { statusCode: 200, body: JSON.stringify({ skipped: true }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const {
    event_id,
    event_source_url,
    email,
    phone,
    value,
    currency,
  } = payload;

  const clientIp =
    event.headers['x-nf-client-connection-ip'] ||
    event.headers['x-forwarded-for'] ||
    undefined;

  const fbBody = {
    data: [
      {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        event_id: event_id,
        event_source_url: event_source_url,
        action_source: 'website',
        user_data: {
          em: email ? [sha256(email)] : undefined,
          ph: phone ? [sha256(phone.replace(/[^0-9]/g, ''))] : undefined,
          client_ip_address: clientIp,
          client_user_agent: event.headers['user-agent'],
        },
        custom_data: {
          value: value,
          currency: currency || 'EUR',
          content_name: 'Visite showroom — Atelier Cuisines Paris',
        },
      },
    ],
  };

  try {
    const resp = await fetch(
      `https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbBody),
      }
    );
    const result = await resp.json();
    if (!resp.ok) {
      console.error('Erreur Meta Conversions API:', result);
      return { statusCode: 200, body: JSON.stringify({ sent: false, error: result }) };
    }
    return { statusCode: 200, body: JSON.stringify({ sent: true, result }) };
  } catch (err) {
    console.error('Erreur appel Conversions API:', err);
    return { statusCode: 200, body: JSON.stringify({ sent: false }) };
  }
};
