/** Mapeo de nombres de color a hex (español + inglés) */
export const colorHexMap: Record<string, string> = {
  negro: "#1a1a1a",
  black: "#1a1a1a",
  blanco: "#f5f5f5",
  white: "#f5f5f5",
  gris: "#888",
  grey: "#888",
  gray: "#888",
  plata: "#c0c0c0",
  silver: "#c0c0c0",
  azul: "#3b5998",
  blue: "#3b5998",
  verde: "#3d5a3d",
  green: "#3d5a3d",
  rojo: "#a14b2e",
  red: "#a14b2e",
};

export function colorOf(name: string): string {
  return colorHexMap[name.toLowerCase()] ?? "#bbb";
}
