export function calculateOrder(
  prev: { order: number } | undefined,
  next: { order: number } | undefined
): number {
  if (!prev && !next) return 1000  // ← пустая колонка
  if (!prev) return next!.order / 2
  if (!next) return prev.order + 1000
  return (prev.order + next.order) / 2
}

export async function rebalance(items: { id: string }[], updateFn: (id: string, order: number) => Promise<void>) {
  await Promise.all(
    items.map((item, i) => updateFn(item.id, (i + 1) * 1000))
  )
}