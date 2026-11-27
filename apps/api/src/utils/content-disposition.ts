function encodeRfc5987Value(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

/** Builds an inline Content-Disposition header with a safe ASCII fallback. */
export function inlineContentDisposition(filename: string): string {
  const normalized = filename
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]/g, '_')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/[. ]+$/g, '')
    .trim();

  const safeFilename = Array.from(normalized).slice(0, 180).join('') || 'document.pdf';
  const asciiFallback = Array.from(safeFilename, (character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint >= 0x20 && codePoint <= 0x7e ? character : '_';
  }).join('');

  return `inline; filename="${asciiFallback}"; filename*=UTF-8''${encodeRfc5987Value(safeFilename)}`;
}
