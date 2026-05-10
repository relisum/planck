import {useQuery} from "react-query";
import type {Task} from "@/app/types/types.ts";
// import {fetchTasks} from "@/shared/api/api.ts";
import {fetchTasksMock} from "@/mocks/tasks.ts";


export function useTasksQuery() {
  return useQuery<Task[], Error>({
    queryKey: ['tasks'],
    queryFn: fetchTasksMock,
  })
}