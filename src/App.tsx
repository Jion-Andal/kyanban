import { Suspense, lazy } from 'react';
import { LoginPage } from './components/LoginPage';
import { useAuth } from './hooks/useAuth';
import './App.css';

const AuthenticatedApp = lazy(() =>
  import('./AuthenticatedApp').then((module) => ({ default: module.AuthenticatedApp })),
);

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-loading">
        <p>Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Suspense
      fallback={
        <div className="auth-loading">
          <p>Loading…</p>
        </div>
      }
    >
      <AuthenticatedApp user={user} />
    </Suspense>
  );
}

export default App;
