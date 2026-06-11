// src/components/SvgLoader.tsx
import React from 'react';
import { SVG_IMAGES, SvgImageName } from '../constants/svgAssets';

interface SvgLoaderProps {
  name: SvgImageName;   // Must match one of the keys in your SVG_IMAGES map
  width?: number | string;
  height?: number | string;
  color?: string;       // Optional: Override path colors dynamically
}

export const SvgLoader: React.FC<SvgLoaderProps> = ({
  name,
  width = 24,
  height = 24,
  color
}) => {
  const SvgComponent = SVG_IMAGES[name];

  if (!SvgComponent) {
    console.error(`Unknown SVG asset name: ${name}`);
    return null;
  }

  return <SvgComponent width={width} height={height} color={color} />;
};