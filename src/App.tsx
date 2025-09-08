import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import HomePage from './pages/HomePage'
import ScannerPage from './pages/ScannerPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/scanner" element={<ScannerPage />} />
        <Route path="/collection" element={<div className="p-8 text-center">コレクション一覧は準備中です</div>} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
