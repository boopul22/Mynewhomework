export const themeColors = {
  // Base colors
  background: '0 0% 100%', // Pure white
  foreground: '240 10% 20%', // Dark slate for text
  
  // Card and UI elements
  card: '0 0% 100%',
  cardForeground: '240 10% 20%',
  popover: '0 0% 100%',
  popoverForeground: '240 10% 20%',
  
  // Primary colors - Blue theme
  primary: '224 76% 48%', // Vibrant blue
  primaryForeground: '0 0% 100%',
  
  // Secondary colors - Softer blue
  secondary: '220 14% 96%',
  secondaryForeground: '240 10% 20%',
  
  // Muted elements
  muted: '220 14% 96%',
  mutedForeground: '240 10% 40%',
  
  // Accent colors - Indigo
  accent: '224 76% 48%',
  accentForeground: '0 0% 100%',
  
  // Destructive colors - Red
  destructive: '0 84% 60%',
  destructiveForeground: '0 0% 100%',
  
  // Borders and inputs
  border: '220 13% 91%',
  input: '220 13% 91%',
  ring: '224 76% 48%',

  // Success colors
  success: '142 72% 29%',
  successForeground: '0 0% 100%',
  
  // Warning colors
  warning: '38 92% 50%',
  warningForeground: '0 0% 100%',
  
  // Info colors
  info: '199 89% 48%',
  infoForeground: '0 0% 100%',
} as const;

export const themeRadius = {
  radius: '0.5rem',
  radiusLg: '0.75rem',
  radiusSm: '0.375rem',
  radiusXl: '1rem',
  radiusFull: '9999px',
} as const;

// Calendar specific theme
export const calendarTheme = {
  cellSize: '40px',
  accentColor: 'hsl(224, 76%, 48%)', // Using primary color
  backgroundColor: 'hsl(220, 14%, 96%)', // Using muted color
  outline: '2px solid hsl(224, 76%, 48%)', // Using primary color
  outlineSelected: '2px solid hsl(224, 76%, 48%, 0.5)', // Using primary color with opacity
} as const;

// Shadows
export const themeShadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  default: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Function to get CSS variable value
export function getThemeColor(colorKey: keyof typeof themeColors) {
  return `hsl(var(--${colorKey}))`;
}

// Function to get radius value
export function getThemeRadius(radiusKey: keyof typeof themeRadius) {
  return `var(--${radiusKey})`;
}

// Function to get shadow value
export function getThemeShadow(shadowKey: keyof typeof themeShadows) {
  return themeShadows[shadowKey];
} 