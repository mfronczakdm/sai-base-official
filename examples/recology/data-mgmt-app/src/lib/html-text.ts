/** Helpers so Marketplace editors work in plain text, not raw HTML markup. */

export function decodeHtmlEntities(value: string): string {
  if (!value) return "";
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/** Convert stored rich text / HTML into readable plain text for editors. */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  let value = decodeHtmlEntities(html);
  value = value
    .replace(/\r\n/g, "\n")
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*p\s*>/gi, "\n\n")
    .replace(/<\/\s*div\s*>/gi, "\n")
    .replace(/<\/\s*li\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return value;
}

/** Persist plain text back as simple HTML Sitecore rich text can store. */
export function plainTextToHtml(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  // Allow intentional HTML from advanced authors
  if (/<[a-z][\s\S]*>/i.test(trimmed)) return trimmed;
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => {
      const withBreaks = paragraph
        .split("\n")
        .map((line) => escapeXml(line))
        .join("<br />");
      return `<p>${withBreaks}</p>`;
    })
    .join("");
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
