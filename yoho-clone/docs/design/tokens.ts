// Design tokens for the YoHo clone — generated from tokens.json (replica-design).
// Source of truth is tokens.json; do not edit these values by hand.
// The app stack is Expo (React Native) + StyleSheet, so this is the theme
// object components consume (e.g. `tokens.color.surface`), never raw hex.
// The palette is the clone's OWN provisional palette (pending replica-brand):
// accent is deep teal, NOT YoHo's vivid green; the room theme is a dark
// teal-slate gradient, NOT YoHo's violet-cyan.

export const tokens = {
  color: {
    bg: '#ffffff',
    surface: '#f8fafc',
    surface2: '#f1f5f9',
    border: '#e2e8f0',
    borderInput: '#64748b',
    text: '#0f172a',
    textMuted: '#64748b',
    accent: '#0f766e',
    accentStrong: '#0b5e57',
    accentSoft: '#e6f4f3',
    onAccent: '#ffffff',
    danger: '#b91c1c',
    dangerSoft: '#fef2f2',
    success: '#047857',
    successSoft: '#ecfdf5',
    warning: '#c2410c',
    warningSoft: '#fff7ed',
    vip: '#d97706',
    vipSoft: '#fef3c7',
    // topic tags (soft chips; dark text on light tint)
    tagChatBg: '#e6f4f3',
    tagChatText: '#0f766e',
    tagSingBg: '#e0f2fe',
    tagSingText: '#0369a1',
    tagDatingBg: '#fff1f2',
    tagDatingText: '#be123c',
    tagPartyBg: '#fef3c7',
    tagPartyText: '#92400e',
    // functional currency labels (not brand)
    coin: '#f59e0b',
    diamond: '#0ea5e9',
    bean: '#f97316',
    // voice-room theme (dark surface; gradient top -> bottom)
    roomBgStart: '#134e4a',
    roomBgEnd: '#0f172a',
    roomSurface: '#334155',
    roomBorder: '#475569',
    roomText: '#ffffff',
    roomTextMuted: '#cbd5e1',
    roomGlow: '#14b8a6',
    // game colours (fills for the Ludo board / Dominoes felt, not text)
    gameLudoRed: '#dc2626',
    gameLudoGreen: '#16a34a',
    gameLudoYellow: '#eab308',
    gameLudoBlue: '#2563eb',
    gameFelt: '#166534',
    // scrim (photo gradients + modal scrims)
    overlay: 'rgba(15,23,42,0.55)',
  },
  font: {
    sans: 'Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  type: {
    xs: { size: 12, line: 16, weight: '500' as const },
    sm: { size: 14, line: 20, weight: '400' as const },
    base: { size: 16, line: 24, weight: '400' as const },
    lg: { size: 20, line: 28, weight: '600' as const },
    xl: { size: 28, line: 34, weight: '700' as const },
    display: { size: 40, line: 44, weight: '700' as const },
  },
  space: [0, 4, 8, 12, 16, 24, 32, 48, 64],
  radius: { sm: 6, md: 10, lg: 16, xl: 24, pill: 999 },
  shadow: {
    card: '0 1px 2px rgba(16,24,40,.06), 0 1px 3px rgba(16,24,40,.10)',
    pop: '0 12px 32px rgba(16,24,40,.16)',
  },
  motion: {
    fast: '120ms',
    base: '200ms',
    slow: '400ms',
    pulse: '1600ms',
    ease: 'cubic-bezier(.2,.8,.2,1)',
  },
  layout: {
    maxWidth: 420,
    headerHeight: 56,
    bottomNavHeight: 56,
    gridColumns: 2,
    pagePadding: 16,
  },
} as const;

export type Tokens = typeof tokens;
