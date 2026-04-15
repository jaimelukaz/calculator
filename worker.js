/**
 * Cloudflare Worker — Proxy seguro para OpenAI API
 *
 * COMO CONFIGURAR:
 * 1. Acesse https://dash.cloudflare.com e abra seu Worker existente
 * 2. Cole este código no editor e clique em Deploy
 * 3. Em Settings → Variables, remova ANTHROPIC_API_KEY (opcional) e adicione:
 *    Nome: OPENAI_API_KEY  |  Valor: sk-...  |  marque "Encrypt"
 *
 * CORS: o worker só aceita requisições do domínio abaixo.
 */

const ALLOWED_ORIGIN = 'https://jaimelukaz.github.io';

export default {
  async fetch(request, env) {

    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Body inválido' }), 400);
    }

    const { pdf, prompt } = body;

    if (!pdf || !prompt) {
      return corsResponse(JSON.stringify({ error: 'Campos pdf e prompt são obrigatórios' }), 400);
    }

    const openaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 8000,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: 'document.pdf',
                file_data: 'data:application/pdf;base64,' + pdf
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await openaiResp.json();

    if (!openaiResp.ok) {
      return corsResponse(
        JSON.stringify({ error: data.error?.message || 'Erro na API OpenAI' }),
        openaiResp.status
      );
    }

    const text = data.choices?.[0]?.message?.content || '';
    return corsResponse(JSON.stringify({ result: text }), 200);
  }
};

function corsResponse(body, status) {
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  return new Response(body, { status, headers });
}
