declare module 'opentype.js' {
  interface GlyphIndexMap {
    [codePoint: string]: number;
  }

  interface CmapTable {
    glyphIndexMap: GlyphIndexMap;
  }

  interface Font {
    unitsPerEm: number;
    ascender: number;
    descender: number;
    tables: {
      cmap: CmapTable;
    };
    charToGlyph(char: string): unknown;
  }

  function loadSync(path: string): Font;

  export { loadSync };
  export default { loadSync };
}
