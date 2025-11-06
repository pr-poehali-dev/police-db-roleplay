import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import CitizensTab from './CitizensTab';
import PatrolTab from './PatrolTab';

interface DashboardProps {
  user: {
    id: number;
    username: string;
    role: string;
    fullName: string;
    badgeNumber: string;
  };
  onLogout: () => void;
}

const Dashboard = ({ user, onLogout }: DashboardProps) => {
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('policeActiveTab');
    return savedTab || 'citizens';
  });
  const [stats, setStats] = useState({
    wantedCitizens: 0,
    activePatrols: 0,
    unpaidFines: 0
  });

  useEffect(() => {
    localStorage.setItem('policeActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [wantedRes, patrolsRes, finesRes] = await Promise.all([
          fetch('https://api.poehali.dev/v0/sql-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `SELECT COUNT(DISTINCT citizen_id) as count FROM wanted_list WHERE is_active = true`
            })
          }),
          fetch('https://api.poehali.dev/v0/sql-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `SELECT COUNT(*) as count FROM patrol_units WHERE is_active = true AND status != 'offline'`
            })
          }),
          fetch('https://api.poehali.dev/v0/sql-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: `SELECT COUNT(*) as count FROM fines WHERE is_active = true AND status = 'unpaid'`
            })
          })
        ]);

        const [wantedData, patrolsData, finesData] = await Promise.all([
          wantedRes.json(),
          patrolsRes.json(),
          finesRes.json()
        ]);

        setStats({
          wantedCitizens: wantedData.rows?.[0]?.count || 0,
          activePatrols: patrolsData.rows?.[0]?.count || 0,
          unpaidFines: finesData.rows?.[0]?.count || 0
        });
      } catch (error) {
        console.error('Failed to fetch stats');
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
              <Icon name="Shield" className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-mono font-bold tracking-tight">
                ПОЛИЦЕЙСКАЯ БД
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                ROLEPLAY SERVER v1.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-mono font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {user.badgeNumber} | {user.role.toUpperCase()}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="font-mono"
            >
              <Icon name="LogOut" className="w-4 h-4 mr-2" />
              ВЫХОД
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-card border-2 border-border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-sm flex items-center justify-center">
                <Icon name="AlertTriangle" className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">{stats.wantedCitizens}</p>
                <p className="text-xs text-muted-foreground font-mono">ГРАЖДАН В РОЗЫСКЕ</p>
              </div>
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-sm flex items-center justify-center">
                <Icon name="Car" className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">{stats.activePatrols}</p>
                <p className="text-xs text-muted-foreground font-mono">АКТИВНЫХ ПАТРУЛЕЙ</p>
              </div>
            </div>
          </div>

          <div className="bg-card border-2 border-border rounded-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-sm flex items-center justify-center">
                <Icon name="AlertCircle" className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold">{stats.unpaidFines}</p>
                <p className="text-xs text-muted-foreground font-mono">НЕОПЛАЧЕННЫХ ШТРАФОВ</p>
              </div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 h-12 bg-muted">
            <TabsTrigger 
              value="citizens" 
              className="font-mono font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon name="Users" className="w-4 h-4 mr-2" />
              ГРАЖДАНЕ
            </TabsTrigger>
            <TabsTrigger 
              value="patrol" 
              className="font-mono font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Icon name="Car" className="w-4 h-4 mr-2" />
              ПАТРУЛИ
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizens" className="space-y-4">
            <CitizensTab user={user} />
          </TabsContent>

          <TabsContent value="patrol" className="space-y-4">
            <PatrolTab user={user} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;