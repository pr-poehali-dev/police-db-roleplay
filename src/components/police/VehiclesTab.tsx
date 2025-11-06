import { useState, useEffect, useCallback } from 'react';
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
import { MOCK_VEHICLES, getMockVehicleDetails } from '@/utils/mockData';

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
  const [allVehicles, setAllVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
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

  useEffect(() => {
    // Убрана автозагрузка для снижения нагрузки на БД
  }, []);

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const fetchAllVehicles = () => {
    if (!canModify) return;
    
    setIsLoadingAll(true);
    setTimeout(() => {
      setAllVehicles(MOCK_VEHICLES);
      setIsLoadingAll(false);
    }, 300);
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Введите данные для поиска' });
      return;
    }

    setIsSearching(true);
    setTimeout(() => {
      const searchLower = searchTerm.toLowerCase();
      const results = MOCK_VEHICLES.filter(v => 
        v.plate_number.toLowerCase().includes(searchLower) ||
        v.make.toLowerCase().includes(searchLower) ||
        v.model.toLowerCase().includes(searchLower) ||
        v.id.toString() === searchTerm
      );
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({ title: 'Поиск', description: 'Ничего не найдено' });
      }
      setIsSearching(false);
    }, 300);
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const fetchVehicleDetails = (vehicleId: number) => {
    const data = getMockVehicleDetails(vehicleId);
    
    if (!data) {
      toast({ 
        variant: 'destructive', 
        title: 'Транспортное средство не найдено', 
        description: `ТС с ID ${vehicleId} не найдено в базе данных` 
      });
      return;
    }

    setSelectedVehicle(data);
    setIsDetailsDialogOpen(true);
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleAddVehicle = () => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleDeleteVehicle = (vehicleId: number) => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-mono text-lg">ПОИСК ТРАНСПОРТНЫХ СРЕДСТВ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Гос. номер, марка, модель или ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="font-mono flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching} className="font-mono w-full md:w-auto">
              <Icon name="Search" className="w-4 h-4 mr-2" />
              {isSearching ? 'ПОИСК...' : 'НАЙТИ'}
            </Button>
            {canModify && (
              <>
                <Button 
                  onClick={fetchAllVehicles} 
                  disabled={isLoadingAll}
                  variant="outline"
                  className="font-mono w-full md:w-auto"
                >
                  <Icon name="RefreshCw" className={`w-4 h-4 mr-2 ${isLoadingAll ? 'animate-spin' : ''}`} />
                  {isLoadingAll ? 'ЗАГРУЗКА...' : 'ЗАГРУЗИТЬ ВСЕ'}
                </Button>
                <Button onClick={() => setIsAddDialogOpen(true)} className="font-mono w-full md:w-auto">
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  ДОБАВИТЬ
                </Button>
              </>
            )}
          </div>

          {canModify && allVehicles.length > 0 && searchResults.length === 0 && (
            <div className="border-2 rounded-md overflow-x-auto">
              <div className="bg-muted px-4 py-2 border-b">
                <p className="font-mono text-sm font-bold">ВСЕ ТРАНСПОРТНЫЕ СРЕДСТВА ({allVehicles.length})</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-mono text-xs">ГОС. НОМЕР</TableHead>
                    <TableHead className="font-mono text-xs hidden md:table-cell">МАРКА / МОДЕЛЬ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ЦВЕТ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ГОД</TableHead>
                    <TableHead className="font-mono text-xs hidden sm:table-cell">ВЛАДЕЛЕЦ</TableHead>
                    <TableHead className="font-mono text-xs">СТАТУС</TableHead>
                    <TableHead className="font-mono text-xs">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allVehicles.map((vehicle) => (
                    <TableRow 
                      key={vehicle.id}
                      onClick={() => fetchVehicleDetails(vehicle.id)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-mono font-bold text-xs">{vehicle.plate_number}</TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{vehicle.color}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{vehicle.year}</TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell">
                        {vehicle.first_name} {vehicle.last_name}
                      </TableCell>
                      <TableCell>
                        {vehicle.owner_wanted > 0 && (
                          <Badge variant="destructive" className="font-mono text-xs">РОЗЫСК</Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchVehicleDetails(vehicle.id)}
                          className="font-mono text-xs"
                        >
                          <Icon name="Eye" className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="border-2 rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-mono text-xs">ГОС. НОМЕР</TableHead>
                    <TableHead className="font-mono text-xs hidden md:table-cell">МАРКА / МОДЕЛЬ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ЦВЕТ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ГОД</TableHead>
                    <TableHead className="font-mono text-xs hidden sm:table-cell">ВЛАДЕЛЕЦ</TableHead>
                    <TableHead className="font-mono text-xs">СТАТУС</TableHead>
                    <TableHead className="font-mono text-xs">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((vehicle) => (
                    <TableRow 
                      key={vehicle.id}
                      onClick={() => fetchVehicleDetails(vehicle.id)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-mono font-bold text-xs">{vehicle.plate_number}</TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{vehicle.color}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{vehicle.year}</TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell">
                        {vehicle.first_name} {vehicle.last_name}
                      </TableCell>
                      <TableCell>
                        {vehicle.owner_wanted > 0 && (
                          <Badge variant="destructive" className="font-mono text-xs">РОЗЫСК</Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchVehicleDetails(vehicle.id)}
                          className="font-mono text-xs"
                        >
                          <Icon name="Eye" className="w-3 h-3" />
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