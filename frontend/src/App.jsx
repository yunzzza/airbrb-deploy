import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import LoginPage from './pages/Auth/LoginPage';
import Navbar from './components/layout/Navbar';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/** login page */}
        <Route path="/login" element={<LoginPage/>} />

        {/** main page */}
        <Route path="/" element={
          <>
          </>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
