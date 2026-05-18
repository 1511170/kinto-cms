/**
 * Sanitización mínima de HTML proveniente de Shopify (descripcion de producto).
 * Confiamos en la fuente, pero limitamos tags peligrosos y atributos event-handler.
 *
 * Allowlist: p, h2-h4, ul, ol, li, strong, em, a, img, table, thead, tbody, tr, td, th, br, hr, blockquote, code, pre, span, div.
 */

const ALLOWED_TAGS = new Set([
  "p",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "s",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "br",
  "hr",
  "blockquote",
  "code",
  "pre",
  "span",
  "div",
]);

const ALLOWED_ATTRS = new Set([
  "href",
  "title",
  "alt",
  "src",
  "width",
  "height",
  "target",
  "rel",
  "colspan",
  "rowspan",
]);

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";

  // 1. Strip <script>, <style>, <iframe>, <object>, <embed>, <form>, <input>, <link>, <meta>.
  let cleaned = html.replace(
    /<\/?(script|style|iframe|object|embed|form|input|link|meta|noscript)\b[^>]*>/gi,
    "",
  );

  // 2. Strip event handlers (on*) y javascript: en hrefs.
  cleaned = cleaned.replace(/\son\w+\s*=\s*"[^"]*"/gi, "");
  cleaned = cleaned.replace(/\son\w+\s*=\s*'[^']*'/gi, "");
  cleaned = cleaned.replace(/\son\w+\s*=\s*[^\s>]+/gi, "");
  cleaned = cleaned.replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"');
  cleaned = cleaned.replace(/href\s*=\s*'javascript:[^']*'/gi, "href='#'");

  // 3. Strip tags no permitidos (mantiene contenido textual).
  cleaned = cleaned.replace(
    /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (full, slash, tag, rest) => {
      const lower = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lower)) return "";

      if (slash) return `</${lower}>`;

      // Filtrar atributos al allowlist.
      const filteredAttrs = (rest as string).replace(
        /\s+([a-zA-Z][a-zA-Z0-9-]*)\s*(?:=\s*("[^"]*"|'[^']*'|[^\s>]+))?/g,
        (_attr, name, value) => {
          if (!ALLOWED_ATTRS.has(name.toLowerCase())) return "";
          return value ? ` ${name}=${value}` : ` ${name}`;
        },
      );

      return `<${lower}${filteredAttrs}>`;
    },
  );

  return cleaned;
}
