import React from 'react';
import { useCurrentFrame, AbsoluteFill } from 'remotion';

interface DigitalOverlayProps {
  color?: string;
  opacity?: number;
  type?: 'grid' | 'code' | 'matrix';
}

export const DigitalOverlay: React.FC<DigitalOverlayProps> = ({
  color = '#0099FF',
  opacity = 0.08,
  type = 'grid',
}) => {
  const frame = useCurrentFrame();

  if (type === 'grid') {
    return (
      <AbsoluteFill style={{
        opacity,
        backgroundImage: `
          linear-gradient(${color}40 1px, transparent 1px),
          linear-gradient(90deg, ${color}40 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        backgroundPosition: `0 ${-frame * 0.5}px`,
        pointerEvents: 'none',
      }} />
    );
  }

  // Scrolling binary/code effect
  const lines = Array.from({ length: 30 }, (_, i) => {
    const seed = (i * 7 + 13) % 100;
    const chars = '01001101 10110010 11001010 00101101'.substring(seed % 20);
    return chars;
  });

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        fontFamily: 'monospace',
        fontSize: 12,
        color,
        lineHeight: '18px',
        whiteSpace: 'pre',
        transform: `translateY(${-frame * 1.5}px)`,
      }}>
        {lines.concat(lines).map((line, i) => (
          <div key={i} style={{ opacity: 0.3 + (i % 3) * 0.2 }}>{line}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
