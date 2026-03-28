# Video Quick — Slideshow Rapido

Cria videos curtos (10-20s) usando as imagens ja produzidas pelo Ad Creative Designer. Nao gera imagens novas — usa o que ja existe em `ads/`.

## Quando Usar

- Default no Stage 3 (roda automaticamente a menos que `skip_video`)
- Videos para Reels, Stories, Shorts, TikTok
- Quando velocidade importa mais que producao profissional

## Inputs

| Fonte | O que usar |
|---|---|
| `<output_dir>/ads/*.png` | Imagens do Designer — fonte principal |
| `<output_dir>/copy/narrative.json` | Headlines, key_phrases, emotional_arc |
| `<output_dir>/creative/creative_brief.json` | Angulo, direcao visual, CTAs aprovados |
| `<project_dir>/knowledge/brand_identity.md` | Cores, tom |

## Processo

1. Listar imagens disponíveis em `ads/`
2. Ler narrative.json para headlines e key_phrases
3. Montar scene plan com 4-6 cenas (1 imagem por cena)
4. Narração (opcional): se ElevenLabs configurado, gerar audio
5. Musica (opcional): se disponivel em assets/music/
6. Salvar scene plan JSON

## Scene Plan

```json
{
  "titulo": "titulo curto",
  "video_length": 15,
  "format": "9:16",
  "width": 1080,
  "height": 1920,
  "narration_file": "path ou null",
  "narration_volume": 1,
  "music": "path ou null",
  "music_volume": 0.15,
  "scenes": [
    {
      "id": "hook",
      "type": "hook",
      "duration": 3,
      "image": "/absolute/path/to/carousel_01.png",
      "image_type": "raw",
      "text_overlay": "texto do narrative.json",
      "text_color": "#FFFFFF",
      "text_position": "center",
      "motion": { "type": "push-in", "intensity": "moderate" }
    }
  ]
}
```

## Regras

- **4-6 cenas**, 2-4 segundos cada, totalizando 10-20 segundos
- Usar SOMENTE imagens de `ads/` — nunca gerar ou baixar novas
- Cada cena usa imagem DIFERENTE
- Texto das cenas vem do `narrative.json` (headlines, key_phrases)
- Ultima cena SEMPRE e CTA com texto do `creative_brief.json → approved_ctas`
- Motion: alternar entre push-in, ken-burns-in, drift, breathe
- Nunca repetir o mesmo motion em 2 cenas consecutivas
- Formato: 9:16 (1080x1920)

## Output

Salvar em `<output_dir>/video/`:
- `video_0N_scene_plan.json` — scene plan
- Apos render: `video_0N.mp4`

## Sinal de conclusao

Apos salvar os scene plans:
```
[VIDEO_APPROVAL_NEEDED] <output_dir>
```
