import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SideBar from './components/side-bar';
import AssetsPage from './pages/assets-page';
import CategoriesPage from './pages/categories-page';
import DashboardPage from './pages/dashboard-page';
import LedgerPage from './pages/ledger-page';
import LiabilitiesPage from './pages/liabilities-page';
import MortgageDetailPage from './pages/mortgage-detail-page';
import NetWorthPage from './pages/net-worth-page';
import TemplatesPage from './pages/templates-page';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <SideBar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/ledger" element={<LedgerPage />} />
            <Route path="/templates" element={<TemplatesPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/liabilities" element={<LiabilitiesPage />} />
            <Route path="/liabilities/mortgages/:uid" element={<MortgageDetailPage />} />
            <Route path="/net-worth" element={<NetWorthPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
