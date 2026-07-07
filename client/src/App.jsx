import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

async function fetchHealth(){
  try{
    const response = await fetch('/api/health')
    if (!response.ok){
      throw new Error('Failed to fetch health')
    }
    const data = await response.json()
    console.log(data)
    return { ok: true, data }
  } catch (error) {
    console.error('Error fetching health:', error)
    return { ok: false, error: error.message }
  }
}
fetchHealth()


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </>
  )
}

export default App
