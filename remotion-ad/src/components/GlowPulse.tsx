import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface GlowPulseProps {
  color?: string;
  minOpacity?: number;
  maxOpacity?: number;
  frequencyFrames?: number;
  children: React.ReactNode;
}

export const GlowPulse: React.FC<GlowPulseProps> = ({
  color = '#0099FF',
  minOpacity = 0.85,
  maxOpacity = 1.0,
  frequencyFrames = 30,
  children,
}) => {
  const frame = useCurrentFrame();
  const pulse = interpolate(
    frame % frequencyFrames,
    [0, frequencyFrames / 2, frequencyFrames],
    [minOpacity, maxOpacity, minOpacity]
  );

  return (
    <div style={{
      opacity: pulse,
      filter: `drop-shadow(0 0 20px ${color}) drop-shadow(0 0 40px ${color})`,
    }}>
      {children}
    </div>
  );
};
