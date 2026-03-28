# Plano: Video Editor Agent ("Diretor de Edição")

## Contexto

O pipeline atual gera vídeos com 5 cenas de ~12s cada — basicamente um slideshow. Um editor profissional criaria 30-50+ cortes rápidos em 60s com ritmo variado, transições diversas e pacing sincronizado com narração/música.

O desafio é criar um **agente automatizado que pensa como editor de vídeo profissional**, recebendo briefings de outros agentes e gerando um plano de edição com qualidade de clipe.

---

## Decisão Arquitetural

**SUBSTITUIR** `video_ad_specialist` + absorver `motion_director` em um único novo agente: `video_editor_agent`.

Razão: o agente atual foi projetado para 5 cenas. Reescrever 90% é mais limpo que patchar. O novo agente ocupa o mesmo slot (stage3), mesma skip flag (`skip_video`), mesmos dependencies.

---

## Fases do Agente

### Fase A: Análise e Roteiro
- Lê: `brand_identity.md`, `product_campaign.md`, `research_results.json`, `creative_brief.json`
- Analisa assets disponíveis (imagens da marca com dimensões)
- Seleciona framework narrativo (AIDA/PAS/Hero's Journey/Before-After/Edu-Tainment)
- Escreve narration_script completo (50-60s de fala natural)
- Define mood geral (energetic/emotional/premium/festive/inspiring)
- **Pode solicitar complementos** ao agente upstream se faltar assets

### Fase B: Edit Decision List (EDL) — 30-50 cortes
- Quebra narração em 30-50+ segmentos mapeados a "cortes"
- Cada corte: duration (0.5-5s), scene_type, visual_concept, energy_level (1-5)
- Regras profissionais:
  - Nunca mesmo motion 2x seguidas
  - Nunca mesmo text_position 3x seguidas
  - Padrões rítmicos: short-short-long, short-long-short
  - Curva de energia: alto no hook → dip no problema → build na solução → peak na prova → hold no CTA
  - Hook: cortes 0.5-1.5s (rápidos) | Meio: 1-3s (variado) | CTA: 3-5s (hold)

### Fase C: Atribuição de Assets
- Mapeia cada corte a uma imagem (path ou image_prompt para API)
- Reutiliza imagens criativamente: mesma imagem + crop/motion diferentes = visualmente distinto
- Máximo 5 usos por imagem (com 11 imagens e 35 cortes = ~3.2 usos/imagem)
- Text overlays: max 6 palavras, complementam narração, nunca repetem

### Fase D: Motion e Pós-Produção (absorve motion_director)
- Atribui camera effects por corte (ffmpeg: 4 tipos / Remotion: 12 tipos)
- Atribui text animations por corte (Remotion: 11 tipos)
- Define transições: cut, crossfade, fade_black
- Define intensidade de motion: aggressive/moderate/subtle/static
- Saída final: `video_0N_scene_plan_motion.json` (formato enriquecido direto)

---

## Arquivos a Criar/Modificar

### 1. CRIAR: `skills/video-editor-agent/SKILL.md`
Spec completa do agente com as 4 fases, regras de edição profissional, tabelas de pacing, exemplos de EDL, schema JSON, checklist de qualidade.

### 2. CRIAR: Handler `handleVideoEditorAgent()` em `pipeline/worker.js`
- Prompt com instruções detalhadas + budget de cortes obrigatório
- Fase 1.5 de geração de imagens (reutiliza lógica existente)
- Validação pós-Claude: verifica `scenes.length >= 25`, corrige motions consecutivas
- Sem sub-fase de motion_director (já incluído na saída)
- Mesmo mecanismo de approval (approval_needed.json / approved.json)

### 3. MODIFICAR: `pipeline/orchestrator.js`
- AGENTS: trocar `video_ad_specialist` → `video_editor_agent`
- STAGES.stage3: trocar `['video_ad_specialist']` → `['video_editor_agent']`

### 4. MODIFICAR: `telegram/bot.js`
- Mensagem de aprovação resumida (por seções, não por corte individual):
  ```
  Video 01: "Título" | 35 cortes | 60s | Energético
  HOOK (0-8s): 7 cortes
  PROBLEMA (8-20s): 6 cortes
  SOLUÇÃO (20-38s): 10 cortes
  CTA (52-60s): 5 cortes
  ```

### 5. OPCIONAL: Melhorar `pipeline/render-video-ffmpeg.js`
- Adicionar suporte a `xfade` transitions entre segmentos (crossfade, fade_black)
- Atualmente só faz hard concat — cortes rápidos ficam OK, mas crossfade melhoria visual

---

## Schema JSON de Saída (30-50 cenas)

```json
{
  "titulo": "Campaign Title",
  "video_length": 60,
  "format": "1080x1920",
  "pacing": "energetic",
  "narrative_framework": "heros_journey_60s",
  "audio": "<output_dir>/audio/video_01_narration.mp3",
  "music": null,
  "music_volume": 0.15,
  "narration_script": "Full narration...",
  "voice": "rachel",
  "bpm": 120,
  "total_cuts": 35,
  "scenes": [
    {
      "id": "hook_01",
      "cut_number": 1,
      "duration": 1.0,
      "type": "hook",
      "energy_level": 5,
      "image": "prj/inema/assets/neimaldaner.jpg",
      "image_type": "raw",
      "image_crop_focus": "center-top",
      "image_prompt": null,
      "text_overlay": "O futuro é agora",
      "narration": "Quantas vagas você já perdeu",
      "motion": {
        "type": "zoom_in",
        "intensity": "aggressive",
        "zoom_start": 1.0,
        "zoom_end": 1.20
      },
      "text_layout": {
        "position": "top",
        "safe_margin": 120,
        "font_size": 96,
        "background": "none",
        "background_opacity": 0.0
      },
      "transition_out": "cut",
      "transition_duration": 0.0,
      "camera_effect": "push-in",
      "text_animation": "punch-in",
      "overlay": "dark",
      "overlay_opacity": 0.45
    }
  ]
}
```

---

## Exemplo Prático: Vídeo INEMA 60s

Para demonstrar o conceito, vou gerar um vídeo de teste com:
- 35 cortes usando as 11 imagens INEMA disponíveis
- Narração ElevenLabs (voz Rachel)
- Ritmo energético (cortes 0.5-3s)
- Framework: Hero's Journey
- Renderizado via ffmpeg (compatível imediato)

Saída em: `prj/inema/testes/video_editor_demo/`

---

## Validações Pós-Claude

O handler valida automaticamente:
1. `scenes.length >= 25` — rejeita se menos de 25 cortes
2. Sem motion consecutiva repetida — auto-fix ciclando tipos
3. Sem text_position 3x repetida — auto-fix alternando
4. Soma de durações ≈ video_length (tolerância ±5s)
5. Todos os `image` paths existem (ou têm `image_prompt`)

---

## Verificação End-to-End

1. Criar SKILL.md e handler
2. Gerar narração via ElevenLabs para script de teste
3. Executar agente via `runClaude()` com payload INEMA
4. Validar JSON de saída (35+ cortes, regras respeitadas)
5. Renderizar via `render-video-ffmpeg.js`
6. Verificar vídeo: 60s, cortes visualmente distintos, texto legível
7. Enviar para Telegram para aprovação visual

---

## Arquivos Críticos

| Arquivo | Ação |
|---------|------|
| `skills/video-editor-agent/SKILL.md` | CRIAR — spec completa |
| `pipeline/worker.js` | MODIFICAR — novo handler, manter antigo como fallback |
| `pipeline/orchestrator.js` | MODIFICAR — trocar agent name e stage |
| `telegram/bot.js` | MODIFICAR — mensagem de aprovação resumida |
| `pipeline/render-video-ffmpeg.js` | OPCIONAL — xfade transitions |
| `prj/inema/testes/video_editor_demo/` | CRIAR — vídeo de demonstração |
