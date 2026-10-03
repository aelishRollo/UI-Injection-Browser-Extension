// Deliberately small. These teach roles to every theme; no theme-specific values.
// Corrections are opt-in in the experiment so the uncorrected baseline stays measurable.
const corrections = [
  {
    id: 'youtube-player-controls', hosts: ['youtube.com', 'www.youtube.com', 'm.youtube.com'],
    roles: { 'overlay-control': ['.ytp-button', '.ytp-menuitem'] },
    preserve: ['.html5-video-player']
  },
  {
    id: 'fixture-custom-components', hosts: ['localhost', '127.0.0.1'],
    roles: { button: ['.fixture-action'], surface: ['.fixture-panel'], error: ['.fixture-error'], success: ['.fixture-success'] },
    preserve: []
  }
];

export function getCorrections(host, enabled) {
  const matches = enabled ? corrections.filter(c => c.hosts.includes(host)) : [];
  const roles = {};
  for (const correction of matches) {
    for (const [role, selectors] of Object.entries(correction.roles)) {
      (roles[role] ||= []).push(...selectors);
    }
  }
  return { ids: matches.map(c => c.id), roles, preserve: matches.flatMap(c => c.preserve) };
}
