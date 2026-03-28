# Ferramentas de Publicação — Alternativas às APIs Diretas

O pipeline atual usa chamadas diretas às APIs oficiais (Instagram Graph API, YouTube Data API) para publicação. Estas são alternativas SaaS que simplificam o processo, eliminando a necessidade de gerenciar tokens OAuth e credenciais de API por plataforma.

---

## Comparação Geral

| Ferramenta | Grátis | Plano inicial | Instagram | Threads | YouTube | API própria |
|---|---|---|---|---|---|---|
| **Blotato** | 7 dias trial | $29/mês | Sim | Sim | ? | Sim (local) |
| **Buffer** | 3 canais, 10 posts | $5/mês por canal | Sim | Sim | Sim | Sim |
| **Publer** | 3 contas, 10 posts | $12/mês (3 contas) | Sim | Sim | Sim | Sim |
| **Ayrshare** | Não | $299/mês (10 perfis) | Sim | Sim | Sim | Sim (API-first) |
| **Typefully** | 1 post agendado | $19/mês (Creator) | Não | Não | Não | Não |

---

## Detalhes por Ferramenta

### Blotato

- **Preço:** $29/mês (Starter) · $97/mês (Creator) · $499/mês (Agency)
- **Plataformas:** Instagram, Threads, X, LinkedIn e mais
- **Como funciona:** App para Mac que expõe uma API local (localhost). Usa a sessão do navegador para postar — não precisa de tokens de API oficiais
- **Vantagem:** Sem tokens OAuth, sem conta Business obrigatória
- **Limitação:** Depende de um Mac rodando o app
- **Site:** https://www.blotato.com/pricing

### Buffer

- **Preço:** Grátis (3 canais, 10 posts) · $5/mês por canal (Essentials) · $10/mês por canal (Team)
- **Plataformas:** Instagram, Threads, YouTube, X, LinkedIn, Facebook, Pinterest, TikTok
- **Para 3 canais (Instagram + Threads + YouTube):** ~$15/mês
- **Desconto:** 20% no plano anual · 50% para ONGs
- **API:** REST API disponível nos planos pagos
- **Site:** https://buffer.com/pricing

### Publer

- **Preço:** Grátis (3 contas, 10 posts) · $12/mês Professional (3 contas, posts ilimitados) · $21/mês Business
- **Plataformas:** Instagram, Threads, YouTube, X, LinkedIn, Facebook, Pinterest, TikTok, Google Business
- **Vantagem:** Melhor custo-benefício — posts ilimitados por $12/mês
- **Modelo:** Por canal + por usuário (cada conta extra aumenta o preço)
- **Site:** https://publer.com/plans

### Ayrshare

- **Preço:** $299/mês (Launch, 10 perfis) · $599/mês (Business, 30 perfis)
- **Plataformas:** Instagram, Threads, YouTube, X, LinkedIn, Facebook, TikTok, Reddit, Telegram, Pinterest, Snapchat, Bluesky
- **Foco:** API-first — feito para integração programática
- **Vantagem:** Cobertura máxima de plataformas, API robusta
- **Limitação:** Caro — só vale para agências com muitos perfis
- **Site:** https://www.ayrshare.com/pricing/

### Typefully

- **Preço:** Grátis (1 post agendado) · $19/mês (Creator) · $39/mês (Team)
- **Plataformas:** X, LinkedIn, Bluesky, Mastodon
- **Limitação:** Não suporta Instagram, YouTube nem Threads — **não serve para este projeto**
- **Site:** https://typefully.com/pricing

---

## Recomendação para o Pipeline

Para substituir as chamadas diretas de API no Agente de Distribuição:

| Cenário | Recomendação | Custo |
|---|---|---|
| Menor custo | **Publer** ($12/mês, 3 contas, posts ilimitados) | $12/mês |
| Melhor equilíbrio | **Buffer** ($5/canal, API sólida, boa documentação) | ~$15/mês |
| Sem tokens/OAuth | **Blotato** (API local, usa sessão do navegador) | $29/mês |
| Agência / muitos perfis | **Ayrshare** (API-first, 13+ plataformas) | $299/mês |

### Integração no pipeline

A troca seria no **Step 6 do Distribution Agent** — em vez de chamar diretamente a Instagram Graph API e YouTube Data API, o agente faria chamadas HTTP à API do Buffer/Publer/Blotato.

Isso eliminaria:
- Token do Instagram Graph API (expira a cada 60 dias)
- OAuth do YouTube (refresh token)
- Necessidade de conta Business no Instagram (para Buffer/Publer)
