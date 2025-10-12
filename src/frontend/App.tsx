import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import Dashboard from './pages/Dashboard'
import AdHocPage from './pages/AdHocPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/ad-hoc" element={<AdHocPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
