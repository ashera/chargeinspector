import { AuthProvider } from './hooks/useAuth';
import AuthPage from './components/AuthPage';

export default function App() {
  return (
    <AuthProvider>
      <AuthPage />
    </AuthProvider>
  );
}
