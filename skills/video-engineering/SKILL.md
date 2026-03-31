# Video Engineering — Manual Técnico de Produção

> Traduz conceitos visuais subjetivos em parâmetros matemáticos para Remotion e FFmpeg.

---

## Quando Usar

- Lido pelo **Diretor de Fotografia** ao escolher o estilo
- Lido pelo **Scene Plan** ao definir motion/easing por cena
- Lido pelo **Renderer** ao aplicar spring/color grading

---

## Style Dictionary

O arquivo `skills/video-engineering/style-dictionary.json` contém os valores exatos para cada estilo. O agente DEVE:

1. Ler o JSON completo
2. Selecionar o estilo baseado na campanha
3. Usar os valores numéricos — NUNCA inventar valores

---

## Regras Universais (sempre aplicar)

| Regra | Valor |
|---|---|
| Texto aparece antes do áudio | 1 frame (0.033s) |
| Corte ocorre antes do transiente | 2 frames (0.066s) |
| Font size mínimo (1080p) | 60px |
| Máximo palavras por overlay | 6 |
| Nunca 100% cuts | Obrigatório crossfade entre seções |
| Zoom mínimo (nunca estático) | 1.06x |
| Color grading unificado | Mesmo LUT em todas as cenas |
| Safe zone vertical | Conteúdo entre 20%-70% |

---

## Como Usar no Scene Plan

Para cada cena, o agente deve incluir no JSON:

```json
{
  "motion": {
    "type": "push-in",
    "intensity": "moderate",
    "spring_config": { "mass": 1, "stiffness": 150, "damping": 15 },
    "easing": "cubic-bezier(0.33, 1, 0.68, 1)",
    "zoom_start": 1.0,
    "zoom_end": 1.12
  },
  "color_grading": {
    "gamma": 1.0,
    "saturate": 0.95,
    "contrast": 1.1,
    "hueRotate": 10
  },
  "speed_ramp": null,
  "motion_blur": "shutter_120",
  "grain": 0.01
}
```

O renderer Remotion lê esses valores e aplica diretamente — sem interpretação.

---

## Referência: doc/videos/

Os guias detalhados dos 20 estilos estão em:
- `doc/videos/guia_edicao_video.md` — estilos 01-10
- `doc/videos/guia_edicao_video_11_20.md` — estilos 11-20
- `doc/videos/guia_edicao_video_11_20_detalhado.md` — detalhamento 11-20
- `doc/videos/guia_movimento_ia.md` — framework universal de movimento
- `doc/videos/guiasVideo.md` — parâmetros técnicos para IA
