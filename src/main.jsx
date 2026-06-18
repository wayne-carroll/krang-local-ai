import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import StartupGate from './components/StartupGate.jsx'
import 'katex/dist/katex.min.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StartupGate>
      <App />
    </StartupGate>
  </React.StrictMode>
)
