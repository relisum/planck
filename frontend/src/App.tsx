import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Tasks } from "@/pages/Tasks/Tasks.tsx";


export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Tasks />} />
      </Routes>
    </BrowserRouter>
  )
}