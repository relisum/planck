import {useQuery} from "react-query";
import {api} from "@/shared/api/apiClient.ts";


export function useGetBoards() {
  return useQuery({
    queryKey: ["boards"],
    queryFn: () => api('/api/boards')
  })
}