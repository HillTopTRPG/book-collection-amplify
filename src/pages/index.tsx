import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import BookPage from './BookPage/BookPage';
import CollectionPage from './CollectionPage/CollectionPage';
import FilterSetEditPage from './FilterSetEditPage/FilterSetEditPage';
import Home from './Home/Home';
import MainLayout from './MainLayout/MainLayout';
import ScanPage from './ScanPage/ScanPage';

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
