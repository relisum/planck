import { useState, useMemo } from 'react'
import type { Board } from '@/entities/board'


export interface UseBoardSearchReturn {
    query: string
    setQuery: (value: string) => void
    filtered: Board[]
}

export function useBoardSearch(boards: Board[]): UseBoardSearchReturn {
    const [query, setQuery] = useState('')

    const filtered = useMemo(
        () =>
            boards.filter((b) =>
                b.title.toLowerCase().includes(query.toLowerCase())
            ),
        [boards, query]
    )

    return { query, setQuery, filtered }
}