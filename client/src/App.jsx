import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import AuthPage from './components/AuthPage.jsx';
import SearchPage from './components/SearchPage.jsx';
import SubmitPage from './components/SubmitPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import LeaderboardPage from './components/LeaderboardPage.jsx';
import AdminPage from './components/AdminPage.jsx';
import MerchantDetailsPage from './components/MerchantDetailsPage.jsx';
import PointsHistoryPage from './components/PointsHistoryPage.jsx';
import DescriptorDetailsPage from './components/DescriptorDetailsPage.jsx';
import CasePage from './components/CasePage.jsx';
import Nav from './components/Nav.jsx';

function Router() {
  const { isAuthenticated, loading, user } = useAuth();
  const [page, setPage]           = useState('search');
  const [pageState, setPageState] = useState({});
  const [history, setHistory]     = useState([]);

  if (loading) return <div style={{ color: 'var(--text)', padding: '2rem' }}>Loading…</div>;

  if (page === 'login' || page === 'register') {
    return <AuthPage onAuth={() => setPage('search')} />;
  }

  const navigate = (p, state = {}) => {
    if (p === -1) {
      const prev = history[history.length - 1];
      if (prev) {
        setHistory(h => h.slice(0, -1));
        setPage(prev.page);
        setPageState(prev.state);
      } else {
        setPage('search');
        setPageState({});
      }
      return;
    }
    setHistory(h => [...h, { page, state: pageState }]);
    setPage(p);
    setPageState(state);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-page)', color: 'var(--text)', display: 'flex', flexDirection: 'column' }}>
      <Nav page={page} navigate={navigate} isAuthenticated={isAuthenticated} user={user} onPointsClick={() => navigate('points')} />
      <main className="app-main">
        {page === 'search'      && <SearchPage navigate={navigate} />}
        {page === 'submit'      && (isAuthenticated ? <SubmitPage navigate={navigate} initialDescriptor={pageState.descriptor ?? ''} /> : <AuthPage onAuth={() => setPage('submit')} />)}
        {page === 'profile'     && (isAuthenticated ? <ProfilePage /> : <AuthPage onAuth={() => setPage('profile')} />)}
        {page === 'merchant'    && <MerchantDetailsPage merchant={pageState.merchant} navigate={navigate} />}
        {page === 'descriptor'  && <DescriptorDetailsPage descriptor={pageState.descriptor} descriptorId={pageState.descriptorId} navigate={navigate} />}
        {page === 'points'      && <PointsHistoryPage totalPoints={user?.total_points} />}
        {page === 'leaderboard' && <LeaderboardPage />}
        {page === 'case'        && <CasePage caseData={pageState.caseData} navigate={navigate} />}
        {page === 'admin'       && user?.role === 'admin' && <AdminPage />}
      </main>
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.25rem 1.5rem', textAlign: 'center', fontSize: '.65rem', color: 'var(--text-dim)', fontFamily: 'var(--font-ui)', letterSpacing: '.08em' }}>
        ChargeInspector v{__APP_VERSION__} · {__GIT_COMMIT__}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
