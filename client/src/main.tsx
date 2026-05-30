import { createRoot } from 'react-dom/client'
import {App} from './App.tsx'
import '@/app/styles/style.sass'
import {queryClient} from "@/shared/api/apiClient.ts";
import {QueryClientProvider} from "react-query";


createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
