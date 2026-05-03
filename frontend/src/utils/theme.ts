export interface ThemePrefs {
  primary_color?: string;
  accent_color?: string;
  sidebar_color?: string;
  background_color?: string;
  font_size?: string;
}

export function applyTheme(prefs: ThemePrefs) {
  const r = document.documentElement;
  if (prefs.primary_color)    r.style.setProperty('--color-primary',    prefs.primary_color);
  if (prefs.accent_color)     r.style.setProperty('--color-accent',     prefs.accent_color);
  if (prefs.sidebar_color)    r.style.setProperty('--color-sidebar',    prefs.sidebar_color);
  if (prefs.background_color) r.style.setProperty('--color-background', prefs.background_color);
  r.style.fontSize =
    prefs.font_size === 'sm' ? '14px' : prefs.font_size === 'lg' ? '17px' : '16px';
}
