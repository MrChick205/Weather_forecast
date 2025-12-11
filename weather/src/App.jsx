// import './App.css'
import { Routes, Route } from 'react-router-dom'
import WeatherDashboard from './pages/Weather.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<WeatherDashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
