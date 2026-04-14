/**
 * Cloudflare Worker — Proxy seguro para Anthropic API
 *
 * COMO CONFIGURAR:
 * 1. Acesse https://dash.cloudflare.com e crie uma conta grátis
 * 2. Vá em Workers & Pages → Create → Create Worker
 * 3. Cole este código no editor e clique em Deploy
 * 4. Vá em Settings → Variables → Add variable
 *    Nome: ANTHROPIC_API_KEY  |  Valor: sk-ant-...  |  marque "Encrypt"
 * 5. Copie a URL do worker (ex: https://cambio-usdt.seuusuario.workers.dev)
 * 6. Cole essa URL no index.html na variável WORKER_URL
 *
 * CORS: o worker só aceita requisições do seu domínio GitHub Pages.
 * Altere ALLOWED_ORIGIN abaixo para o seu endereço real.
 */

const ALLOWED_ORIGIN = 'https://jaimelukaz.github.io';

export default {
  async fetch(request, env) {

    // Responde preflight CORS
    if (request.method === 'OPTIONS') {
      return corsResponse(null, 204, env);
    }

    if (request.method !== 'POST') {
      return corsResponse(JSON.stringify({ error: 'Method not allowed' }), 405, env);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return corsResponse(JSON.stringify({ error: 'Body inválido' }), 400, env);
    }

    const { pdf, prompt } = body;

    if (!pdf || !prompt) {
      return corsResponse(JSON.stringify({ error: 'Campos pdf e prompt são obrigatórios' }), 400, env);
    }

    // Chama a API da Anthropic — a chave fica segura aqui no servidor
    const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: pdf }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    });

    const data = await anthropicResp.json();

    if (!anthropicResp.ok) {
      return corsResponse(
        JSON.stringify({ error: data.error?.message || 'Erro na API Anthropic' }),
        anthropicResp.status,
        env
      );
    }

    // Repassa só o texto da resposta — não expõe metadados internos
    const text = data.content.map(c => c.text || '').join('');
    return corsResponse(JSON.stringify({ result: text }), 200, env);
  }
};

function corsResponse(body, status, env) {
  const headers = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
  return new Response(body, { status, headers });
}
