import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import Navbar from './components/layout/Navbar';
import HostedListingsPage from './pages/Host/HostedListingsPage';
import CreateListingPage from './pages/Host/CreateListingPage';

function App() {
  const [count, setCount] = useState(0);
  
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/** login page */}
        <Route path="/login" element={<LoginPage/>} />
        {/** register page */}
        <Route path="/register" element={<RegisterPage />} />
        {/** hostedlistings page */}
        <Route path="/host/listings" element={<HostedListingsPage />} />
        {/** create Listing page */}
        <Route path="/host/listings/new" element={<CreateListingPage />} />
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
