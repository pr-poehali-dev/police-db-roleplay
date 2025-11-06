import { useState } from 'react';
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

  const handleLogin = (user: any) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <Dashboard user={currentUser!} onLogout={handleLogout} />;
};

export default Index;