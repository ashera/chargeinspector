import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import AuthPage from './components/AuthPage.jsx';
import SearchPage from './components/SearchPage.jsx';
import SubmitPage from './components/SubmitPage.jsx';
import ProfilePage from './components/ProfilePage.jsx';
import LeaderboardPage from './components/LeaderboardPage.jsx';
import AdminPage from './components/AdminPage.jsx';
import Nav from './components/Nav.jsx';

function Router() {
  const { isAuthenticated, loading, user } = useAuth();
  const [page, setPage] = useState('search');

  if (loading) return <div style={{ color: '#f0ede6', padding: '2rem' }}>Loading…</div>;

  if (page === 'login' || page === 'register') {
    return <AuthPage onAuth={() => setPage('search')} />;
  }

  const navigate = (p) => setPage(p);

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0a0a', color: '#f0ede6' }}>
      <Nav page={page} navigate={navigate} isAuthenticated={isAuthenticated} user={user} />
      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {page === 'search'      && <SearchPage navigate={navigate} />}
        {page === 'submit'      && (isAuthenticated ? <SubmitPage navigate={navigate} /> : <AuthPage onAuth={() => setPage('submit')} />)}
        {page === 'profile'     && (isAuthenticated ? <ProfilePage /> : <AuthPage onAuth={() => setPage('profile')} />)}
        {page === 'leaderboard' && <LeaderboardPage />}
        {page === 'admin'       && user?.role === 'admin' && <AdminPage />}
      </main>
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
