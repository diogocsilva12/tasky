import { ThemeToggle } from './components/ThemeToggle';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AccessPendingPage } from './components/auth/AccessPendingPage';
import { AdminPage } from './pages/AdminPage';

function AppContent() {
  const { authState } = useAuth();

  if (authState === 'loading') {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }
  if (authState === 'unauthenticated') {
    return <LoginPage />;
  }
  if (authState === 'pending') {
    return <AccessPendingPage />;
  }
  if (authState === 'admin') {
    return (
      <div>
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <AdminPage />
      </div>
    );
  }

  // Approved member
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Tasky Board</h1>
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
