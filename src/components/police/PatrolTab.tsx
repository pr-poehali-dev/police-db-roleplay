import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { MOCK_PATROLS } from '@/utils/mockData';

interface User {
  id: number;
  role: string;
  username: string;
  fullName?: string;
}

const STATUS_COLORS = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  on_scene: 'bg-orange-500',
  unavailable: 'bg-gray-500'
};

const STATUS_LABELS = {
  available: 'ДОСТУПЕН',
  busy: 'ЗАНЯТ',
  on_scene: 'ЗАДЕРЖКА НА СИТУАЦИИ',
  unavailable: 'НЕДОСТУПЕН'
};

const STATUSES_REQUIRING_REASON = ['busy', 'on_scene', 'unavailable'];

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
    status: 'available',
    statusReason: '',
    locationName: '',
    officer1: '',
    officer2: '',
    vehicleNumber: ''
  });

  const [editPatrol, setEditPatrol] = useState({
    unitName: '',
    status: 'available',
    statusReason: '',
    locationName: '',
    officer1: '',
    officer2: '',
    vehicleNumber: ''
  });

  const [statusChangeDialogOpen, setStatusChangeDialogOpen] = useState(false);
  const [statusChangeData, setStatusChangeData] = useState<{
    patrolId: number;
    newStatus: string;
    reason: string;
  } | null>(null);

  const canModify = user.role === 'admin' || user.role === 'moderator';

  // Проверка, может ли пользователь управлять экипажем
  const canManagePatrol = (patrol: any) => {
    if (user.role === 'admin' || user.role === 'moderator') return true;
    return patrol.officer_1 === user.id || patrol.officer_2 === user.id;
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const fetchPatrols = () => {
    setIsLoading(true);
    setTimeout(() => {
      setPatrols(MOCK_PATROLS);
      setIsLoading(false);
    }, 300);
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const fetchOfficers = () => {
    setOfficers([]);
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleAddPatrol = () => {
    // Для обычных пользователей автоматически устанавливаем officer1 = текущий пользователь
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleUpdatePatrol = () => {
    if (!canModify || !editingPatrol) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  const openEditDialog = (patrol: any) => {
    if (!canManagePatrol(patrol)) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Вы можете редактировать только свои экипажи' });
      return;
    }
    
    setEditingPatrol(patrol);
    setEditPatrol({
      unitName: patrol.unit_name,
      status: patrol.status,
      statusReason: patrol.status_reason || '',
      locationName: patrol.location_name || '',
      officer1: patrol.officer_1?.toString() || '',
      officer2: patrol.officer_2?.toString() || '',
      vehicleNumber: patrol.vehicle_number || ''
    });
    setIsEditDialogOpen(true);
  };

  const initiateStatusChange = (patrolId: number, newStatus: string) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol || !canManagePatrol(patrol)) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Вы можете изменять статус только своих экипажей' });
      return;
    }
    
    if (STATUSES_REQUIRING_REASON.includes(newStatus)) {
      setStatusChangeData({ patrolId, newStatus, reason: '' });
      setStatusChangeDialogOpen(true);
    } else {
      handleUpdateStatus(patrolId, newStatus, '');
    }
  };

  const handleUpdateStatus = async (patrolId: number, newStatus: string, reason: string) => {
    if (!canModify) return;
    
    if (STATUSES_REQUIRING_REASON.includes(newStatus) && !reason.trim()) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Укажите причину для данного статуса' });
      return;
    }
    
    try {
      const escapedReason = reason.replace(/'/g, "''");
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE patrol_units SET status = '${newStatus}', status_reason = '${escapedReason}', updated_at = CURRENT_TIMESTAMP WHERE id = ${patrolId}`
        })
      });
      
      setPatrols(patrols.map(p => 
        p.id === patrolId ? { ...p, status: newStatus, status_reason: reason, updated_at: new Date().toISOString() } : p
      ));
      toast({ title: 'Успешно', description: 'Статус обновлен' });
      setStatusChangeDialogOpen(false);
      setStatusChangeData(null);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось обновить статус' });
    }
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleDeletePatrol = (patrolId: number) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    
    if (!canManagePatrol(patrol)) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Вы можете удалять только свои экипажи' });
      return;
    }
    
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
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
            <CardTitle className="font-mono text-lg">АКТИВНЫЕ ЭКИПАЖИ</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={fetchPatrols}
                disabled={isLoading}
                className="font-mono"
              >
                <Icon name="RefreshCw" className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'ЗАГРУЗКА...' : 'ОБНОВИТЬ'}
              </Button>
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
                        placeholder="Lincoln-1"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">НОМЕР ТС</Label>
                      <Input 
                        value={newPatrol.vehicleNumber}
                        onChange={(e) => setNewPatrol({ ...newPatrol, vehicleNumber: e.target.value })}
                        placeholder="A1B2C3D"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs">МЕСТОПОЛОЖЕНИЕ</Label>
                      <Input 
                        value={newPatrol.locationName}
                        onChange={(e) => setNewPatrol({ ...newPatrol, locationName: e.target.value })}
                        placeholder="Линкольн, 1"
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ОФИЦЕР 1</Label>
                      {canModify ? (
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
                      ) : (
                        <Input 
                          value={user.fullName || user.username}
                          disabled
                          className="font-mono bg-gray-100"
                        />
                      )}
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
                        <option value="available">ДОСТУПЕН</option>
                        <option value="busy">ЗАНЯТ</option>
                        <option value="on_scene">ЗАДЕРЖКА НА СИТУАЦИИ</option>
                        <option value="unavailable">НЕДОСТУПЕН</option>
                      </select>
                    </div>
                    {STATUSES_REQUIRING_REASON.includes(newPatrol.status) && (
                      <div className="space-y-2 col-span-2">
                        <Label className="font-mono text-xs text-red-600">ПРИЧИНА (ОБЯЗАТЕЛЬНО)</Label>
                        <Input 
                          value={newPatrol.statusReason}
                          onChange={(e) => setNewPatrol({ ...newPatrol, statusReason: e.target.value })}
                          placeholder="Укажите причину статуса"
                          className="font-mono border-red-300"
                        />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleAddPatrol} className="w-full font-mono">
                    СОЗДАТЬ
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
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
                        
                        {patrol.status_reason && STATUSES_REQUIRING_REASON.includes(patrol.status) && (
                          <div className="flex items-start gap-2">
                            <Icon name="Info" className="w-4 h-4 mt-0.5 text-orange-500" />
                            <div>
                              <p className="font-mono text-xs text-orange-700">{patrol.status_reason}</p>
                            </div>
                          </div>
                        )}
                        
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
                      
                      {canManagePatrol(patrol) && (
                        <div className="flex gap-2 pt-2 border-t">
                          <select
                            value={patrol.status}
                            onChange={(e) => initiateStatusChange(patrol.id, e.target.value)}
                            className="flex-1 border rounded-md px-2 py-1 font-mono text-xs"
                          >
                            <option value="available">ДОСТУПЕН</option>
                            <option value="busy">ЗАНЯТ</option>
                            <option value="on_scene">ЗАДЕРЖКА НА СИТУАЦИИ</option>
                            <option value="unavailable">НЕДОСТУПЕН</option>
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
                  Нет активных экипажей
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
                  placeholder="Lincoln-1"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">НОМЕР ТС</Label>
                <Input 
                  value={editPatrol.vehicleNumber}
                  onChange={(e) => setEditPatrol({ ...editPatrol, vehicleNumber: e.target.value })}
                  placeholder="A1B2C3D"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="font-mono text-xs">МЕСТОПОЛОЖЕНИЕ</Label>
                <Input 
                  value={editPatrol.locationName}
                  onChange={(e) => setEditPatrol({ ...editPatrol, locationName: e.target.value })}
                  placeholder="Линкольн, 1"
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-mono text-xs">ОФИЦЕР 1</Label>
                <select 
                  value={editPatrol.officer1}
                  onChange={(e) => setEditPatrol({ ...editPatrol, officer1: e.target.value })}
                  className="w-full border rounded-md px-3 py-2 font-mono text-sm"
                  disabled={!canModify && editingPatrol?.officer_1 === user.id}
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
                  <option value="available">ДОСТУПЕН</option>
                  <option value="busy">ЗАНЯТ</option>
                  <option value="on_scene">ЗАДЕРЖКА НА СИТУАЦИИ</option>
                  <option value="unavailable">НЕДОСТУПЕН</option>
                </select>
              </div>
              {STATUSES_REQUIRING_REASON.includes(editPatrol.status) && (
                <div className="space-y-2 col-span-2">
                  <Label className="font-mono text-xs text-red-600">ПРИЧИНА (ОБЯЗАТЕЛЬНО)</Label>
                  <Input 
                    value={editPatrol.statusReason}
                    onChange={(e) => setEditPatrol({ ...editPatrol, statusReason: e.target.value })}
                    placeholder="Укажите причину статуса"
                    className="font-mono border-red-300"
                  />
                </div>
              )}
            </div>
          )}
          <Button onClick={handleUpdatePatrol} className="w-full font-mono">
            СОХРАНИТЬ
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={statusChangeDialogOpen} onOpenChange={setStatusChangeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-mono">УКАЗАТЬ ПРИЧИНУ</DialogTitle>
          </DialogHeader>
          {statusChangeData && (
            <div className="space-y-4">
              <div>
                <p className="font-mono text-sm text-muted-foreground mb-2">
                  Новый статус: <span className="font-bold">{STATUS_LABELS[statusChangeData.newStatus as keyof typeof STATUS_LABELS]}</span>
                </p>
                <Label className="font-mono text-xs text-red-600">ПРИЧИНА (ОБЯЗАТЕЛЬНО)</Label>
                <Input 
                  value={statusChangeData.reason}
                  onChange={(e) => setStatusChangeData({ ...statusChangeData, reason: e.target.value })}
                  placeholder="Укажите причину статуса"
                  className="font-mono border-red-300 mt-2"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStatusChangeDialogOpen(false);
                    setStatusChangeData(null);
                  }}
                  className="flex-1 font-mono"
                >
                  ОТМЕНА
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus(statusChangeData.patrolId, statusChangeData.newStatus, statusChangeData.reason)}
                  className="flex-1 font-mono"
                >
                  СОХРАНИТЬ
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatrolTab;