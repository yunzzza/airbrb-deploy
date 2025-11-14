import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import LoginPage from './pages/Auth/LoginPage';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <BrowserRouter>
      <Routes>
        {/** login page */}
        <Route path="/login" element={<LoginPage />} />

        {/** main page */}
        <Route path="/" element={
          <a href="/login">login</a>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
