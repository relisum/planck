import { createRoot } from 'react-dom/client'
import {App} from './App.tsx'
import {queryClient} from "@/shared/api/apiClient.ts"
import {QueryClientProvider} from "react-query"
import './i18n'


createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
)
