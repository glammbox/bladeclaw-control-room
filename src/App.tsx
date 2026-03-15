import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import ControlRoomShell from './components/ControlRoomShell'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <ControlRoomShell>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </AnimatePresence>
      </ControlRoomShell>
    </BrowserRouter>
  )
}
