import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import LoginPage from './pages/Auth/LoginPage';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <BrowserRouter>
      <Routes>
        {/** login page */}
        <Route path="/login" element={<LoginPage/>} />

        {/** main page */}
        <Route path="/" element={
          <Link to="/login">login</Link>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
