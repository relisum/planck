import {z} from "zod";


export const CreateSubTaskSchema = z.object({
  content: z.string().default(''),
})

