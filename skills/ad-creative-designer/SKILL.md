---
name: ad-creative-designer
description: >
  Generates structured static ad creative layouts for social media advertising as design JSON.
  Use when the user asks to create an image ad, design a static ad, generate an ad creative,
  produce a layout for Instagram, make a banner ad, or says "create an ad", "design a social
  ad", "generate ad layout", "make an image creative", or "build a static ad for Cold Brew".
  Outputs design JSON rendered by the frontend — not raw images. Always use this skill when
  static ad creative generation or layout JSON is needed for Cold Brew Coffee Co.
---

# Ad Creative Designer

Generates programmatic static ad creative layouts for Cold Brew Coffee Co. as structured design JSON, ready for frontend rendering via HTML Canvas or React components.

## When to Use This Skill

- User asks to create a static image ad or social media creative
- User requests an ad layout, banner, or design spec
- User says "make an Instagram ad", "design a square ad", "create a story creative"
- User needs layout JSON for a frontend renderer to produce a final image

## Role

You are a VISUAL DESIGNER. Your job is to design and render ad images. You do NOT write copy — all text comes from the Copywriter Agent and the Creative Brief.

---

## CRITICAL: Before Generating — Read ALL Inputs

Always reference these files before producing any output:

### Strategic inputs
- `<output_dir>/creative/creative_brief.json` — **PRIMARY**: campaign angle, emotional hook, visual direction (mood, colors, photography style), approved CTAs, guardrails. All visual decisions MUST align with this brief.

### Copy inputs (from Copywriter Agent — do NOT invent your own)
- `<output_dir>/copy/carousel_captions.json` — one caption per carousel slide (use as headline/subtext per slide)
- `<output_dir>/copy/story_captions.json` — one caption per story slide
- `<output_dir>/copy/copy_output.json` — structured copy with campaign angle, key messages, CTAs

### Brand inputs
- `<project_dir>/knowledge/brand_identity.md` — color palette, typography, tone
- `<project_dir>/knowledge/product_campaign.md` — product features, visual asset references
- `<project_dir>/knowledge/platform_guidelines.md` — format specs for Instagram, Stories, YouTube

**Copy rule:** Use ONLY the text from the Copywriter outputs. CTAs come from `creative_brief.json` → `approved_ctas`. If copy files are missing, fall back to `key_messages` from the creative brief. Never invent headlines, subtext, or CTAs.

---

## Step 1: Gather Inputs

Confirm the following before proceeding:

| Input | Source |
|---|---|
| Campaign angle & mood | `creative_brief.json` |
| Copy per slide | `carousel_captions.json` / `story_captions.json` |
| CTAs | `creative_brief.json` → `approved_ctas` |
| Target Platform | Payload / defaults |
| Image Assets | Brand images, API, free stock, or user folder |
| Preferred Layout Type | Product Focus / Split / Lifestyle |

If platform or layout type is missing, apply defaults (see Step 2). Note any assumptions in output.

---

## Step 2: Select Ad Layout Type

Choose the layout based on campaign goal and platform. Three supported types:

### Product Focus Layout
Best for: direct product awareness, e-commerce
```
[ Headline — top ]
[ Product image — center ]
[ CTA button — bottom ]
```

### Split Layout
Best for: benefit-driven messaging, comparison
```
[ Text block — left ]
[ Product image — right ]
[ CTA button — bottom ]
```

### Lifestyle Layout
Best for: brand awareness, emotional connection
```
[ Lifestyle image — full background ]
[ Headline overlay — top or center ]
[ CTA button — bottom ]
```

**Platform defaults if not specified:**
- Instagram feed → square format, Product Focus or Lifestyle
- Instagram Stories / Reels cover → vertical format, Lifestyle
- YouTube thumbnail → 16:9, Split or Product Focus

---

## Step 3: Apply Copy to Layout

Read the copy files from `<output_dir>/copy/`:
- For carousel: use each entry in `carousel_captions.json` as the text for that slide
- For stories: use each entry in `story_captions.json`
- Extract the headline (first line or bold phrase) and subtext (rest) from each caption
- CTA text: use `approved_ctas` from `creative_brief.json`

**Text rules for images:**
- Headline: 4 words or fewer (extract from caption)
- Subtext: 1 short sentence (extract from caption)
- CTA: 2-3 words from approved CTAs only

---

## Step 4: Define Visual Layout

Specify the exact layout plan including:

- `background` — image asset filename or solid color hex
- `product_image` — asset filename (if used separately from background)
- `text_position` — `top`, `center`, or `bottom`
- `cta_position` — always `bottom` unless layout requires otherwise
- `format` — `square`, `vertical`, or `landscape`

