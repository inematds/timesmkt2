import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TextOverlay, TextAnimation, getTextAnimationForScene } from '../components/TextOverlay';
import { ProductImage } from '../components/ProductImage';
import { CTAButton } from '../components/CTAButton';
import { CameraMotion, CameraEffect, getDefaultCameraEffect, getDefaultOverlay } from '../components/CameraMotion';
import {
  SolidBackground, FloodBackground, GlowRings,
  FlashTransition, Vignette,
} from '../components/SceneBackgrounds';
import { SparkleBurst, AlarmClock } from '../components/SVGIcons';

// ── Types ───────────────────────────────────────────────────────────────────

export interface SceneData {
  scene_id: number;
  tipo: string;
  type?: string;
  nome?: string;
  timing_segundos?: string;
  frame_inicio: number;
  frame_fim: number;
  duracao_frames: number;
  descricao_visual: string;
  text_overlay: any;
  animacoes?: string[];
  assets_remotion?: string[];
  cta_acao?: string;
  cta_variants?: Record<string, string>;
  // New: scene-level overrides
  camera_effect?: CameraEffect;
  background_image?: string;
  overlay?: 'dark' | 'light' | 'warm' | 'cool' | 'sepia' | 'none';
  overlay_opacity?: number;
  text_animation?: TextAnimation;
  blur?: number;
}

export interface SceneProps {
  scene: SceneData;
  palette: Record<string, string>;
  ctaText?: string;
  ctaAction?: string;
  isLastScene?: boolean;
  // Scene background images mapped by scene type
  sceneImages?: Record<string, string>;
}

// ── Color helpers ───────────────────────────────────────────────────────────

function getColor(palette: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (palette[k]) return palette[k];
  }
  return '#2C1A0E';
}

function dark(p: Record<string, string>) { return getColor(p, 'coffee_dark', 'fundo_principal', 'fase_adulta'); }
function mid(p: Record<string, string>) { return getColor(p, 'coffee_mid', 'fundo_cena_quente', 'fase_adolescencia'); }
function blue(p: Record<string, string>) { return getColor(p, 'cold_blue', 'destaque_frio'); }
function amber(p: Record<string, string>) { return getColor(p, 'amber', 'destaque_amber'); }
function light(p: Record<string, string>) { return getColor(p, 'off_white', 'texto', 'fundo_cta'); }

// ── Text extraction ─────────────────────────────────────────────────────────

function extractText(overlay: any): string {
  if (!overlay) return '';
  if (typeof overlay === 'string') return overlay;
  if (overlay.texto) return overlay.texto;
  if (overlay.text) return overlay.text;
  // Multi-line
  const lines: string[] = [];
  for (const key of Object.keys(overlay)) {
    if (key.startsWith('linha_') && overlay[key]?.texto) lines.push(overlay[key].texto);
  }
  return lines.length > 0 ? lines.join('\n') : '';
}

function getTextStartFrame(overlay: any, sceneDuration: number): number {
  if (!overlay) return 10;
  if (overlay.entrada_frame !== undefined) return overlay.entrada_frame;
  if (overlay.animacao?.text_start_frame !== undefined) return overlay.animacao.text_start_frame;
  return Math.floor(sceneDuration * 0.15);
}

// ── Asset detection ─────────────────────────────────────────────────────────

function hasProduct(scene: SceneData): boolean {
  return (scene.assets_remotion || []).some(a =>
    a.includes('coffee_can') || a.includes('coffee_glass') || a.includes('product')
  );
}

function getProductSrc(scene: SceneData): string {
  for (const a of scene.assets_remotion || []) {
    if (a.includes('coffee_glass')) return 'coffee_glass.png.jpeg';
    if (a.includes('coffee_can')) return 'coffee_can.png.jpeg';
    if (a.includes('product_square')) return 'product_square.png';
  }
  return 'coffee_can.png.jpeg';
}

function hasBackgroundAsset(scene: SceneData): boolean {
  return (scene.assets_remotion || []).some(a =>
    a.includes('morning_cafe') || a.includes('background')
  );
}

