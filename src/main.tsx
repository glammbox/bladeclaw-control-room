import React from 'react'
import ReactDOM from 'react-dom/client'
import Lenis from 'lenis'
import App from './App'
import './index.css'

// Initialize Lenis smooth scroll
const lenis = new Lenis({
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  orientation: 'vertical',
  smoothWheel: true,
})

function raf(time: number) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

// Expose lenis globally for components that need it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(window as unknown as Record<string, unknown>)['_lenis'] = lenis

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