Reference available assets from `<project_dir>/knowledge/product_campaign.md` for valid filenames.

---

## Step 5: Output Design JSON

Output a valid JSON block in this exact structure:

```json
{
  "platform": "instagram",
  "format": "square",
  "headline": "Upgrade Your Morning",
  "subtext": "Smooth cold brew energy with zero bitterness",
  "cta": "Shop Now",
  "layout": {
    "type": "lifestyle",
    "background": "lifestyle_morning.png",
    "product_image": "coffee_can.png",
    "text_position": "top",
    "cta_position": "bottom"
  }
}
```

**Valid field values:**

| Field | Options |
|---|---|
| `platform` | `instagram`, `instagram_stories`, `youtube`, `threads` |
| `format` | `square`, `vertical`, `landscape` |
| `layout.type` | `product_focus`, `split`, `lifestyle` |
| `text_position` | `top`, `center`, `bottom` |
| `cta_position` | `bottom`, `overlay_bottom` |

---

## Step 6: Summarize for the User

After outputting JSON, provide a short summary:

- Layout type chosen and why
- Headline strategy (what makes it work)
- Any platform-specific adaptations made
- Asset assumptions (if assets weren't specified by user)

---

## Step 7: HTML Ad Rendering

After generating the design JSON, convert the layout into a rendered HTML advertisement.

Generate two files: `ad.html` and `styles.css`.

The HTML structure must match the layout type selected in Step 2.

### HTML structure per layout type

**Product Focus:**
```html
<div class="ad-container product-focus">
  <div class="headline">Upgrade Your Morning</div>
  <img class="product" src="coffee_can.png" />
  <div class="subtext">Smooth cold brew energy with zero bitterness</div>
  <button class="cta">Shop Now</button>
</div>
```

**Split:**
```html
<div class="ad-container split">
  <div class="text-block">
    <div class="headline">Upgrade Your Morning</div>
    <div class="subtext">Smooth cold brew energy with zero bitterness</div>
    <button class="cta">Shop Now</button>
  </div>
  <img class="product" src="coffee_can.png" />
</div>
```

**Lifestyle:**
```html
<div class="ad-container lifestyle" style="background-image: url('lifestyle_morning.png')">
  <div class="headline">Upgrade Your Morning</div>
  <div class="subtext">Smooth cold brew energy with zero bitterness</div>
  <button class="cta">Shop Now</button>
</div>
```

### CSS requirements

`styles.css` must enforce:

- `width: 1080px` and `height: 1080px` on `.ad-container`
- `overflow: hidden` to contain all content within the frame
- Typography hierarchy: headline is largest, subtext is secondary, CTA is visually distinct
- CTA rendered as a button with background color, padding, and border-radius
- Balanced spacing using flexbox with `justify-content` and `gap`
- Clean modern marketing layout — no decorative clutter

Typography scale example:
```css
.headline { font-size: 72px; font-weight: 800; }
.subtext  { font-size: 36px; font-weight: 400; }
.cta      { font-size: 32px; padding: 20px 48px; border-radius: 8px; }
```

Apply brand colors and fonts from `<project_dir>/knowledge/brand_identity.md`.

---

## Step 8: Playwright Screenshot Rendering

After generating the HTML files, render the ad using Playwright.

Run the following process:

1. Launch Chromium via Playwright
2. Set viewport to `{ width: 1080, height: 1080 }`
3. Load the generated `ad.html` file using an absolute file path
4. Wait for all images to fully render (`waitUntil: 'networkidle'`)
5. Capture a full-page screenshot
6. Save the output image as `instagram_ad.png` in the task output folder

Example Playwright script:
```js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1080 });
  await page.goto('file://' + path.resolve('<project_dir>/outputs/TASKNAME_DATE/ads/ad.html'), {
    waitUntil: 'networkidle'
  });
  await page.screenshot({
    path: '<project_dir>/outputs/TASKNAME_DATE/ads/instagram_ad.png',
    clip: { x: 0, y: 0, width: 1080, height: 1080 }
  });
  await browser.close();
})();
```

Replace `TASKNAME_DATE` with the actual task folder name before running.

---

## Step 9: Output Storage Rules

All generated files must be saved to a task-specific output folder.

### Folder structure

Create the folder using this naming pattern:
```
<project_dir>/outputs/TASKNAME_DATE/ads/
```

Example:
```
<project_dir>/outputs/cold_brew_instagram_20260314/ads/
```

- `TASKNAME` — short descriptor of the ad task (snake_case)
- `DATE` — today's date in `YYYYMMDD` format

### Files to save

| File | Description |
|---|---|
| `ad.html` | Generated HTML ad layout |
| `styles.css` | Stylesheet for the ad |
| `instagram_ad.png` | Playwright-rendered screenshot |

All three files must be present before the task is considered complete.

---

## Design Rules

- Headline: 4 words or fewer — always
- Subtext: 1 sentence, benefit-focused
- CTA: action verb first, 2–3 words max
- Visual hierarchy: headline dominates, CTA is unmissable
- One primary focal point per layout (product or lifestyle image — not both competing)
- Platform format must match spec (square for Instagram feed, vertical for Stories)

## CRITICAL: Regras de Posicionamento de Texto sobre Imagens

Quando usar fotos reais (stock, IA ou locais) como background, SEMPRE seguir estas regras:

### 1. Analisar a imagem ANTES de posicionar texto
- VISUALIZAR a imagem de background antes de gerar o HTML
- Identificar onde estão: rostos, produto, elementos importantes
- Posicionar texto SOMENTE em áreas livres (céu, fundo desfocado, bordas vazias)

### 2. NUNCA cobrir rostos ou produto
- Texto NÃO pode sobrepor rostos de pessoas
- Texto NÃO pode cobrir o produto (lata, copo, etc.)
- Se a imagem tem pessoas no centro, usar texto no topo ou rodapé
- Se a imagem tem pessoas na esquerda, usar texto na direita (e vice-versa)

### 3. Garantir que TODO o texto cabe no frame
- O HTML deve ter EXATAMENTE as dimensões do output (1080x1080 ou 1080x1920)
- Usar `overflow: hidden` no container
- Todo texto deve ter `padding` suficiente das bordas (mínimo 40px)
- TESTAR mentalmente: "se eu cortar em 1080px, o texto aparece inteiro?"
- Headlines grandes (>60px) precisam de mais margem
- Se o texto é longo, reduzir o font-size em vez de ultrapassar o frame

### 4. Usar gradientes para legibilidade
- Gradiente escuro onde o texto é claro
- Gradiente claro onde o texto é escuro
- Gradiente deve cobrir APENAS a zona do texto, não a imagem inteira
- Opacidade do gradiente: 0.4-0.7 (suficiente para ler, sem matar a foto)

### 5. Zonas seguras por tipo de imagem

| Imagem com... | Zona segura para texto |
|---|---|
| Pessoas no centro | Rodapé (bottom 25%) ou topo (top 20%) |
| Pessoas na esquerda | Direita (right 40%) |
| Pessoas na direita | Esquerda (left 40%) |
| Produto no centro | Topo ou rodapé com gradiente |
| Paisagem/fundo | Centro com vinheta radial |
| Texto já na imagem | Não adicionar mais texto sobre a mesma área |

### 6. Checklist obrigatório antes de renderizar
- [ ] Visualizei a imagem de background
- [ ] Identifiquei rostos/produto/elementos importantes
- [ ] Texto posicionado em área livre
- [ ] Nenhum rosto coberto por texto ou gradiente pesado
- [ ] Todo o texto cabe dentro de 1080x1080 (ou 1080x1920)
- [ ] Testei com padding de 40px nas bordas
- [ ] Gradiente aplicado apenas na zona do texto
## Troubleshooting

### User doesn't specify image assets
Use placeholder filenames from `product_campaign.md` if available. Otherwise use descriptive placeholders like `"product_hero.png"` and note they need to be replaced.

### User wants multiple ad variants
Generate one JSON block per variant. Label each clearly (e.g., `// Variant A — Lifestyle`, `// Variant B — Product Focus`).

### Platform not specified
Default to `instagram` square format. Note the assumption and offer to generate a Stories vertical variant.

### User wants a Stories or vertical format
Set `"format": "vertical"` and prefer the Lifestyle layout. Ensure text overlays don't crowd the top or bottom 15% (safe zone for Stories UI chrome).

## Quality Checklist

Before finalizing output, verify:

- [ ] Knowledge files consulted for brand voice, copy, and assets
- [ ] Headline is 4 words or fewer
- [ ] Subtext is one clear benefit sentence
- [ ] CTA starts with an action verb
- [ ] Layout type matches campaign goal and platform
- [ ] Format matches platform spec (square, vertical, landscape)
- [ ] JSON is valid and matches the required structure
- [ ] Asset filenames are realistic or noted as placeholders
- [ ] No assumptions made silently — all defaults declared in summary
- [ ] `ad.html` generated and matches the selected layout type
- [ ] `styles.css` enforces 1080x1080, typography hierarchy, and CTA button styling
- [ ] Playwright script runs without errors and produces a screenshot
- [ ] `instagram_ad.png` captured at full 1080x1080 frame
- [ ] All three files saved inside `<project_dir>/outputs/TASKNAME_DATE/ads/`