function getBgAssetSrc(scene: SceneData): string {
  for (const a of scene.assets_remotion || []) {
    if (a.includes('morning_cafe')) return 'morning_cafe.png.jpeg';
    if (a.includes('background_blur')) return 'background_blur.png';
  }
  return 'morning_cafe.png.jpeg';
}

// ── Detect animation from description ───────────────────────────────────────

function detectCameraFromDescription(desc: string): CameraEffect | null {
  const d = desc.toLowerCase();
  if (d.includes('zoom in') || d.includes('close') || d.includes('micro-zoom')) return 'ken-burns-in';
  if (d.includes('zoom out') || d.includes('reveal') || d.includes('abrir')) return 'ken-burns-out';
  if (d.includes('pan') && d.includes('esquerda')) return 'pan-left';
  if (d.includes('pan') && d.includes('direita')) return 'pan-right';
  if (d.includes('push') || d.includes('empurr') || d.includes('impacto')) return 'push-in';
  if (d.includes('suave') || d.includes('sutil') || d.includes('leve')) return 'drift';
  if (d.includes('paralax') || d.includes('dinâmic')) return 'parallax-zoom';
  if (d.includes('respirar') || d.includes('pulsa') || d.includes('loop')) return 'breathe';
  return null;
}

function detectTextAnimFromDescription(overlay: any): TextAnimation | null {
  if (!overlay) return null;
  const anim = overlay.animacao || overlay.animation || '';
  const animStr = typeof anim === 'string' ? anim : (anim.text_motion || anim.animacao || '');
  const d = animStr.toLowerCase();
  if (d.includes('per-word') || d.includes('per_word') || d.includes('palavra')) return 'per-word';
  if (d.includes('punch') || d.includes('impacto')) return 'punch-in';
  if (d.includes('typewriter') || d.includes('datil') || d.includes('letter-by-letter')) return 'typewriter';
  if (d.includes('blur') || d.includes('desfoque')) return 'blur-in';
  if (d.includes('bounce') || d.includes('pula')) return 'bounce-in';
  if (d.includes('scale') || d.includes('escala')) return 'scale-up';
  if (d.includes('slide') && d.includes('down')) return 'slide-down';
  if (d.includes('slide') && d.includes('left')) return 'slide-left';
  if (d.includes('slide') && d.includes('right')) return 'slide-right';
  if (d.includes('fade')) return 'fade';
  return null;
}

// ── Choose background image for scene ───────────────────────────────────────

function pickBackgroundImage(scene: SceneData, sceneImages?: Record<string, string>): string | null {
  // 1. Explicit background_image in scene
  if (scene.background_image) return scene.background_image;

  // 2. Mapped by scene type from sceneImages prop
  const tipo = scene.tipo || scene.type || '';
  if (sceneImages) {
    if (sceneImages[tipo]) return sceneImages[tipo];
    // Fuzzy match
    for (const [key, src] of Object.entries(sceneImages)) {
      if (tipo.includes(key) || key.includes(tipo)) return src;
    }
    // Match by scene_id
    const byId = sceneImages[`scene_${scene.scene_id}`];
    if (byId) return byId;
  }

  // 3. Use asset from scene if it's a background
  if (hasBackgroundAsset(scene)) return getBgAssetSrc(scene);

  // 4. Default backgrounds per scene type
  const defaults: Record<string, string> = {
    'hook': 'background_blur.png',
    'conexao': 'morning_cafe.png.jpeg',
    'benefit': 'morning_cafe.png.jpeg',
    'produto': 'background_blur.png',
    'product': 'background_blur.png',
    'close': 'background_blur.png',
    'flashback': 'morning_cafe.png.jpeg',
    'presente': 'background_blur.png',
  };

  for (const [key, src] of Object.entries(defaults)) {
    if (tipo.includes(key)) return src;
  }

  return null;
}

// ── Main Component ──────────────────────────────────────────────────────────

