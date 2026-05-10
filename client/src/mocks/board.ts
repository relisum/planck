import type {Board} from "@/entities/board";

export const INITIAL_BOARDS: Board[] = [
    { id: '1', title: 'Разработка',     color: '#378ADD', taskCount: 12 },
    { id: '2', title: 'Дизайн',         color: '#D4537E', taskCount: 5  },
    { id: '3', title: 'Маркетинг',      color: '#1D9E75', taskCount: 8  },
    { id: '4', title: 'Инфраструктура', color: '#EF9F27', taskCount: 3  },
    { id: '5', title: 'Аналитика',      color: '#7F77DD', taskCount: 7  },
]