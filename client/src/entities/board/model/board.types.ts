export interface Board {
    id: string
    title: string
    color: string
    order: number
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    _count: {
        tasks: number
    }
}