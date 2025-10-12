import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { Navigation } from './components/Navigation'
import Dashboard from './pages/Dashboard'
import AdHocPage from './pages/AdHocPage'

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <BrowserRouter>
      <div className="min-h-screen flex">
        <Navigation sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
        <main className={`flex-1 overflow-hidden transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64 lg:ml-72'}
          ml-0
        `}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ad-hoc" element={<AdHocPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
