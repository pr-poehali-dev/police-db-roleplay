import Dashboard from '@/components/police/Dashboard';

const Index = () => {
  const defaultUser = {
    id: 1,
    username: 'admin',
    role: 'admin',
    fullName: 'Администратор',
    badgeNumber: 'ADMIN-001'
  };

  const handleLogout = () => {
    localStorage.removeItem('policeActiveTab');
  };

  return <Dashboard user={defaultUser} onLogout={handleLogout} />;
};

export default Index;