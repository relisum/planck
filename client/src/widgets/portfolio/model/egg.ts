// Пиксельный шрифт 5×5 для пасхалки в календаре вкладов
const GLYPHS: Record<string, string[]> = {
  H: ['X...X', 'X...X', 'XXXXX', 'X...X', 'X...X'],
  I: ['XXX', '.X.', '.X.', '.X.', 'XXX'],
  R: ['XXXX.', 'X...X', 'XXXX.', 'X..X.', 'X...X'],
  E: ['XXXXX', 'X....', 'XXXX.', 'X....', 'XXXXX'],
  M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X'],
  ' ': ['..', '..', '..', '..', '..'],
}

/**
 * Уровни 0–4 для сетки weeks × 7 с текстом по центру.
 * Возвращает функцию (неделя, день) → уровень
 */
export function buildEggPattern(text: string, weeks: number) {
  const columns: string[][] = []
  for (const char of text) {
    const glyph = GLYPHS[char] ?? GLYPHS[' ']
    for (let x = 0; x < glyph[0].length; x++) columns.push(glyph.map(row => row[x]))
    columns.push(['.', '.', '.', '.', '.'])
  }
  columns.pop()

  const offset = Math.max(0, Math.floor((weeks - columns.length) / 2))
  return (week: number, day: number) => {
    const column = columns[week - offset]
    // Буквы занимают дни 1–5, по краям — пустые ряды
    if (!column || day < 1 || day > 5) return 0
    return column[day - 1] === 'X' ? 4 : 0
  }
}
