import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdvisorView } from './pages/AdvisorView';
import { ToastProvider } from './context/ToastContext';
import './index.css'

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/advisor/:token" element={<AdvisorView />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
