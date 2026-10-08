import { THEME_IDS } from './themes.js';

export const DEFAULTS = Object.freeze({ version: 2, enabled: true, theme: 'terminal-vision', disabledHosts: [] });

export function normalizeSettings(value = {}) {
  return {
    ...DEFAULTS,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : DEFAULTS.enabled,
    theme: THEME_IDS.includes(value.theme) ? value.theme : DEFAULTS.theme,
    disabledHosts: Array.isArray(value.disabledHosts) ? [...new Set(value.disabledHosts.filter(h => typeof h === 'string' && /^[a-z0-9.:[\]-]+$/i.test(h)).map(h => h.toLowerCase()))] : []
  };
}

export function hostname(url) {
  try { const parsed = new URL(url); return /^https?:$/.test(parsed.protocol) ? parsed.hostname : ''; }
  catch { return ''; }
}

export function isEnabled(settings, host) {
  return Boolean(host && settings.enabled && !settings.disabledHosts.includes(host));
}

export function updateSettings(current, patch) {
  const allowed = {};
  for (const key of ['enabled', 'theme']) {
    if (key in patch) allowed[key] = patch[key];
  }
  if (typeof patch.siteHost === 'string' && typeof patch.siteEnabled === 'boolean') {
    const host = hostname(`https://${patch.siteHost}`);
    if (host && host === patch.siteHost) {
      const disabled = new Set(current.disabledHosts);
      patch.siteEnabled ? disabled.delete(host) : disabled.add(host);
      allowed.disabledHosts = [...disabled];
    }
  }
  return normalizeSettings({ ...current, ...allowed });
}
