import './App.css'
import { Routes, Route, Link } from 'react-router-dom'
import Teacher from './pages/Teacher'
import Landing from './pages/Landing'
import Student from './pages/Student'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="/student" element={<Student />} />
      </Routes>
    </div>
  )
}

export default App
