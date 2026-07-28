/** Nombre legal de la marca — siempre en este orden, nunca "Corporación Epoint". */
export const BRAND_NAME = "Epoint Corporation";

/** Paleta Epoint — alineada con globals.css y DesertBackground (login). */
export const emailTheme = {
  brand: "#3d6b45",
  brandDark: "#2d5234",
  brandLight: "#4a8054",
  brandMuted: "#e8f5e9",
  accentGold: "#c4a882",
  /** Cielo y dunas del login (DesertBackground.tsx) */
  desertNight: "#1a1008",
  desertDusk: "#2d1b0f",
  desertHorizon: "#4b240f",
  desertSand: "#6b3d1f",
  desertGlow: "#8a5a32",
  duneShadow: "#432f23",
  sunGold: "#e8c48c",
  sunWarm: "#c4a882",
  brown900: "#2d1b0f",
  brown800: "#3d2817",
  cream400: "#f8f4ed",
  cream500: "#f0ebe1",
  cream600: "#f0eada",
  cream700: "#ece9d8",
  textPrimary: "#0d141a",
  textSecondary: "#333333",
  textMuted: "#666666",
  white: "#ffffff",
  border: "#e8e0d4",
} as const;

/** Gradiente vertical del cielo desértico (oscuro arriba → arena abajo). */
export const desertSkyGradient = `linear-gradient(180deg, ${emailTheme.desertNight} 0%, ${emailTheme.desertDusk} 28%, ${emailTheme.desertHorizon} 55%, ${emailTheme.desertSand} 78%, ${emailTheme.desertGlow} 100%)`;
