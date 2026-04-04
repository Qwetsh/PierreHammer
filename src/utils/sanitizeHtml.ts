const ALLOWED_TAGS = new Set([
  'b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'ol', 'li', 'span', 'sub', 'sup',
])

/**
 * Strip all HTML tags except a safe allowlist.
 * Removes all attributes (event handlers, href, etc.) from allowed tags.
 */
export function sanitizeHtml(html: string): string {
  return html.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, tag: string) => {
    const lower = tag.toLowerCase()
    if (ALLOWED_TAGS.has(lower)) {
      // Keep the tag but strip all attributes
      if (match.startsWith('</')) return `</${lower}>`
      if (match.endsWith('/>')) return `<${lower} />`
      return `<${lower}>`
    }
    return ''
  })
}
