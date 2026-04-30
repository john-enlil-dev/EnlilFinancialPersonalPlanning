import { BrowserRouter, Route, Routes } from 'react-router-dom';
import NavBar from './components/nav-bar';
import CategoriesPage from './pages/categories-page';
import DashboardPage from './pages/dashboard-page';
import LedgerPage from './pages/ledger-page';
import TemplatesPage from './pages/templates-page';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
