# Integração Blotato — Publicação via MCP + API

O Blotato substitui as chamadas diretas às APIs oficiais (Instagram Graph API, YouTube Data API) por uma API unificada. Com ele, você cadastra seus canais uma vez e o Claude publica direto após sua aprovação.

---

## Por que usar

| Antes (APIs diretas) | Depois (Blotato) |
|---|---|
| Token Instagram expira a cada 60 dias | Sem tokens — Blotato gerencia as sessões |
| YouTube precisa de OAuth + refresh token | Conecta a conta uma vez no Blotato |
| Threads sem API pública | Blotato publica no Threads |
| Conta Business obrigatória no Instagram | Não obrigatória |
| Código diferente por plataforma | Uma API unificada para todas |

---

## Setup — 3 passos

### 1. Criar conta e conectar canais

1. Criar conta em https://www.blotato.com
2. Em **Settings**, conectar as contas: Instagram, Threads, YouTube
3. Em **Settings > API**, gerar sua API key

> A API key ativa a assinatura paga ($29/mês Starter).

### 2. Configurar MCP no Claude Code

Rodar no terminal:

```bash
claude mcp add blotato \
  --url https://mcp.blotato.com/mcp \
  --header "blotato-api-key: SUA_API_KEY"
```

Verificar se está ativo:

```bash
claude mcp list
```

Após isso, o Claude Code terá acesso direto às ferramentas de publicação do Blotato.

### 3. Adicionar a key no .env (para uso via script)

```
BLOTATO_API_KEY=sua-key
```

---

## Fluxo de publicação no pipeline

```
Pipeline completo → Publish MD gerado
    ↓
Mídia já está no Supabase com URLs públicas
    ↓
Você revisa o Publish MD
    ↓
Você aprova: "Executar Publish dia_das_maes 2026-05-10.md"
    ↓
Claude chama a API do Blotato (via MCP ou HTTP direto):
    ├── Instagram: post com carousel de imagens
    ├── YouTube: upload de vídeo com título/descrição/tags
    └── Threads: post de texto
    ↓
Blotato processa e publica em cada plataforma
```

---

## API Reference

### Base

```
URL: https://backend.blotato.com/v2
Header: blotato-api-key: SUA_API_KEY
Rate limit: 30 requests/minuto
```

### Descobrir accountIds das contas conectadas

```bash
curl -H "blotato-api-key: SUA_KEY" \
  https://backend.blotato.com/v2/users/me/accounts
```

Retorna os `accountId` de cada conta conectada. Guardar esses IDs para usar nos posts.

### Publicar post

```
POST https://backend.blotato.com/v2/posts
Content-Type: application/json
blotato-api-key: SUA_KEY
```

#### Instagram — Carousel com imagens

```json
{
  "post": {
    "accountId": "12345",
    "content": {
      "text": "Café é pretexto. O abraço é o presente de verdade. ☕\n\nCold brew suave e premium.\n\n#DiadasMães #ColdBrewCoffeeCo #CaféComCarinho",
      "mediaUrls": [
        "https://xxx.supabase.co/storage/v1/object/public/campaign-uploads/carousel_01.png",
        "https://xxx.supabase.co/storage/v1/object/public/campaign-uploads/carousel_02.png",
        "https://xxx.supabase.co/storage/v1/object/public/campaign-uploads/carousel_03.png"
      ],
      "platform": "instagram"
    },
    "target": {
      "targetType": "instagram"
    }
  }
}
```

> Múltiplas imagens no `mediaUrls` = carousel automático no Instagram.

#### YouTube — Vídeo com metadata

```json
{
  "post": {
    "accountId": "67890",
    "content": {
      "text": "Descubra como transformar a manhã da sua mãe num momento inesquecível com cold brew premium.",
      "mediaUrls": [
        "https://xxx.supabase.co/storage/v1/object/public/campaign-uploads/ad_01.mp4"
      ],
      "platform": "youtube"
    },
    "target": {
      "targetType": "youtube",
      "title": "Cold Brew no Dia das Mães: O Presente Perfeito | Cold Brew Coffee Co.",
      "privacyStatus": "public",
      "shouldNotifySubscribers": true
    }
  }
}
```

#### Threads — Texto

