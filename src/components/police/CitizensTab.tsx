import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { MOCK_CITIZENS, getMockCitizenDetails } from '@/utils/mockData';

interface User {
  id: number;
  role: string;
}

interface CitizensTabProps {
  user: User;
  citizenIdToOpen?: number | null;
  onCitizenOpened?: () => void;
}

const CitizensTab = ({ user, citizenIdToOpen, onCitizenOpened }: CitizensTabProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allCitizens, setAllCitizens] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddCitizenOpen, setIsAddCitizenOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const { toast } = useToast();

  const [newCitizen, setNewCitizen] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    occupation: '',
    notes: ''
  });

  const [newRecord, setNewRecord] = useState({
    crimeType: '',
    description: '',
    dateCommitted: '',
    severity: 'minor',
    status: 'active'
  });

  const [newFine, setNewFine] = useState({
    amount: '',
    reason: '',
    status: 'unpaid'
  });

  const [newWarning, setNewWarning] = useState({
    warningText: ''
  });



  const [wantedReason, setWantedReason] = useState('');

  const canModify = user.role === 'admin' || user.role === 'moderator';

  useEffect(() => {
    if (citizenIdToOpen) {
      fetchCitizenDetails(citizenIdToOpen);
      onCitizenOpened?.();
    }
  }, [citizenIdToOpen, onCitizenOpened]);

  useEffect(() => {
    // Убрана автозагрузка для снижения нагрузки на БД
  }, []);

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const fetchAllCitizens = () => {
    if (!canModify) return;
    
    setIsLoadingAll(true);
    setTimeout(() => {
      setAllCitizens(MOCK_CITIZENS);
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
      const results = MOCK_CITIZENS.filter(c => 
        c.first_name.toLowerCase().includes(searchLower) ||
        c.last_name.toLowerCase().includes(searchLower) ||
        c.phone.toLowerCase().includes(searchLower) ||
        c.id.toString() === searchTerm
      );
      setSearchResults(results);
      
      if (results.length === 0) {
        toast({ title: 'Поиск', description: 'Ничего не найдено' });
      }
      setIsSearching(false);
    }, 300);
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const fetchCitizenDetails = (citizenId: number) => {
    const data = getMockCitizenDetails(citizenId);
    
    if (!data) {
      toast({ 
        variant: 'destructive', 
        title: 'Гражданин не найден', 
        description: `Гражданин с ID ${citizenId} не найден в базе данных` 
      });
      return;
    }

    setSelectedCitizen(data);
    setIsDetailsDialogOpen(true);
  };

  const handleAddCitizen = async () => {
    if (!canModify) return;
    
    try {
      const fn = newCitizen.firstName.replace(/'/g, "''");
      const ln = newCitizen.lastName.replace(/'/g, "''");
      const addr = newCitizen.address.replace(/'/g, "''");
      const phone = newCitizen.phone.replace(/'/g, "''");
      const occ = newCitizen.occupation.replace(/'/g, "''");
      const notes = newCitizen.notes.replace(/'/g, "''");

      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO citizens (first_name, last_name, date_of_birth, address, phone, occupation, notes, created_by) VALUES ('${fn}', '${ln}', '${newCitizen.dateOfBirth}', '${addr}', '${phone}', '${occ}', '${notes}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'Гражданин добавлен' });
      setIsAddCitizenOpen(false);
      setNewCitizen({ firstName: '', lastName: '', dateOfBirth: '', address: '', phone: '', occupation: '', notes: '' });
      fetchAllCitizens();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить гражданина' });
    }
  };

  const handleAddCriminalRecord = async () => {
    if (!canModify || !selectedCitizen) return;
    
    try {
      const crime = newRecord.crimeType.replace(/'/g, "''");
      const desc = newRecord.description.replace(/'/g, "''");

      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO criminal_records (citizen_id, crime_type, description, date_committed, arresting_officer, status, severity) VALUES (${selectedCitizen.id}, '${crime}', '${desc}', '${newRecord.dateCommitted}', ${user.id}, '${newRecord.status}', '${newRecord.severity}')`
        })
      });
      
      toast({ title: 'Успешно', description: 'Запись добавлена' });
      setNewRecord({ crimeType: '', description: '', dateCommitted: '', severity: 'minor', status: 'active' });
      if (selectedCitizen) {
        fetchCitizenDetails(selectedCitizen.id);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить запись' });
    }
  };

  const handleAddFine = async () => {
    if (!canModify || !selectedCitizen) return;
    
    try {
      const reason = newFine.reason.replace(/'/g, "''");

      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO fines (citizen_id, amount, reason, status, issued_by) VALUES (${selectedCitizen.id}, ${newFine.amount}, '${reason}', '${newFine.status}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'Штраф добавлен' });
      setNewFine({ amount: '', reason: '', status: 'unpaid' });
      if (selectedCitizen) {
        fetchCitizenDetails(selectedCitizen.id);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить штраф' });
    }
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleAddWarning = () => {
    if (!canModify || !selectedCitizen) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };



  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleAddToWanted = () => {
    if (!canModify || !selectedCitizen || !wantedReason.trim()) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleRemoveFromWanted = (wantedId: number) => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleDeleteCitizen = (citizenId: number) => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleDeleteRecord = (recordId: number) => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleDeleteFine = (fineId: number) => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
  const handleDeleteWarning = (warningId: number) => {
    if (!canModify) return;
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов' });
  };

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-mono text-lg">ПОИСК ГРАЖДАН</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="ФИО, телефон или ID..."
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
                  onClick={fetchAllCitizens} 
                  disabled={isLoadingAll} 
                  variant="outline"
                  className="font-mono w-full md:w-auto"
                >
                  <Icon name="RefreshCw" className={`w-4 h-4 mr-2 ${isLoadingAll ? 'animate-spin' : ''}`} />
                  {isLoadingAll ? 'ЗАГРУЗКА...' : 'ЗАГРУЗИТЬ ВСЕ'}
                </Button>
                <Button onClick={() => setIsAddCitizenOpen(true)} className="font-mono w-full md:w-auto">
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  ДОБАВИТЬ
                </Button>
              </>
            )}
          </div>

          {canModify && allCitizens.length > 0 && searchResults.length === 0 && (
            <div className="border-2 rounded-md overflow-x-auto">
              <div className="bg-muted px-4 py-2 border-b">
                <p className="font-mono text-sm font-bold">ВСЕ ГРАЖДАНЕ ({allCitizens.length})</p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-mono text-xs">ID</TableHead>
                    <TableHead className="font-mono text-xs">ИМЯ</TableHead>
                    <TableHead className="font-mono text-xs hidden md:table-cell">ФАМИЛИЯ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ДАТА РОЖДЕНИЯ</TableHead>
                    <TableHead className="font-mono text-xs hidden sm:table-cell">ТЕЛЕФОН</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ПРЕСТ.</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ШТРАФЫ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ПРЕДУПР.</TableHead>
                    <TableHead className="font-mono text-xs">СТАТУС</TableHead>
                    <TableHead className="font-mono text-xs">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allCitizens.map((citizen) => (
                    <TableRow 
                      key={citizen.id}
                      onClick={() => fetchCitizenDetails(citizen.id)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-mono text-xs">{citizen.id}</TableCell>
                      <TableCell className="font-mono text-xs">{citizen.first_name}</TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">{citizen.last_name}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.date_of_birth}</TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell">{citizen.phone}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.crimes_count || 0}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.fines_count || 0}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.warnings_count || 0}</TableCell>
                      <TableCell>
                        {citizen.wanted_count > 0 && (
                          <Badge variant="destructive" className="font-mono text-xs">РОЗЫСК</Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCitizenDetails(citizen.id)}
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
                    <TableHead className="font-mono text-xs">ID</TableHead>
                    <TableHead className="font-mono text-xs">ИМЯ</TableHead>
                    <TableHead className="font-mono text-xs hidden md:table-cell">ФАМИЛИЯ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ДАТА РОЖДЕНИЯ</TableHead>
                    <TableHead className="font-mono text-xs hidden sm:table-cell">ТЕЛЕФОН</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ПРЕСТ.</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ШТРАФЫ</TableHead>
                    <TableHead className="font-mono text-xs hidden lg:table-cell">ПРЕДУПР.</TableHead>
                    <TableHead className="font-mono text-xs">СТАТУС</TableHead>
                    <TableHead className="font-mono text-xs">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((citizen) => (
                    <TableRow 
                      key={citizen.id}
                      onClick={() => fetchCitizenDetails(citizen.id)}
                      className="cursor-pointer hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-mono text-xs">{citizen.id}</TableCell>
                      <TableCell className="font-mono text-xs">{citizen.first_name}</TableCell>
                      <TableCell className="font-mono text-xs hidden md:table-cell">{citizen.last_name}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.date_of_birth}</TableCell>
                      <TableCell className="font-mono text-xs hidden sm:table-cell">{citizen.phone}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.crimes_count || 0}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.fines_count || 0}</TableCell>
                      <TableCell className="font-mono text-xs hidden lg:table-cell">{citizen.warnings_count || 0}</TableCell>
                      <TableCell>
                        {citizen.wanted_count > 0 && (
                          <Badge variant="destructive" className="font-mono text-xs">РОЗЫСК</Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCitizenDetails(citizen.id)}
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

      <Dialog open={isAddCitizenOpen} onOpenChange={setIsAddCitizenOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">ДОБАВИТЬ ГРАЖДАНИНА</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono">ИМЯ</Label>
                <Input
                  value={newCitizen.firstName}
                  onChange={(e) => setNewCitizen({ ...newCitizen, firstName: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="font-mono">ФАМИЛИЯ</Label>
                <Input
                  value={newCitizen.lastName}
                  onChange={(e) => setNewCitizen({ ...newCitizen, lastName: e.target.value })}
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="font-mono">ДАТА РОЖДЕНИЯ</Label>
              <Input
                type="date"
                value={newCitizen.dateOfBirth}
                onChange={(e) => setNewCitizen({ ...newCitizen, dateOfBirth: e.target.value })}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="font-mono">АДРЕС</Label>
              <Input
                value={newCitizen.address}
                onChange={(e) => setNewCitizen({ ...newCitizen, address: e.target.value })}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="font-mono">ТЕЛЕФОН</Label>
              <Input
                value={newCitizen.phone}
                onChange={(e) => setNewCitizen({ ...newCitizen, phone: e.target.value })}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="font-mono">ЗАНЯТОСТЬ</Label>
              <Input
                value={newCitizen.occupation}
                onChange={(e) => setNewCitizen({ ...newCitizen, occupation: e.target.value })}
                className="font-mono"
              />
            </div>
            <div>
              <Label className="font-mono">ЗАМЕТКИ</Label>
              <Textarea
                value={newCitizen.notes}
                onChange={(e) => setNewCitizen({ ...newCitizen, notes: e.target.value })}
                className="font-mono"
              />
            </div>
            <Button onClick={handleAddCitizen} className="w-full font-mono">
              ДОБАВИТЬ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-7xl h-[95vh] overflow-y-auto">
          {selectedCitizen && (
            <>
              <DialogHeader className="relative pb-6 border-b">
                <DialogTitle className="font-mono flex items-center gap-2 text-2xl font-bold">
                  ДОСЬЕ #{selectedCitizen.id} - {selectedCitizen.first_name} {selectedCitizen.last_name}
                  {selectedCitizen.wanted?.length > 0 && (
                    <Badge variant="destructive" className="font-mono">В РОЗЫСКЕ</Badge>
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

              <Tabs defaultValue="info" className="w-full mt-8">
                <TabsList className="grid grid-cols-5 font-mono">
                  <TabsTrigger value="info">ИНФОРМАЦИЯ</TabsTrigger>
                  <TabsTrigger value="criminal">ПРЕСТУПЛЕНИЯ</TabsTrigger>
                  <TabsTrigger value="fines">ШТРАФЫ</TabsTrigger>
                  <TabsTrigger value="warnings">ПРЕДУПРЕЖДЕНИЯ</TabsTrigger>
                  <TabsTrigger value="wanted">РОЗЫСК</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-6 mt-6">
                  <div className="grid grid-cols-2 gap-6 p-6 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">ДАТА РОЖДЕНИЯ</Label>
                      <p className="font-mono">{selectedCitizen.date_of_birth}</p>
                    </div>
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">ТЕЛЕФОН</Label>
                      <p className="font-mono">{selectedCitizen.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="font-mono text-xs text-muted-foreground">АДРЕС</Label>
                      <p className="font-mono">{selectedCitizen.address}</p>
                    </div>
                    <div>
                      <Label className="font-mono text-xs text-muted-foreground">ЗАНЯТОСТЬ</Label>
                      <p className="font-mono">{selectedCitizen.occupation}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="font-mono text-xs text-muted-foreground">ЗАМЕТКИ</Label>
                      <p className="font-mono">{selectedCitizen.notes}</p>
                    </div>
                  </div>
                  {canModify && (
                    <Button
                      variant="destructive"
                      onClick={() => handleDeleteCitizen(selectedCitizen.id)}
                      className="w-full font-mono"
                    >
                      <Icon name="Trash2" className="w-4 h-4 mr-2" />
                      УДАЛИТЬ ГРАЖДАНИНА ИЗ БАЗЫ
                    </Button>
                  )}
                </TabsContent>

                <TabsContent value="criminal" className="space-y-6 mt-6">
                  {canModify && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="font-mono text-sm">ДОБАВИТЬ ЗАПИСЬ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          placeholder="Тип преступления"
                          value={newRecord.crimeType}
                          onChange={(e) => setNewRecord({ ...newRecord, crimeType: e.target.value })}
                          className="font-mono"
                        />
                        <Textarea
                          placeholder="Описание"
                          value={newRecord.description}
                          onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                          className="font-mono"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            type="date"
                            value={newRecord.dateCommitted}
                            onChange={(e) => setNewRecord({ ...newRecord, dateCommitted: e.target.value })}
                            className="font-mono"
                          />
                          <Select value={newRecord.severity} onValueChange={(v) => setNewRecord({ ...newRecord, severity: v })}>
                            <SelectTrigger className="font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="minor" className="font-mono">ЛЕГКОЕ</SelectItem>
                              <SelectItem value="moderate" className="font-mono">СРЕДНЕЕ</SelectItem>
                              <SelectItem value="severe" className="font-mono">ТЯЖКОЕ</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={newRecord.status} onValueChange={(v) => setNewRecord({ ...newRecord, status: v })}>
                            <SelectTrigger className="font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active" className="font-mono">АКТИВНО</SelectItem>
                              <SelectItem value="closed" className="font-mono">ЗАКРЫТО</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddCriminalRecord} className="w-full font-mono">
                          ДОБАВИТЬ
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  <div className="space-y-2">
                    {selectedCitizen.criminalRecords?.map((record: any) => (
                      <Card key={record.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1 flex-1">
                              <p className="font-mono font-bold">{record.crime_type}</p>
                              <p className="font-mono text-sm">{record.description}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {record.date_committed} | {record.severity} | {record.status}
                              </p>
                            </div>
                            {canModify && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteRecord(record.id)}
                                className="font-mono ml-2"
                              >
                                <Icon name="Trash2" className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="fines" className="space-y-6 mt-6">
                  {canModify && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="font-mono text-sm">ДОБАВИТЬ ШТРАФ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input
                          type="number"
                          placeholder="Сумма"
                          value={newFine.amount}
                          onChange={(e) => setNewFine({ ...newFine, amount: e.target.value })}
                          className="font-mono"
                        />
                        <Input
                          placeholder="Причина"
                          value={newFine.reason}
                          onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })}
                          className="font-mono"
                        />
                        <Select value={newFine.status} onValueChange={(v) => setNewFine({ ...newFine, status: v })}>
                          <SelectTrigger className="font-mono">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid" className="font-mono">НЕ ОПЛАЧЕН</SelectItem>
                            <SelectItem value="paid" className="font-mono">ОПЛАЧЕН</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button onClick={handleAddFine} className="w-full font-mono">
                          ДОБАВИТЬ
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  <div className="space-y-2">
                    {selectedCitizen.fines?.map((fine: any) => (
                      <Card key={fine.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-mono font-bold">{fine.amount} ₽</p>
                              <p className="font-mono text-sm">{fine.reason}</p>
                              <p className="font-mono text-xs text-muted-foreground">{fine.issued_at}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={fine.status === 'paid' ? 'default' : 'destructive'} className="font-mono">
                                {fine.status === 'paid' ? 'ОПЛАЧЕН' : 'НЕ ОПЛАЧЕН'}
                              </Badge>
                              {canModify && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteFine(fine.id)}
                                  className="font-mono"
                                >
                                  <Icon name="Trash2" className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="warnings" className="space-y-6 mt-6">
                  {canModify && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="font-mono text-sm">ДОБАВИТЬ ПРЕДУПРЕЖДЕНИЕ</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="Текст предупреждения"
                          value={newWarning.warningText}
                          onChange={(e) => setNewWarning({ warningText: e.target.value })}
                          className="font-mono"
                        />
                        <Button onClick={handleAddWarning} className="w-full font-mono">
                          ДОБАВИТЬ
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  <div className="space-y-2">
                    {selectedCitizen.warnings?.map((warning: any) => (
                      <Card key={warning.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-mono text-sm">{warning.warning_text}</p>
                              <p className="font-mono text-xs text-muted-foreground">{warning.issued_at}</p>
                            </div>
                            {canModify && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteWarning(warning.id)}
                                className="font-mono ml-2"
                              >
                                <Icon name="Trash2" className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="wanted" className="space-y-6 mt-6">
                  {canModify && (
                    <Card className="border-2">
                      <CardHeader>
                        <CardTitle className="font-mono text-sm">ОБЪЯВИТЬ В РОЗЫСК</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          placeholder="Причина розыска"
                          value={wantedReason}
                          onChange={(e) => setWantedReason(e.target.value)}
                          className="font-mono"
                        />
                        <Button onClick={handleAddToWanted} className="w-full font-mono">
                          ДОБАВИТЬ В РОЗЫСК
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                  <div className="space-y-2">
                    {selectedCitizen.wanted?.map((wanted: any) => (
                      <Card key={wanted.id} className="border-2 border-destructive">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <Badge variant="destructive" className="font-mono mb-2">В РОЗЫСКЕ</Badge>
                              <p className="font-mono text-sm">{wanted.reason}</p>
                              <p className="font-mono text-xs text-muted-foreground">{wanted.added_at}</p>
                            </div>
                            {canModify && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveFromWanted(wanted.id)}
                                className="font-mono"
                              >
                                СНЯТЬ РОЗЫСК
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CitizensTab;