export const DynamicScene: React.FC<SceneProps> = ({
  scene, palette, ctaText, ctaAction, isLastScene, sceneImages,
}) => {
  const tipo = scene.tipo || scene.type || 'generic';
  const text = extractText(scene.text_overlay);
  const textStart = getTextStartFrame(scene.text_overlay, scene.duracao_frames);
  const showProduct = hasProduct(scene);
  const productSrc = getProductSrc(scene);

  // Read typography from scene plan (set by adapter from text_layout)
  const sceneTextOverlay = typeof scene.text_overlay === 'object' ? scene.text_overlay : null;
  const sceneFontSize = sceneTextOverlay?.tamanho || null;
  const sceneFontWeight = sceneTextOverlay?.peso ? Number(sceneTextOverlay.peso) || 800 : null;
  const sceneTextColor = sceneTextOverlay?.cor || null;
  const sceneTextPosition = sceneTextOverlay?.posicao || null;
  const sceneLineHeight = sceneTextOverlay?.line_height || null;

  // ── Resolve camera, overlay, text animation from scene data + description ──
  const cameraEffect: CameraEffect =
    scene.camera_effect
    || detectCameraFromDescription(scene.descricao_visual)
    || getDefaultCameraEffect(tipo);

  const overlayType =
    scene.overlay || getDefaultOverlay(tipo);

  const overlayOpacity = scene.overlay_opacity ?? (tipo.includes('cta') ? 0.15 : 0.45);

  const textAnim: TextAnimation =
    scene.text_animation
    || detectTextAnimFromDescription(scene.text_overlay)
    || getTextAnimationForScene(tipo);

  const bgImage = pickBackgroundImage(scene, sceneImages);
  const bgBlur = scene.blur ?? (tipo.includes('close') ? 2 : 0);

  // ── CTA scene ─────────────────────────────────────────────────────────────
  if (tipo === 'cta') {
    const buttonText = ctaAction || scene.cta_acao || 'Compre Agora';
    const ctaMainText = ctaText || text;

    if (bgImage) {
      return (
        <CameraMotion
          src={bgImage}
          effect="breathe"
          intensity={0.3}
          overlay="light"
          overlayOpacity={0.7}
        >
          {showProduct && (
            <ProductImage src={productSrc} size={280} entrance="spring-pop" startFrame={8} floating positionPercent={25} />
          )}
          <TextOverlay
            text={ctaMainText}
            fontSize={sceneFontSize || 60}
            color={sceneTextColor || dark(palette)}
            animation={textAnim || "bounce-in"}
            startFrame={textStart > 0 ? textStart : 15}
            position={sceneTextPosition || undefined}
            positionPercent={!sceneTextPosition ? 55 : undefined}
            fontWeight={sceneFontWeight || 800}
            lineHeight={sceneLineHeight || undefined}
          />
          <CTAButton text={buttonText} bgColor={amber(palette)} textColor={light(palette)} startFrame={Math.floor(scene.duracao_frames * 0.6)} />
        </CameraMotion>
      );
    }

    return (
      <AbsoluteFill>
        <SolidBackground color={light(palette)} />
        {showProduct && (
          <ProductImage src={productSrc} size={280} entrance="spring-pop" startFrame={8} floating positionPercent={25} />
        )}
        <TextOverlay
          text={ctaMainText}
          fontSize={sceneFontSize || 60}
          color={sceneTextColor || dark(palette)}
          animation={textAnim || "bounce-in"}
          startFrame={textStart > 0 ? textStart : 15}
          position={sceneTextPosition || undefined}
          positionPercent={!sceneTextPosition ? 55 : undefined}
          fontWeight={sceneFontWeight || 800}
          lineHeight={sceneLineHeight || undefined}
        />
        <CTAButton text={buttonText} bgColor={amber(palette)} textColor={light(palette)} startFrame={Math.floor(scene.duracao_frames * 0.6)} />
      </AbsoluteFill>
    );
  }

  // ── All other scenes: use CameraMotion with background image ──────────────
  if (bgImage) {
    return (
      <CameraMotion
        src={bgImage}
        effect={cameraEffect}
        intensity={0.6}
        overlay={overlayType}
        overlayOpacity={overlayOpacity}
        blur={bgBlur}
      >
        {/* Flash transition for 'presente' scenes */}
        {tipo.includes('presente') && <FlashTransition />}

        {/* Product overlay */}
        {showProduct && (
          <ProductImage
            src={productSrc}
            size={tipo.includes('close') ? 380 : 260}
            entrance={tipo.includes('presente') ? 'spring-pop' : tipo.includes('produto') ? 'slide-right' : 'fade'}
            startFrame={Math.floor(scene.duracao_frames * 0.1)}
            floating={!tipo.includes('close')}
            glow={tipo.includes('produto') || tipo.includes('presente')}
            glowColor={amber(palette)}
            positionPercent={tipo.includes('cta') ? 25 : 35}
          />
        )}

        {/* Sparkles for benefit/presente scenes */}
        {(tipo.includes('presente') || tipo.includes('benefit')) && (
          <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', zIndex: 5, opacity: 0.7 }}>
            <SparkleBurst size={500} count={10} />
          </div>
        )}

        {/* Vignette for close/flashback */}
        {(tipo.includes('close') || tipo.includes('flashback')) && <Vignette intensity={0.6} />}

        {/* Text */}
        <TextOverlay
          text={text}
          fontSize={sceneFontSize || (tipo.includes('hook') ? 68 : tipo.includes('cta') ? 60 : 52)}
          color={sceneTextColor || (overlayType === 'light' ? dark(palette) : light(palette))}
          animation={textAnim}
          startFrame={textStart}
          position={sceneTextPosition || undefined}
          positionPercent={!sceneTextPosition ? (tipo.includes('hook') ? 55 : tipo.includes('close') ? 18 : 72) : undefined}
          italic={tipo.includes('flashback')}
          fontWeight={sceneFontWeight || (tipo.includes('hook') ? 900 : 700)}
          lineHeight={sceneLineHeight || undefined}
        />
      </CameraMotion>
    );
  }

  // ── Fallback: no background image, use colored backgrounds ────────────────
  return (
    <AbsoluteFill>
      {tipo.includes('hook') && (
        <SolidBackground color={dark(palette)} secondaryColor={mid(palette)} gradient="radial" />
      )}
      {tipo.includes('benefit') || tipo.includes('conexao') ? (
        <FloodBackground color={amber(palette)} delay={5} />
      ) : null}
      {tipo.includes('produto') || tipo.includes('product') ? (
        <>
          <SolidBackground color={blue(palette)} secondaryColor={dark(palette)} gradient="radial" />
          <GlowRings color1={amber(palette)} color2={blue(palette)} />
        </>
      ) : null}
      {tipo.includes('flashback') && (
        <>
          <SolidBackground color={mid(palette)} />
          <Vignette intensity={0.7} />
        </>
      )}
      {tipo.includes('close') && <SolidBackground color={dark(palette)} />}
      {tipo.includes('presente') && (
        <>
          <SolidBackground color={dark(palette)} />
          <FlashTransition />
        </>
      )}

      {!tipo.includes('hook') && showProduct && (
        <ProductImage
          src={productSrc}
          size={300}
          entrance="spring-pop"
          startFrame={10}
          floating
          glow
          glowColor={amber(palette)}
          positionPercent={35}
        />
      )}

      {tipo.includes('hook') && !showProduct && (
        <div style={{ position: 'absolute', top: '28%', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
          <AlarmClock size={200} />
        </div>
      )}

      {(tipo.includes('presente') || tipo.includes('benefit')) && (
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', zIndex: 5 }}>
          <SparkleBurst size={500} count={10} />
        </div>
      )}

      <TextOverlay
        text={text}
        fontSize={sceneFontSize || 56}
        color={sceneTextColor || (tipo.includes('benefit') ? dark(palette) : light(palette))}
        animation={textAnim}
        startFrame={textStart}
        position={sceneTextPosition || 'center'}
        positionPercent={!sceneTextPosition ? 65 : undefined}
        fontWeight={sceneFontWeight || 700}
        lineHeight={sceneLineHeight || undefined}
      />
    </AbsoluteFill>
  );
};