```json
{
  "post": {
    "accountId": "11111",
    "content": {
      "text": "Ela sempre acordou primeiro. Desta vez, chegue na frente com um cold brew. ☕\n\nO presente que ela vai usar todo dia — e lembrar de você.",
      "mediaUrls": [],
      "platform": "threads"
    },
    "target": {
      "targetType": "threads"
    }
  }
}
```

#### Agendar post (opcional)

Adicionar na raiz do JSON (fora do `post`):

```json
{
  "post": { ... },
  "scheduledTime": "2026-05-07T07:30:00-03:00"
}
```

Ou usar o próximo slot livre do calendário:

```json
{
  "post": { ... },
  "useNextFreeSlot": true
}
```

> Sem campos de agendamento = publicação imediata.

### Resposta

```json
{
  "postSubmissionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
}
```

Usar o `postSubmissionId` para acompanhar o status via endpoint de status.

---

## Campos obrigatórios por plataforma

| Plataforma | target.targetType | Campos extras no target |
|---|---|---|
| Instagram | `instagram` | Opcional: `mediaType`, `altText`, `collaborators`, `coverImageUrl` |
| YouTube | `youtube` | Obrigatório: `title`, `privacyStatus`, `shouldNotifySubscribers` |
| Threads | `threads` | Nenhum |
| Twitter/X | `twitter` | Nenhum |
| TikTok | `tiktok` | Obrigatório: `privacyLevel` + 6 flags booleanas |
| Facebook | `facebook` | Obrigatório: `pageId` |
| LinkedIn | `linkedin` | Opcional: `pageId` (para company pages) |

---

## Como implementar no pipeline

### Opção 1: Via MCP (recomendado)

Com o MCP configurado, o Claude Code já tem acesso às ferramentas do Blotato. Na aprovação do Publish MD, o Claude usa as ferramentas MCP diretamente — sem precisar de script adicional.

### Opção 2: Via script Node.js

Criar um `pipeline/blotato-publish.js` que:

1. Lê o `media_urls.json` da campanha
2. Lê os textos de `copy/` (instagram_caption.txt, threads_post.txt, youtube_metadata.json)
3. Busca os `accountId` via `GET /v2/users/me/accounts`
4. Faz `POST /v2/posts` para cada plataforma

```javascript
const fs = require('fs');

// Ler .env
const env = fs.readFileSync('.env', 'utf-8');
const apiKey = env.match(/BLOTATO_API_KEY=(.*)/)[1].trim();

const BASE = 'https://backend.blotato.com/v2';
const headers = {
  'Content-Type': 'application/json',
  'blotato-api-key': apiKey
};

// Buscar contas conectadas
async function getAccounts() {
  const res = await fetch(`${BASE}/users/me/accounts`, { headers });
  return res.json();
}

// Publicar em uma plataforma
async function publish(accountId, text, mediaUrls, platform, targetExtra = {}) {
  const body = {
    post: {
      accountId,
      content: { text, mediaUrls, platform },
      target: { targetType: platform, ...targetExtra }
    }
  };

  const res = await fetch(`${BASE}/posts`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  return res.json();
}
```

---

## Custos

| Plano | Preço | Contas | Créditos AI |
|---|---|---|---|
| Starter | $29/mês | 20 | 1.250 |
| Creator | $97/mês | 20 | 5.000 |
| Agency | $499/mês | 20 | Ilimitados |

Sem contrato anual. Trial de 7 dias.

---

## Troubleshooting

| Problema | Solução |
|---|---|
| 401 Unauthorized | Verificar API key em Settings > API |
| Post falha | Ver posts com erro em https://my.blotato.com/failed |
| accountId inválido | Buscar IDs atualizados via `GET /v2/users/me/accounts` |
| Mídia não carrega | URLs devem ser públicas (Supabase bucket público) |
| Rate limit (429) | Máximo 30 req/min — espaçar os posts |
| MCP não aparece | Rodar `claude mcp list` e verificar se blotato está listado |

---

## Links

- Blotato: https://www.blotato.com
- API Quickstart: https://help.blotato.com/api/start
- API Reference: https://help.blotato.com/api/api-reference
- Claude Code MCP: https://help.blotato.com/api/claude-code
- API Keys: https://help.blotato.com/settings/api-keys
