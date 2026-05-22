import {boardApi} from "@/entities/board";


export const useSidebar = () => {
  const { data } = boardApi.useGetAll()
  const boards = data ?? []

  return {
    boards: boards.sort((a, b) => a.order - b.order),
  }
}