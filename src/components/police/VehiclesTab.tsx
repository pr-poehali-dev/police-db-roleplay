import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  role: string;
}

interface VehiclesTabProps {
  user: User;
  onOpenCitizen?: (citizenId: number) => void;
}

const VehiclesTab = ({ user, onOpenCitizen }: VehiclesTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const [newVehicle, setNewVehicle] = useState({
    citizenId: '',
    plateNumber: '',
    make: '',
    model: '',
    color: '',
    year: '',
    notes: ''
  });

  const canModify = user.role === 'admin' || user.role === 'moderator';

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Введите данные для поиска' });
      return;
    }

    setIsSearching(true);
    try {
      const searchPattern = searchTerm.replace(/'/g, "''");
      const response = await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT v.*, c.first_name, c.last_name, c.phone,
                  (SELECT COUNT(*) FROM wanted_list w WHERE w.citizen_id = v.citizen_id AND w.is_active = true) as owner_wanted
                  FROM vehicles v
                  JOIN citizens c ON v.citizen_id = c.id
                  WHERE v.is_active = true
                  AND (LOWER(v.plate_number) LIKE LOWER('%${searchPattern}%')
                       OR LOWER(v.make) LIKE LOWER('%${searchPattern}%')
                       OR LOWER(v.model) LIKE LOWER('%${searchPattern}%')
                       OR v.id::text = '${searchPattern}')
                  ORDER BY v.added_at DESC LIMIT 50`
        })
      });
      const data = await response.json();
      setSearchResults(data.rows || []);
      
      if (data.rows?.length === 0) {
        toast({ title: 'Поиск', description: 'Ничего не найдено' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Ошибка поиска' });
    } finally {
      setIsSearching(false);
    }
  };

  const fetchVehicleDetails = async (vehicleId: number) => {
    try {
      const [vehicleRes, citizenRes] = await Promise.all([
        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT * FROM vehicles WHERE id = ${vehicleId} AND is_active = true`
          })
        }),
        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT c.*, 
                    (SELECT COUNT(*) FROM wanted_list w WHERE w.citizen_id = c.id AND w.is_active = true) as wanted_count
                    FROM vehicles v
                    JOIN citizens c ON v.citizen_id = c.id
                    WHERE v.id = ${vehicleId} AND v.is_active = true`
          })
        })
      ]);

      const [vehicleData, citizenData] = await Promise.all([
        vehicleRes.json(),
        citizenRes.json()
      ]);

      if (!vehicleData.rows || vehicleData.rows.length === 0) {
        toast({ 
          variant: 'destructive', 
          title: 'Транспортное средство не найдено', 
          description: `ТС с ID ${vehicleId} не найдено в базе данных` 
        });
        return;
      }

      setSelectedVehicle({
        ...(vehicleData.rows?.[0] || {}),
        owner: citizenData.rows?.[0] || null
      });
      setIsDetailsDialogOpen(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить детали' });
    }
  };

  const handleAddVehicle = async () => {
    if (!canModify) return;
    
    try {
      const plate = newVehicle.plateNumber.replace(/'/g, "''");
      const make = newVehicle.make.replace(/'/g, "''");
      const model = newVehicle.model.replace(/'/g, "''");
      const color = newVehicle.color.replace(/'/g, "''");
      const notes = newVehicle.notes.replace(/'/g, "''");

      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO vehicles (citizen_id, plate_number, make, model, color, year, notes, added_by) 
                  VALUES (${newVehicle.citizenId}, '${plate}', '${make}', '${model}', '${color}', ${newVehicle.year || 'NULL'}, '${notes}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'ТС добавлено' });
      setIsAddDialogOpen(false);
      setNewVehicle({ citizenId: '', plateNumber: '', make: '', model: '', color: '', year: '', notes: '' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить ТС' });
    }
  };

  const handleDeleteVehicle = async (vehicleId: number) => {
    if (!canModify) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE vehicles SET is_active = false WHERE id = ${vehicleId}`
        })
      });
      
      toast({ title: 'Успешно', description: 'ТС удалено' });
      setIsDetailsDialogOpen(false);
      setSearchResults(searchResults.filter(v => v.id !== vehicleId));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить ТС' });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-mono text-lg">ПОИСК ТРАНСПОРТНЫХ СРЕДСТВ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Гос. номер, марка, модель или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="font-mono flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="font-mono">
              <Icon name="Search" className="w-4 h-4 mr-2" />
              {isSearching ? 'ПОИСК...' : 'НАЙТИ'}
            </Button>
            {canModify && (
              <Button onClick={() => setIsAddDialogOpen(true)} className="font-mono">
                <Icon name="Plus" className="w-4 h-4 mr-2" />
                ДОБАВИТЬ
              </Button>
            )}
          </div>

          {searchResults.length > 0 && (
            <div className="border-2 rounded-md">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-mono">ГОС. НОМЕР</TableHead>
                    <TableHead className="font-mono">МАРКА / МОДЕЛЬ</TableHead>
                    <TableHead className="font-mono">ЦВЕТ</TableHead>
                    <TableHead className="font-mono">ГОД</TableHead>
                    <TableHead className="font-mono">ВЛАДЕЛЕЦ</TableHead>
                    <TableHead className="font-mono">СТАТУС</TableHead>
                    <TableHead className="font-mono">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((vehicle) => (
                    <TableRow 
                      key={vehicle.id}
                      onClick={() => fetchVehicleDetails(vehicle.id)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-mono font-bold">{vehicle.plate_number}</TableCell>
                      <TableCell className="font-mono">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell className="font-mono">{vehicle.color}</TableCell>
                      <TableCell className="font-mono">{vehicle.year}</TableCell>
                      <TableCell className="font-mono">
                        {vehicle.first_name} {vehicle.last_name}
                      </TableCell>
                      <TableCell>
                        {vehicle.owner_wanted > 0 && (
                          <Badge variant="destructive" className="font-mono">ВЛАДЕЛЕЦ В РОЗЫСКЕ</Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchVehicleDetails(vehicle.id)}
                          className="font-mono"
                        >
                          ОТКРЫТЬ
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">ДОБАВИТЬ ТРАНСПОРТНОЕ СРЕДСТВО</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-mono">ID ВЛАДЕЛЬЦА (ГРАЖДАНИНА)</Label>
              <Input
                type="number"
                placeholder="ID из базы граждан"
                value={newVehicle.citizenId}
                onChange={(e) => setNewVehicle({ ...newVehicle, citizenId: e.target.value })}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="font-mono">ГОС. НОМЕР</Label>
              <Input
                placeholder="А123БВ777"
                value={newVehicle.plateNumber}
                onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono">МАРКА</Label>
                <Input
                  placeholder="Toyota"
                  value={newVehicle.make}
                  onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="font-mono">МОДЕЛЬ</Label>
                <Input
                  placeholder="Camry"
                  value={newVehicle.model}
                  onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono">ЦВЕТ</Label>
                <Input
                  placeholder="Черный"
                  value={newVehicle.color}
                  onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="font-mono">ГОД</Label>
                <Input
                  type="number"
                  placeholder="2020"
                  value={newVehicle.year}
                  onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="font-mono">ЗАМЕТКИ</Label>
              <Textarea
                placeholder="Дополнительная информация"
                value={newVehicle.notes}
                onChange={(e) => setNewVehicle({ ...newVehicle, notes: e.target.value })}
                className="font-mono"
              />
            </div>
            <Button onClick={handleAddVehicle} className="w-full font-mono">
              ДОБАВИТЬ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-7xl h-[95vh] overflow-y-auto">
          {selectedVehicle && (
            <>
              <DialogHeader className="relative pb-6 border-b">
                <DialogTitle className="font-mono flex items-center gap-2 text-2xl font-bold">
                  ТС #{selectedVehicle.id} - {selectedVehicle.plate_number}
                  {selectedVehicle.owner?.wanted_count > 0 && (
                    <Badge variant="destructive" className="font-mono">ВЛАДЕЛЕЦ В РОЗЫСКЕ</Badge>
                  )}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  <Icon name="X" className="h-4 w-4" />
                </Button>
              </DialogHeader>

              <div className="space-y-6">
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="font-mono text-sm">ИНФОРМАЦИЯ О ТС</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">ГОС. НОМЕР</Label>
                      <p className="font-mono font-bold text-lg">{selectedVehicle.plate_number}</p>
                    </div>
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">МАРКА / МОДЕЛЬ</Label>
                      <p className="font-mono">{selectedVehicle.make} {selectedVehicle.model}</p>
                    </div>
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">ЦВЕТ</Label>
                      <p className="font-mono">{selectedVehicle.color}</p>
                    </div>
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">ГОД ВЫПУСКА</Label>
                      <p className="font-mono">{selectedVehicle.year}</p>
                    </div>
                    {selectedVehicle.notes && (
                      <div className="col-span-2">
                        <Label className="font-mono text-xs text-muted-foreground">ЗАМЕТКИ</Label>
                        <p className="font-mono">{selectedVehicle.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {selectedVehicle.owner && (
                  <Card className="border-2">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="font-mono text-sm flex items-center gap-2">
                        <Icon name="User" className="w-4 h-4" />
                        ВЛАДЕЛЕЦ
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="font-mono text-xs text-muted-foreground">ФИО</Label>
                        <p className="font-mono">
                          {selectedVehicle.owner.first_name} {selectedVehicle.owner.last_name}
                        </p>
                      </div>
                      <div>
                        <Label className="font-mono text-xs text-muted-foreground">ТЕЛЕФОН</Label>
                        <p className="font-mono">{selectedVehicle.owner.phone}</p>
                      </div>
                      <div className="col-span-2">
                        <Label className="font-mono text-xs text-muted-foreground">АДРЕС</Label>
                        <p className="font-mono">{selectedVehicle.owner.address}</p>
                      </div>
                      {selectedVehicle.owner.wanted_count > 0 && (
                        <div className="col-span-2">
                          <Badge variant="destructive" className="font-mono">
                            ВЛАДЕЛЕЦ НАХОДИТСЯ В РОЗЫСКЕ
                          </Badge>
                        </div>
                      )}
                      </div>
                      {onOpenCitizen && selectedVehicle?.citizen_id && (
                        <Button
                          onClick={() => onOpenCitizen(selectedVehicle.citizen_id)}
                          className="w-full font-mono"
                          variant="outline"
                        >
                          <Icon name="UserCheck" className="w-4 h-4 mr-2" />
                          Открыть профиль
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}

                {canModify && (
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteVehicle(selectedVehicle.id)}
                    className="w-full font-mono"
                  >
                    <Icon name="Trash2" className="w-4 h-4 mr-2" />
                    УДАЛИТЬ ТС
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VehiclesTab;