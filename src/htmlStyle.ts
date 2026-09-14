/**
 * Style vocabulary of the documents — mirror of
 * `backend/src/services/htmlStyle.ts` (the server sanitizer is the authority;
 * this file is what the editor menu and the HTML source view use).
 *
 * Looks are chosen from a CLOSED set of tokens written as `data-*` attributes,
 * never `style=""`: the reader CSS turns each token into the app's own spacing,
 * palette and fonts, so a document can't drift from the design system, can't
 * break on a small screen, and follows a future redesign for free.
 */

export const ALIGNS = ["left", "center", "right"] as const;
export const SIZES = ["sm", "lg", "xl"] as const;
export const SPACES = ["none", "sm", "lg", "xl"] as const;
export const COLORS = ["forest", "pine", "sun", "red", "muted", "sky"] as const;
export const TONES = ["sand", "sage", "sky", "sun", "red", "forest"] as const;
export const FONTS = ["display", "body"] as const;
/** list tightness — only meaningful on ul/ol */
export const DENSITIES = ["tight", "airy"] as const;

export type Align = (typeof ALIGNS)[number];
export type Size = (typeof SIZES)[number];
export type Space = (typeof SPACES)[number];
export type Color = (typeof COLORS)[number];
export type Tone = (typeof TONES)[number];
export type Font = (typeof FONTS)[number];
export type Density = (typeof DENSITIES)[number];

export const STYLE_TOKENS = {
  "data-align": ALIGNS,
  "data-size": SIZES,
  "data-space": SPACES,
  "data-color": COLORS,
  "data-tone": TONES,
  "data-font": FONTS,
  "data-density": DENSITIES,
} as const;

export type StyleAttr = keyof typeof STYLE_TOKENS;

export const STYLE_ATTRS = Object.keys(STYLE_TOKENS) as StyleAttr[];

/** tags that may carry style tokens (must match the server list) */
export const STYLEABLE_TAGS = ["p", "h2", "h3", "blockquote", "figure", "figcaption", "table", "ul", "ol", "div", "mark", "strong", "em", "hr", "img"] as const;

/** What each token does, for the editor's menu. */
export const STYLE_LABELS: Record<StyleAttr, { label: string; hint: string; options: { value: string; label: string }[] }> = {
  "data-align": {
    label: "Alinhamento",
    hint: "Centralize capas e legendas; texto corrido fica melhor à esquerda.",
    options: [
      { value: "left", label: "Esquerda" },
      { value: "center", label: "Centro" },
      { value: "right", label: "Direita" },
    ],
  },
  "data-size": {
    label: "Tamanho",
    hint: "Relativo ao texto do app — acompanha o ajuste de fonte do celular.",
    options: [
      { value: "sm", label: "Pequeno" },
      { value: "lg", label: "Grande" },
      { value: "xl", label: "Capa" },
    ],
  },
  "data-space": {
    label: "Espaçamento",
    hint: "Espaço acima e abaixo do bloco.",
    options: [
      { value: "none", label: "Colado" },
      { value: "sm", label: "Pouco" },
      { value: "lg", label: "Muito" },
      { value: "xl", label: "Separar seção" },
    ],
  },
  "data-color": {
    label: "Cor do texto",
    hint: "Só a paleta do app. Não use a cor como único aviso: some com <strong>.",
    options: [
      { value: "forest", label: "Verde escuro" },
      { value: "pine", label: "Verde" },
      { value: "sun", label: "Laranja" },
      { value: "red", label: "Vermelho" },
      { value: "muted", label: "Cinza" },
      { value: "sky", label: "Azul" },
    ],
  },
  "data-tone": {
    label: "Fundo",
    hint: "Faixa colorida atrás do bloco. Boa para avisos curtos e capas.",
    options: [
      { value: "sand", label: "Areia" },
      { value: "sage", label: "Verde claro" },
      { value: "sky", label: "Azul claro" },
      { value: "sun", label: "Amarelo" },
      { value: "red", label: "Vermelho" },
      { value: "forest", label: "Verde escuro" },
    ],
  },
  "data-font": {
    label: "Fonte",
    hint: "Display é a fonte dos títulos; corpo é a de leitura.",
    options: [
      { value: "display", label: "Título" },
      { value: "body", label: "Corpo" },
    ],
  },
  "data-density": {
    label: "Lista",
    hint: "Só em listas: aperta ou separa os itens.",
    options: [
      { value: "tight", label: "Compacta" },
      { value: "airy", label: "Espaçada" },
    ],
  },
};

export function isStyleToken(name: string, value: string): boolean {
  const allowed = STYLE_TOKENS[name as StyleAttr] as readonly string[] | undefined;
  return !!allowed && allowed.includes(value);
}
