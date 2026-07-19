const CONTROL_CHARS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};
const HTML_PATTERN = /[&<>"']/g;

export function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS, "");
}

export function escapeHtml(input: string): string {
  return input.replace(HTML_PATTERN, (char) => HTML_ENTITIES[char] || char);
}

export function sanitizeInput(input: string, maxLength = 500): string {
  return stripControlChars(input).trim().slice(0, maxLength);
}
