# Cambio USDT — Calculadora de Lucro

Calculadora web para operadores P2P de USDT calcularem lucro diario em operacoes de compra e venda.

## Arquitetura

```
GitHub Pages (index.html)  -->  Cloudflare Worker (worker.js)  -->  OpenAI API (gpt-4o)
      frontend estático              proxy seguro                   extração de PDF
```

- **Frontend** (`index.html`): SPA estatica em HTML/CSS/JS vanilla, sem dependencias ou build. Hospedada no GitHub Pages. Suporta tema claro/escuro automaticamente.
- **Backend** (`worker.js`): Cloudflare Worker que faz proxy para a OpenAI API. Guarda a `OPENAI_API_KEY` como variavel de ambiente criptografada. Restringe CORS ao dominio do GitHub Pages.

## Funcionalidades

- **Importacao de PDF**: upload de PDFs de compras (entradas) e vendas (saidas). Suporta dois formatos:
  - Relatorio de ordens (ORDENS SELL/BUY) com colunas Cotacao, USDT, Total BRL
  - Extratos cripto com cotacao embutida no campo Caixa/Notas (ex: `G6@5,019`)
- **Entrada manual**: tabelas editaveis para adicionar/remover operacoes de compra e venda com quantidade, preco unitario e taxa
- **Saldo inicial**: campo para informar USDT em carteira no inicio do dia
- **Calculos automaticos**:
  - USDT total comprado/vendido (ate 8 casas decimais)
  - Total investido e recebido em BRL
  - Preco medio de compra (custo medio ponderado)
  - Preco medio de venda
  - Spread medio
  - Lucro liquido e margem
  - Saldo final de USDT (verde se positivo, cinza se zero, vermelho se negativo)
  - Detalhamento por venda com lucro e margem individuais
- **Exportar PDF**: botao que abre o dialogo de impressao do navegador para salvar Resumo do dia, Saldo final e Detalhamento como PDF

## Configuracao

### 1. OpenAI API

1. Crie uma API key em https://platform.openai.com/api-keys
2. Adicione creditos em https://platform.openai.com/settings/organization/billing

### 2. Cloudflare Worker

1. Acesse https://dash.cloudflare.com e va em Workers & Pages
2. Crie um Worker ou edite o existente (`calculator`)
3. Cole o conteudo de `worker.js` no editor e clique em **Deploy**
4. Em Settings > Variables and Secrets, adicione:
   - Nome: `OPENAI_API_KEY` | Valor: sua key `sk-...` | marque **Encrypt**
5. (Opcional) Altere `ALLOWED_ORIGIN` no codigo se seu dominio GitHub Pages for diferente de `https://jaimelukaz.github.io`

### 3. GitHub Pages

1. Suba o `index.html` para o repositorio
2. Ative GitHub Pages em Settings > Pages (branch `main`)
3. Verifique que `WORKER_URL` em `index.html` aponta para a URL do seu Worker (ex: `https://calculator.dn4code.workers.dev`)

## Estrutura de arquivos

```
index.html   — frontend completo (HTML + CSS + JS)
worker.js    — Cloudflare Worker (proxy para OpenAI API)
README.md    — esta documentacao
```

## Custos

O Worker usa o modelo `gpt-4o` da OpenAI para extrair operacoes dos PDFs. Custo estimado por upload:

- PDF pequeno (~25 operacoes): ~$0.02-0.05
- PDF grande (~50+ operacoes): ~$0.05-0.10

Nao ha custo para uso manual (sem upload de PDF).
