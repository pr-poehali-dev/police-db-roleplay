import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import CitizensTab from './CitizensTab';
import PatrolTab from './PatrolTab';
import VehiclesTab from './VehiclesTab';

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
  const [wantedList, setWantedList] = useState<any[]>([]);
  const [citizenIdToOpen, setCitizenIdToOpen] = useState<number | null>(null);

  const handleOpenCitizen = (citizenId: number) => {
    setCitizenIdToOpen(citizenId);
    setActiveTab('citizens');
  };

  useEffect(() => {
    localStorage.setItem('policeActiveTab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              SELECT 
                (SELECT COUNT(DISTINCT citizen_id) FROM wanted_list WHERE is_active = true) as wanted_citizens,
                (SELECT COUNT(*) FROM patrol_units WHERE is_active = true AND status != 'unavailable') as active_patrols,
                (SELECT COUNT(*) FROM fines WHERE is_active = true AND status = 'unpaid') as unpaid_fines
            `
          })
        });

        const data = await response.json();
        const row = data.rows?.[0];

        if (row) {
          setStats({
            wantedCitizens: row.wanted_citizens || 0,
            activePatrols: row.active_patrols || 0,
            unpaidFines: row.unpaid_fines || 0
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats');
      }
    };

    const fetchWantedList = async () => {
      try {
        const response = await fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT w.id, w.reason, w.added_at, c.id as citizen_id, c.first_name, c.last_name, c.date_of_birth
                    FROM wanted_list w
                    JOIN citizens c ON w.citizen_id = c.id
                    WHERE w.is_active = true
                    ORDER BY w.added_at DESC
                    LIMIT 10`
          })
        });
        const data = await response.json();
        setWantedList(data.rows || []);
      } catch (error) {
        console.error('Failed to fetch wanted list');
      }
    };

    fetchStats();
    fetchWantedList();
    const statsInterval = setInterval(fetchStats, 30000);
    const wantedInterval = setInterval(fetchWantedList, 30000);
    
    return () => {
      clearInterval(statsInterval);
      clearInterval(wantedInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b-2 border-border bg-gradient-to-r from-blue-950 to-slate-900">
        <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-sm flex items-center justify-center shadow-lg">
              <Icon name="Shield" className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-mono font-bold tracking-tight text-white">
                ПОЛИЦЕЙСКАЯ БД
              </h1>
              <p className="text-xs text-blue-200 font-mono">
                ROLEPLAY SERVER v1.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="text-right flex-1 md:flex-none">
              <p className="text-xs md:text-sm font-mono font-medium text-white">{user.fullName}</p>
              <p className="text-xs text-blue-200 font-mono">
                {user.badgeNumber} | {user.role.toUpperCase()}
              </p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={onLogout}
              className="font-mono text-xs md:text-sm"
            >
              <Icon name="LogOut" className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              ВЫХОД
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-md p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-sm flex items-center justify-center shadow-md">
                <Icon name="Car" className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-green-900">{stats.activePatrols}</p>
                <p className="text-xs text-green-700 font-mono font-medium">АКТИВНЫХ ПАТРУЛЕЙ</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-md p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-sm flex items-center justify-center shadow-md">
                <Icon name="AlertTriangle" className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-red-900">{stats.wantedCitizens}</p>
                <p className="text-xs text-red-700 font-mono font-medium">ГРАЖДАН В РОЗЫСКЕ</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-md p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-sm flex items-center justify-center shadow-md">
                <Icon name="AlertCircle" className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-orange-900">{stats.unpaidFines}</p>
                <p className="text-xs text-orange-700 font-mono font-medium">НЕОПЛАЧЕННЫХ ШТРАФОВ</p>
              </div>
            </div>
          </div>
        </div>

        {wantedList.length > 0 && (
          <Card className="border-2 border-red-200 bg-red-50 mb-6 shadow-sm">
            <CardHeader className="bg-gradient-to-r from-red-100 to-red-50 border-b-2 border-red-200">
              <CardTitle className="font-mono text-lg text-red-900 flex items-center gap-2">
                <Icon name="AlertTriangle" className="w-5 h-5 text-red-600" />
                АКТУАЛЬНЫЙ РОЗЫСК
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {wantedList.map((wanted) => (
                  <div
                    key={wanted.id}
                    className="bg-white border-2 border-red-200 rounded-md p-3 flex flex-col md:flex-row items-start md:items-center justify-between hover:bg-red-50 transition-colors cursor-pointer gap-3"
                    onClick={() => handleOpenCitizen(wanted.citizen_id)}
                  >
                    <div className="flex items-center gap-3 flex-1 w-full">
                      <Badge variant="destructive" className="font-mono font-bold text-xs">
                        РОЗЫСК
                      </Badge>
                      <div className="flex-1">
                        <p className="font-mono font-bold text-xs md:text-sm">
                          {wanted.first_name} {wanted.last_name}
                        </p>
                        <p className="font-mono text-xs text-muted-foreground">
                          ID: {wanted.citizen_id} | ДР: {wanted.date_of_birth}
                        </p>
                      </div>
                    </div>
                    <div className="flex-1 w-full md:px-4">
                      <p className="font-mono text-xs md:text-sm text-red-800">{wanted.reason}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {new Date(wanted.added_at).toLocaleString('ru-RU')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 h-auto md:h-12 bg-gradient-to-r from-slate-100 to-slate-200 border-2">
            <TabsTrigger 
              value="citizens" 
              className="font-mono font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3"
            >
              <Icon name="Users" className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">ГРАЖДАНЕ</span>
            </TabsTrigger>
            <TabsTrigger 
              value="vehicles" 
              className="font-mono font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3"
            >
              <Icon name="Car" className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">ТРАНСПОРТ</span>
            </TabsTrigger>
            <TabsTrigger 
              value="patrol" 
              className="font-mono font-medium data-[state=active]:bg-blue-600 data-[state=active]:text-white py-3"
            >
              <Icon name="Radio" className="w-4 h-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">ПАТРУЛИ</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="citizens" className="space-y-4">
            <CitizensTab user={user} citizenIdToOpen={citizenIdToOpen} onCitizenOpened={() => setCitizenIdToOpen(null)} />
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            <VehiclesTab user={user} onOpenCitizen={handleOpenCitizen} />
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