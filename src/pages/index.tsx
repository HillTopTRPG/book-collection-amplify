import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScannedBookPage from '@/pages/ScannedBookPage';
import CollectionPage from './CollectionPage';
import Home from './Home';
import MainLayout from './MainLayout';
import ScannerPage from './ScannerPage';

export default function Pages() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/scan/:maybeIsbn" element={<ScannedBookPage />} />
          <Route path="/scan" element={<ScannerPage />} />
          <Route path="/collection" element={<CollectionPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
