import type {Column} from "@/entities/column";

export type BoardRole = 'owner' | 'member'

export interface BoardMember {
    id: string
    username: string
    displayName: string
    role: BoardRole
    joinedAt: Date
}

export interface Board {
    id: string
    title: string
    color: string
    order: number
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
    role: BoardRole
    _count: {
        tasks: number
        members: number
    }
    columns: Column[] | null
    members?: BoardMember[]
}
