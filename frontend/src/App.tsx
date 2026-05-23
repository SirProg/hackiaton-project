import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import ChatPage from './pages/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal: Muestra la Landing Page */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Ruta del chat: Muestra el asistente Baymax */}
        <Route path="/chat" element={<ChatPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;