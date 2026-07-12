// Worker ini punya 2 tugas:
// 1. Kalau request ke /api -> teruskan ke Apps Script dari sisi server (tidak kena CORS).
// 2. Selain itu -> serve file statis seperti biasa (index.html, dst).

// GANTI dengan URL /exec Apps Script Anda (yang sama seperti di index.html sebelumnya)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzPdKVqnAlQNlo_-bRQzITg1J4XwszzJlJB877r0KrynxLaaj5-5uQ-rBYOzTE39RuTiw/exec';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api') {
      // Tangani preflight OPTIONS (jaga-jaga, meski request kita didesain menghindarinya)
      if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders() });
      }

      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ ok: false, message: 'Method tidak didukung' }), {
          status: 405,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }

      try {
        const bodyText = await request.text();

        const upstream = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: bodyText,
          redirect: 'follow'
        });

        const resultText = await upstream.text();

        return new Response(resultText, {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      } catch (err) {
        return new Response(JSON.stringify({ ok: false, message: 'Proxy error: ' + err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders() }
        });
      }
    }

    // Bukan /api -> serve file statis seperti biasa (index.html, dll)
    return env.ASSETS.fetch(request);
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}
