// Deliberately limited to sRGB. Unknown CSS color spaces are not guessed.
export function parseColor(value) {
  if (!value) return null;
  if (value === 'transparent') return [0, 0, 0, 0];
  const hex = value.match(/^#([\da-f]{3,8})$/i)?.[1];
  if (hex && [3, 4, 6, 8].includes(hex.length)) {
    const full = hex.length < 5 ? [...hex].map(c => c + c).join('') : hex;
    return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)).concat(full.length === 8 ? parseInt(full.slice(6), 16) / 255 : 1);
  }
  const rgb = value.match(/^rgba?\(([^)]+)\)$/i)?.[1];
  if (!rgb) return null;
  const parts = rgb.trim().split(/\s*[,/]\s*|\s+/);
  if (parts.length < 3 || parts.length > 4) return null;
  const result = parts.map((p, i) => Number(p.replace('%', '')) * (p.endsWith('%') ? (i === 3 ? 0.01 : 2.55) : 1));
  if (result.some((v, i) => !Number.isFinite(v) || v < 0 || v > (i === 3 ? 1 : 255) + 1e-9)) return null;
  return result.length === 3 ? [...result, 1] : result;
}

export function composite(foreground, background) {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  return [...foreground.slice(0, 3).map((v, i) => alpha ? (v * foreground[3] + background[i] * background[3] * (1 - foreground[3])) / alpha : 0), alpha];
}

export function contrastRatio(foreground, background) {
  const luminance = color => color.slice(0, 3).reduce((sum, v, i) => {
    const channel = v / 255;
    return sum + (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
  }, 0);
  const a = luminance(composite(foreground, background));
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function minimumContrast(fontSize, fontWeight) {
  return fontSize >= 24 || (fontSize >= 18.6667 && fontWeight >= 700) ? 3 : 4.5;
}

export function readableColor(preferred, background, minimum = 4.5) {
  const source = parseColor(preferred);
  if (!source || !background || background[3] < 1) return null;
  if (contrastRatio(source, background) >= minimum) return preferred;
  // Tint/shade the theme's own ink by the smallest amount that passes, keeping
  // channel ordering (hue character) rather than immediately substituting gray.
  const candidates = [0, 255].flatMap(endpoint => {
    const mix = amount => [...source.slice(0, 3).map(v => Math.round(v + (endpoint - v) * amount)), 1];
    if (contrastRatio(mix(1), background) < minimum) return [];
    let low = 0; let high = 1;
    for (let i = 0; i < 24; i++) {
      const middle = (low + high) / 2;
      if (contrastRatio(mix(middle), background) >= minimum) high = middle;
      else low = middle;
    }
    return [{ amount: high, color: mix(high) }];
  });
  candidates.sort((a, b) => a.amount - b.amount);
  return candidates[0] ? `rgb(${candidates[0].color.slice(0, 3).join(', ')})` : null;
}

// Layers are front to back; transparent layers must never be skipped.
export function compositeLayers(layers) {
  let result = [0, 0, 0, 0];
  for (const layer of layers) {
    result = composite(result, layer);
    if (result[3] >= 1) return result;
  }
  return null; // No known opaque canvas underneath.
}
