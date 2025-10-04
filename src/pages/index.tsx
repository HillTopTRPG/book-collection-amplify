import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BookPage from './BookPage';
import CollectionPage from './CollectionPage';
import FilterSetEditPage from './FilterSetEditPage';
import Home from './Home';
import MainLayout from './MainLayout';
import ScanPage from './ScanPage';

export default function Pages() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/book/:maybeIsbn" element={<BookPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/search/:filterSetId" element={<FilterSetEditPage />} />
          <Route path="/collection" element={<CollectionPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
