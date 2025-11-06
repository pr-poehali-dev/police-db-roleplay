import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  role: string;
}

const STATUS_COLORS = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  offline: 'bg-gray-500',
  emergency: 'bg-red-500'
};

const STATUS_LABELS = {
  available: 'ДОСТУПЕН',
  busy: 'ЗАНЯТ',
  offline: 'OFFLINE',
  emergency: 'ЭКСТРЕННЫЙ'
};

const PatrolTab = ({ user }: { user: User }) => {
  const [patrols, setPatrols] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [newPatrol, setNewPatrol] = useState({
    unitName: '',
    status: 'offline',
    locationName: '',
    latitude: '',
    longitude: '',
    officer1: '',
    officer2: '',
    vehicleNumber: ''
  });

  const canModify = user.role === 'admin' || user.role === 'moderator';

  const fetchPatrols = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT pu.*, 
                  u1.full_name as officer1_name, u1.badge_number as officer1_badge,
                  u2.full_name as officer2_name, u2.badge_number as officer2_badge
                  FROM patrol_units pu 
                  LEFT JOIN users u1 ON pu.officer_1 = u1.id
                  LEFT JOIN users u2 ON pu.officer_2 = u2.id
                  WHERE pu.is_active = true 
                  ORDER BY pu.id DESC`
        })
      });
      const data = await response.json();
      setPatrols(data.rows || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить патрули' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOfficers = async () => {
    try {
      const response = await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT id, full_name, badge_number FROM users WHERE role IN ('user', 'moderator') ORDER BY full_name`
        })
      });
      const data = await response.json();
      setOfficers(data.rows || []);
    } catch (error) {
      console.error('Failed to fetch officers');
    }
  };

  const handleAddPatrol = async () => {
    if (!canModify) return;
    
    try {
      const officer1Value = newPatrol.officer1 ? parseInt(newPatrol.officer1) : 'NULL';
      const officer2Value = newPatrol.officer2 ? parseInt(newPatrol.officer2) : 'NULL';
      const latValue = newPatrol.latitude ? parseFloat(newPatrol.latitude) : 'NULL';
      const lonValue = newPatrol.longitude ? parseFloat(newPatrol.longitude) : 'NULL';
      
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO patrol_units (unit_name, status, location_name, latitude, longitude, officer_1, officer_2, vehicle_number) 
                  VALUES ('${newPatrol.unitName}', '${newPatrol.status}', '${newPatrol.locationName}', ${latValue}, ${lonValue}, ${officer1Value}, ${officer2Value}, '${newPatrol.vehicleNumber}')`
        })
      });
      
      toast({ title: 'Успешно', description: 'Патруль создан' });
      setIsAddDialogOpen(false);
      setNewPatrol({ unitName: '', status: 'offline', locationName: '', latitude: '', longitude: '', officer1: '', officer2: '', vehicleNumber: '' });
      fetchPatrols();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось создать патруль' });
    }
  };

  const handleUpdateStatus = async (patrolId: number, newStatus: string) => {
    if (!canModify) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE patrol_units SET status = '${newStatus}', updated_at = CURRENT_TIMESTAMP WHERE id = ${patrolId}`
        })
      });
      
      toast({ title: 'Успешно', description: 'Статус обновлен' });
      fetchPatrols();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить статус' });
    }
  };

  const handleDeletePatrol = async (patrolId: number) => {
    if (!canModify) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE patrol_units SET is_active = false WHERE id = ${patrolId}`
        })
      });
      
      toast({ title: 'Успешно', description: 'Патруль удален' });
      fetchPatrols();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить патруль' });
    }
  };

  useEffect(() => {
    fetchPatrols();
    fetchOfficers();
  }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg">ПАТРУЛЬНЫЕ ЭКИПАЖИ</CardTitle>
            {canModify && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-mono">
                    <Icon name="Plus" className="w-4 h-4 mr-2" />
                    СОЗДАТЬ ЭКИПАЖ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-mono">СОЗДАТЬ ПАТРУЛЬНЫЙ ЭКИПАЖ</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ПОЗЫВНОЙ</Label>
                      <Input 
                        value={newPatrol.unitName}
                        onChange={(e) => setNewPatrol({ ...newPatrol, unitName: e.target.value })}
                        placeholder="Альфа-1"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">НОМЕР ТС</Label>
                      <Input 
                        value={newPatrol.vehicleNumber}
                        onChange={(e) => setNewPatrol({ ...newPatrol, vehicleNumber: e.target.value })}
                        placeholder="A777AA777"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs">ЛОКАЦИЯ</Label>
                      <Input 
                        value={newPatrol.locationName}
                        onChange={(e) => setNewPatrol({ ...newPatrol, locationName: e.target.value })}
                        placeholder="Центральный район"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ШИРОТА</Label>
                      <Input 
                        type="number"
                        step="0.000001"
                        value={newPatrol.latitude}
                        onChange={(e) => setNewPatrol({ ...newPatrol, latitude: e.target.value })}
                        placeholder="55.751244"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ДОЛГОТА</Label>
                      <Input 
                        type="number"
                        step="0.000001"
                        value={newPatrol.longitude}
                        onChange={(e) => setNewPatrol({ ...newPatrol, longitude: e.target.value })}
                        placeholder="37.618423"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ОФИЦЕР 1</Label>
                      <select 
                        value={newPatrol.officer1}
                        onChange={(e) => setNewPatrol({ ...newPatrol, officer1: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                      >
                        <option value="">Не выбран</option>
                        {officers.map(officer => (
                          <option key={officer.id} value={officer.id}>
                            {officer.full_name} ({officer.badge_number})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ОФИЦЕР 2</Label>
                      <select 
                        value={newPatrol.officer2}
                        onChange={(e) => setNewPatrol({ ...newPatrol, officer2: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                      >
                        <option value="">Не выбран</option>
                        {officers.map(officer => (
                          <option key={officer.id} value={officer.id}>
                            {officer.full_name} ({officer.badge_number})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">СТАТУС</Label>
                      <select 
                        value={newPatrol.status}
                        onChange={(e) => setNewPatrol({ ...newPatrol, status: e.target.value })}
                        className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                      >
                        <option value="offline">OFFLINE</option>
                        <option value="available">ДОСТУПЕН</option>
                        <option value="busy">ЗАНЯТ</option>
                        <option value="emergency">ЭКСТРЕННЫЙ</option>
                      </select>
                    </div>
                  </div>
                  <Button onClick={handleAddPatrol} className="w-full font-mono">
                    СОЗДАТЬ
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 font-mono text-muted-foreground">Загрузка...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patrols.map((patrol) => (
                <Card key={patrol.id} className="border-2">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-mono font-bold text-lg">{patrol.unit_name}</h3>
                          <p className="font-mono text-xs text-muted-foreground">{patrol.vehicle_number}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${STATUS_COLORS[patrol.status as keyof typeof STATUS_COLORS]}`} />
                          <Badge variant="outline" className="font-mono text-xs">
                            {STATUS_LABELS[patrol.status as keyof typeof STATUS_LABELS]}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Icon name="MapPin" className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            <p className="font-mono">{patrol.location_name}</p>
                            {patrol.latitude && patrol.longitude && (
                              <p className="font-mono text-xs text-muted-foreground">
                                {patrol.latitude}, {patrol.longitude}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Icon name="Users" className="w-4 h-4 mt-0.5 text-muted-foreground" />
                          <div>
                            {patrol.officer1_name && (
                              <p className="font-mono text-xs">
                                {patrol.officer1_name} ({patrol.officer1_badge})
                              </p>
                            )}
                            {patrol.officer2_name && (
                              <p className="font-mono text-xs">
                                {patrol.officer2_name} ({patrol.officer2_badge})
                              </p>
                            )}
                            {!patrol.officer1_name && !patrol.officer2_name && (
                              <p className="font-mono text-xs text-muted-foreground">Нет экипажа</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {canModify && (
                        <div className="flex gap-2 pt-2 border-t">
                          <select
                            value={patrol.status}
                            onChange={(e) => handleUpdateStatus(patrol.id, e.target.value)}
                            className="flex-1 border rounded-md px-2 py-1 font-mono text-xs"
                          >
                            <option value="offline">OFFLINE</option>
                            <option value="available">ДОСТУПЕН</option>
                            <option value="busy">ЗАНЯТ</option>
                            <option value="emergency">ЭКСТРЕННЫЙ</option>
                          </select>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeletePatrol(patrol.id)}
                            className="font-mono"
                          >
                            <Icon name="Trash2" className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {!patrols.length && (
                <div className="col-span-2 text-center py-12 font-mono text-muted-foreground">
                  Нет активных патрулей
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-lg">КАРТА ПАТРУЛЕЙ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-md p-8 text-center">
            <Icon name="Map" className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="font-mono text-sm text-muted-foreground">
              Интеграция карты в разработке
            </p>
            <p className="font-mono text-xs text-muted-foreground mt-2">
              Координаты патрулей: {patrols.filter(p => p.latitude && p.longitude).length} доступно
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatrolTab;
