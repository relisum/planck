interface RebalanceIfNeededProps {
  reordered: { id: string; order: number }[]
  toIndex: number
  moved: { id: string; order: number }
  updateFn: (id: string, order: number) => Promise<void>
}

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

export async function rebalanceIfNeeded({reordered, toIndex, moved, updateFn}: RebalanceIfNeededProps): Promise<{ order: number; rebalanced: boolean }> {
  const prev = reordered[toIndex - 1]
  const next = reordered[toIndex + 1]

  const gap = prev && next
    ? next.order - prev.order
    : prev
      ? Infinity
      : next
        ? next.order
        : Infinity

  const newOrder = calculateOrder(prev, next)

  if (gap < 1) {
    reordered.splice(toIndex, 1, { ...moved, order: newOrder })
    await rebalance(reordered, updateFn)
    const finalOrder = (toIndex + 1) * 1000
    return { order: finalOrder, rebalanced: true }
  }

  return { order: newOrder, rebalanced: false }
}