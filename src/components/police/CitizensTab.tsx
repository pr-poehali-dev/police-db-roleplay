import { useState } from 'react';
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

interface User {
  id: number;
  role: string;
}

const CitizensTab = ({ user }: { user: User }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isAddCitizenOpen, setIsAddCitizenOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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
          query: `SELECT c.*, 
                  (SELECT COUNT(*) FROM wanted_list w WHERE w.citizen_id = c.id AND w.is_active = true) as wanted_count
                  FROM citizens c 
                  WHERE c.is_active = true 
                  AND (LOWER(c.first_name) LIKE LOWER('%${searchPattern}%') 
                       OR LOWER(c.last_name) LIKE LOWER('%${searchPattern}%')
                       OR LOWER(c.phone) LIKE LOWER('%${searchPattern}%')
                       OR c.id::text = '${searchPattern}')
                  ORDER BY c.id DESC LIMIT 50`
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

  const fetchCitizenDetails = async (citizenId: number) => {
    try {
      const [citizenRes, criminalRes, finesRes, warningsRes, wantedRes] = await Promise.all([
        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT * FROM citizens WHERE id = ${citizenId} AND is_active = true`
          })
        }),
        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT * FROM criminal_records WHERE citizen_id = ${citizenId} AND is_active = true ORDER BY date_committed DESC`
          })
        }),
        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT * FROM fines WHERE citizen_id = ${citizenId} AND is_active = true ORDER BY issued_at DESC`
          })
        }),
        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT * FROM warnings WHERE citizen_id = ${citizenId} AND is_active = true ORDER BY issued_at DESC`
          })
        }),

        fetch('https://api.poehali.dev/v0/sql-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `SELECT * FROM wanted_list WHERE citizen_id = ${citizenId} AND is_active = true ORDER BY added_at DESC`
          })
        })
      ]);

      const [citizenData, criminalData, finesData, warningsData, wantedData] = await Promise.all([
        citizenRes.json(),
        criminalRes.json(),
        finesRes.json(),
        warningsRes.json(),
        wantedRes.json()
      ]);

      setSelectedCitizen({
        ...(citizenData.rows?.[0] || {}),
        criminalRecords: criminalData.rows || [],
        fines: finesData.rows || [],
        warnings: warningsData.rows || [],
        wanted: wantedData.rows || []
      });
      setIsDetailsDialogOpen(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить детали' });
    }
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
      fetchCitizenDetails(selectedCitizen.id);
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
      fetchCitizenDetails(selectedCitizen.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить штраф' });
    }
  };

  const handleAddWarning = async () => {
    if (!canModify || !selectedCitizen) return;
    
    try {
      const warning = newWarning.warningText.replace(/'/g, "''");

      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO warnings (citizen_id, warning_text, issued_by) VALUES (${selectedCitizen.id}, '${warning}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'Предупреждение добавлено' });
      setNewWarning({ warningText: '' });
      fetchCitizenDetails(selectedCitizen.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить предупреждение' });
    }
  };



  const handleAddToWanted = async () => {
    if (!canModify || !selectedCitizen || !wantedReason.trim()) return;
    
    try {
      const reason = wantedReason.replace(/'/g, "''");

      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO wanted_list (citizen_id, reason, added_by) VALUES (${selectedCitizen.id}, '${reason}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'Объявлен в розыск' });
      setWantedReason('');
      fetchCitizenDetails(selectedCitizen.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось объявить в розыск' });
    }
  };

  const handleRemoveFromWanted = async (wantedId: number) => {
    if (!canModify) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE wanted_list SET is_active = false WHERE id = ${wantedId}`
        })
      });
      
      toast({ title: 'Успешно', description: 'Розыск снят' });
      fetchCitizenDetails(selectedCitizen.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось снять розыск' });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="font-mono text-lg">ПОИСК ГРАЖДАН</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="ФИО, телефон или ID..."
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
              <Button onClick={() => setIsAddCitizenOpen(true)} className="font-mono">
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
                    <TableHead className="font-mono">ID</TableHead>
                    <TableHead className="font-mono">ИМЯ</TableHead>
                    <TableHead className="font-mono">ФАМИЛИЯ</TableHead>
                    <TableHead className="font-mono">ДАТА РОЖДЕНИЯ</TableHead>
                    <TableHead className="font-mono">ТЕЛЕФОН</TableHead>
                    <TableHead className="font-mono">СТАТУС</TableHead>
                    <TableHead className="font-mono">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.map((citizen) => (
                    <TableRow key={citizen.id}>
                      <TableCell className="font-mono">{citizen.id}</TableCell>
                      <TableCell className="font-mono">{citizen.first_name}</TableCell>
                      <TableCell className="font-mono">{citizen.last_name}</TableCell>
                      <TableCell className="font-mono">{citizen.date_of_birth}</TableCell>
                      <TableCell className="font-mono">{citizen.phone}</TableCell>
                      <TableCell>
                        {citizen.wanted_count > 0 && (
                          <Badge variant="destructive" className="font-mono">В РОЗЫСКЕ</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCitizenDetails(citizen.id)}
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          {selectedCitizen && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono flex items-center gap-2">
                  ДОСЬЕ #{selectedCitizen.id} - {selectedCitizen.first_name} {selectedCitizen.last_name}
                  {selectedCitizen.wanted?.length > 0 && (
                    <Badge variant="destructive" className="font-mono">В РОЗЫСКЕ</Badge>
                  )}
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="grid grid-cols-5 font-mono">
                  <TabsTrigger value="info">ИНФОРМАЦИЯ</TabsTrigger>
                  <TabsTrigger value="criminal">ПРЕСТУПЛЕНИЯ</TabsTrigger>
                  <TabsTrigger value="fines">ШТРАФЫ</TabsTrigger>
                  <TabsTrigger value="warnings">ПРЕДУПРЕЖДЕНИЯ</TabsTrigger>
                  <TabsTrigger value="wanted">РОЗЫСК</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                </TabsContent>

                <TabsContent value="criminal" className="space-y-4">
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
                            <div className="space-y-1">
                              <p className="font-mono font-bold">{record.crime_type}</p>
                              <p className="font-mono text-sm">{record.description}</p>
                              <p className="font-mono text-xs text-muted-foreground">
                                {record.date_committed} | {record.severity} | {record.status}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="fines" className="space-y-4">
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
                            <div>
                              <p className="font-mono font-bold">{fine.amount} ₽</p>
                              <p className="font-mono text-sm">{fine.reason}</p>
                              <p className="font-mono text-xs text-muted-foreground">{fine.issued_at}</p>
                            </div>
                            <Badge variant={fine.status === 'paid' ? 'default' : 'destructive'} className="font-mono">
                              {fine.status === 'paid' ? 'ОПЛАЧЕН' : 'НЕ ОПЛАЧЕН'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="warnings" className="space-y-4">
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
                          <p className="font-mono text-sm">{warning.warning_text}</p>
                          <p className="font-mono text-xs text-muted-foreground">{warning.issued_at}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="wanted" className="space-y-4">
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