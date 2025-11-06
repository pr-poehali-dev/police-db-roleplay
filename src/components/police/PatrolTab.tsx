import { useState, useEffect, useCallback } from 'react';
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPatrol, setEditingPatrol] = useState<any>(null);
  const { toast } = useToast();

  const [newPatrol, setNewPatrol] = useState({
    unitName: '',
    status: 'offline',
    locationName: '',
    officer1: '',
    officer2: '',
    vehicleNumber: ''
  });

  const [editPatrol, setEditPatrol] = useState({
    unitName: '',
    status: 'offline',
    locationName: '',
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
      const loc = newPatrol.locationName.replace(/'/g, "''");
      const veh = newPatrol.vehicleNumber.replace(/'/g, "''");
      const unit = newPatrol.unitName.replace(/'/g, "''");
      
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO patrol_units (unit_name, status, location_name, officer_1, officer_2, vehicle_number) 
                  VALUES ('${unit}', '${newPatrol.status}', '${loc}', ${officer1Value}, ${officer2Value}, '${veh}')`
        })
      });
      
      toast({ title: 'Успешно', description: 'Патруль создан' });
      setIsAddDialogOpen(false);
      setNewPatrol({ unitName: '', status: 'offline', locationName: '', officer1: '', officer2: '', vehicleNumber: '' });
      fetchPatrols();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось создать патруль' });
    }
  };

  const handleUpdatePatrol = async () => {
    if (!canModify || !editingPatrol) return;
    
    try {
      const officer1Value = editPatrol.officer1 ? parseInt(editPatrol.officer1) : 'NULL';
      const officer2Value = editPatrol.officer2 ? parseInt(editPatrol.officer2) : 'NULL';
      const loc = editPatrol.locationName.replace(/'/g, "''");
      const veh = editPatrol.vehicleNumber.replace(/'/g, "''");
      const unit = editPatrol.unitName.replace(/'/g, "''");
      
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE patrol_units 
                  SET unit_name = '${unit}', 
                      status = '${editPatrol.status}', 
                      location_name = '${loc}', 
                      officer_1 = ${officer1Value}, 
                      officer_2 = ${officer2Value}, 
                      vehicle_number = '${veh}',
                      updated_at = CURRENT_TIMESTAMP
                  WHERE id = ${editingPatrol.id}`
        })
      });
      
      toast({ title: 'Успешно', description: 'Патруль обновлен' });
      setIsEditDialogOpen(false);
      setEditingPatrol(null);
      fetchPatrols();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить патруль' });
    }
  };

  const openEditDialog = (patrol: any) => {
    setEditingPatrol(patrol);
    setEditPatrol({
      unitName: patrol.unit_name,
      status: patrol.status,
      locationName: patrol.location_name || '',
      officer1: patrol.officer_1?.toString() || '',
      officer2: patrol.officer_2?.toString() || '',
      vehicleNumber: patrol.vehicle_number || ''
    });
    setIsEditDialogOpen(true);
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
      
      setPatrols(patrols.map(p => 
        p.id === patrolId ? { ...p, status: newStatus, updated_at: new Date().toISOString() } : p
      ));
      toast({ title: 'Успешно', description: 'Статус обновлен' });
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
                      <Label className="font-mono text-xs">МЕСТОПОЛОЖЕНИЕ</Label>
                      <Input 
                        value={newPatrol.locationName}
                        onChange={(e) => setNewPatrol({ ...newPatrol, locationName: e.target.value })}
                        placeholder="Центральный район, ул. Ленина 45"
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
                            <p className="font-mono text-sm">{patrol.location_name || 'Не указано'}</p>
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
                            variant="outline"
                            onClick={() => openEditDialog(patrol)}
                            className="font-mono"
                          >
                            <Icon name="Edit" className="w-4 h-4" />
                          </Button>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">РЕДАКТИРОВАТЬ ПАТРУЛЬНЫЙ ЭКИПАЖ</DialogTitle>
          </DialogHeader>
          {editingPatrol && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-mono text-xs">ПОЗЫВНОЙ</Label>
                <Input 
                  value={editPatrol.unitName}
                  onChange={(e) => setEditPatrol({ ...editPatrol, unitName: e.target.value })}
                  placeholder="Альфа-1"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">НОМЕР ТС</Label>
                <Input 
                  value={editPatrol.vehicleNumber}
                  onChange={(e) => setEditPatrol({ ...editPatrol, vehicleNumber: e.target.value })}
                  placeholder="A777AA777"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-mono text-xs">МЕСТОПОЛОЖЕНИЕ</Label>
                <Input 
                  value={editPatrol.locationName}
                  onChange={(e) => setEditPatrol({ ...editPatrol, locationName: e.target.value })}
                  placeholder="Центральный район, ул. Ленина 45"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">ОФИЦЕР 1</Label>
                <select 
                  value={editPatrol.officer1}
                  onChange={(e) => setEditPatrol({ ...editPatrol, officer1: e.target.value })}
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
                  value={editPatrol.officer2}
                  onChange={(e) => setEditPatrol({ ...editPatrol, officer2: e.target.value })}
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
                  value={editPatrol.status}
                  onChange={(e) => setEditPatrol({ ...editPatrol, status: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                >
                  <option value="offline">OFFLINE</option>
                  <option value="available">ДОСТУПЕН</option>
                  <option value="busy">ЗАНЯТ</option>
                  <option value="emergency">ЭКСТРЕННЫЙ</option>
                </select>
              </div>
            </div>
          )}
          <Button onClick={handleUpdatePatrol} className="w-full font-mono">
            СОХРАНИТЬ
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatrolTab;