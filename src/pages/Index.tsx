import { useState, useEffect } from 'react';
import LoginPage from '@/components/police/LoginPage';
import Dashboard from '@/components/police/Dashboard';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    role: string;
    fullName: string;
    badgeNumber: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('policeSession');
    if (sessionData) {
      try {
        const { user, expiresAt } = JSON.parse(sessionData);
        if (Date.now() < expiresAt) {
          setCurrentUser(user);
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('policeSession');
        }
      } catch (error) {
        localStorage.removeItem('policeSession');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('policeSession');
    localStorage.removeItem('policeActiveTab');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="font-mono text-muted-foreground">ЗАГРУЗКА...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard user={currentUser!} onLogout={handleLogout} />;
};

export default Index;