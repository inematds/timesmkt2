# Pipeline & Aprovacoes — ITAGMKT v4.0.0

## Stages (orchestrator.js)

```
stage1: [research_agent, creative_director, copywriter_agent]
stage2: [ad_creative_designer]
stage3: [video_editor_agent]  // video_quick (default) ou video_pro
stage4: [platform_instagram, platform_youtube, platform_tiktok, platform_facebook, platform_threads, platform_linkedin]
stage5: [distribution_agent]
```

Stage 4 e dinamico — so rodam os agentes cujas plataformas estao em `platform_targets` do payload.

## Fluxo de Execucao

O **bot Telegram** (`bot.js`) e o controlador. Ele:

1. Recebe `/campanha <nome>`, monta o payload, salva sessao com `approvalModes`
2. Spawna o **worker** como subprocess e fica ouvindo o stdout
3. Enfileira **stage 1** via `enqueueStage()`
4. Escuta sinais do worker para avancar
5. Na aprovacao do stage 3, permite ao usuario mudar `platform_targets`

## Sinais do Worker -> Bot

| Sinal | Origem | Acao do Bot |
|---|---|---|
| `[STAGE1_DONE]` | copywriter termina (ultimo do stage 1) | Dispara aprovacao stage 1 |
| `[STAGE2_IMAGE_READY] <path>` | Ad Creative gera imagem | Envia foto ao chat em tempo real |
| `[IMAGE_APPROVAL_NEEDED] <dir>` | Worker pede aprovacao de imagens | **Auto-aprova** (gate interno) |
| `[VIDEO_APPROVAL_NEEDED] <dir>` | Worker pede aprovacao de video | **Auto-aprova** (gate interno) |
| `[IMAGE_GEN_ERROR] <dir> <msg>` | Falha na geracao de imagem | Pergunta: avancar, tentar novamente, cancelar |
| `Job completed: <agent>` | Qualquer agente termina | Verifica se todos do stage completaram -> aprovacao |
| `Job failed: <agent>` | Agente falha | Notifica erro no chat |

## Aprovacoes por Stage

| Stage | O que mostra | Pergunta |
|---|---|---|
| 1 | `creative_brief.md` + `narrative.md` | "Aprovar brief e narrativa?" |
| 2 | Imagens geradas (PNGs de ads/ e imgs/) | "Aprovar e avancar para video?" |
| 3 | Roteiro de video + selecao de plataformas | "Aprovar video? Para quais plataformas?" |
| 4 | Resumo de copy por plataforma (.md) + warnings de rework | "Aprovar copy e distribuir?" |
| 5 | Publish MD pronto | "Confirmar distribuicao?" |

## Modos de Aprovacao

| Modo | Comportamento |
|---|---|
| **humano** (padrao) | Envia resultado ao chat + pergunta "sim/nao/ajustes" |
| **auto** | Avanca imediatamente para proximo stage |
| **agente** | Roda `runAgentReview()` -> Claude avalia -> [AGENTE_APROVADO] ou [AGENTE_AJUSTE] |

Se o modo `agente` falha, **cai para humano** como fallback.

## Selecao de Plataformas (Stage 3 -> 4)

Na aprovacao do Stage 3, o bot mostra:
```
Plataformas selecionadas:
  ✅ instagram — Instagram (carousel + stories + reels)
  ✅ youtube — YouTube (video + shorts)
  ✅ tiktok — TikTok (video curto)
  ✅ facebook — Facebook (feed + stories + reels + video)
  ✅ threads — Threads (texto + imagem)
  ✅ linkedin — LinkedIn (post profissional)
```

O usuario pode:
- **sim** — avancar com as plataformas atuais
- **instagram,youtube,tiktok** — mudar a selecao
- **nao** — cancelar

## Gates Internos vs Gates de Stage

- **Gate interno** (arquivo `approved.json`): worker pausa, bot escreve automaticamente para desbloquear
- **Gate de stage**: aprovacao real apos todos os agentes do stage completarem

## Retrabalho (rework)

Agentes de plataforma (stage 4) podem sinalizar:
- `rework_needed`: descricao do problema
- `video_format_request`: pedido de formato especifico

O Distribution Agent loga warnings no Publish MD.

## Timeout e Cleanup

- Pipeline inteiro: **90 min** timeout, mata o worker
- Cada gate interno: **30 min** timeout
- Ao completar stage 5: worker terminado, sessao limpa, relatorio enviado
