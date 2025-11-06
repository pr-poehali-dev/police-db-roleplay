import { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('citizens');

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
