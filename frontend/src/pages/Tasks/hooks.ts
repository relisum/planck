import {useQuery} from "react-query";
import type {Task} from "@/app/types/types.ts";
import {fetchTasks} from "@/shared/api/api.ts";


export function useTasksQuery() {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: fetchTasks,
  })
}