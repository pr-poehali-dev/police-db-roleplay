import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  role: string;
}

const CitizensTab = ({ user }: { user: User }) => {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const canModify = user.role === 'admin' || user.role === 'moderator';

  const fetchCitizens = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT * FROM citizens WHERE is_active = true ORDER BY id DESC LIMIT 100`
        })
      });
      const data = await response.json();
      setCitizens(data.rows || []);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить данные' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCitizenDetails = async (citizenId: number) => {
    try {
      const [criminalRes, finesRes, warningsRes] = await Promise.all([
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
        })
      ]);

      const [criminalData, finesData, warningsData] = await Promise.all([
        criminalRes.json(),
        finesRes.json(),
        warningsRes.json()
      ]);

      setSelectedCitizen({
        ...citizens.find(c => c.id === citizenId),
        criminalRecords: criminalData.rows || [],
        fines: finesData.rows || [],
        warnings: warningsData.rows || []
      });
      setIsDetailsDialogOpen(true);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось загрузить детали' });
    }
  };

  const handleAddCitizen = async () => {
    if (!canModify) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO citizens (first_name, last_name, date_of_birth, address, phone, occupation, notes, created_by) VALUES ('${newCitizen.firstName}', '${newCitizen.lastName}', '${newCitizen.dateOfBirth}', '${newCitizen.address}', '${newCitizen.phone}', '${newCitizen.occupation}', '${newCitizen.notes}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'Гражданин добавлен' });
      setIsAddDialogOpen(false);
      setNewCitizen({ firstName: '', lastName: '', dateOfBirth: '', address: '', phone: '', occupation: '', notes: '' });
      fetchCitizens();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить гражданина' });
    }
  };

  const handleDeleteCitizen = async (citizenId: number) => {
    if (!canModify) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `UPDATE citizens SET is_active = false WHERE id = ${citizenId}`
        })
      });
      
      toast({ title: 'Успешно', description: 'Гражданин удален' });
      fetchCitizens();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось удалить гражданина' });
    }
  };

  const handleAddCriminalRecord = async () => {
    if (!canModify || !selectedCitizen) return;
    
    try {
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO criminal_records (citizen_id, crime_type, description, date_committed, arresting_officer, status, severity) VALUES (${selectedCitizen.id}, '${newRecord.crimeType}', '${newRecord.description}', '${newRecord.dateCommitted}', ${user.id}, '${newRecord.status}', '${newRecord.severity}')`
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
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO fines (citizen_id, amount, reason, status, issued_by) VALUES (${selectedCitizen.id}, ${newFine.amount}, '${newFine.reason}', '${newFine.status}', ${user.id})`
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
      await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO warnings (citizen_id, warning_text, issued_by) VALUES (${selectedCitizen.id}, '${newWarning.warningText}', ${user.id})`
        })
      });
      
      toast({ title: 'Успешно', description: 'Предупреждение добавлено' });
      setNewWarning({ warningText: '' });
      fetchCitizenDetails(selectedCitizen.id);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Не удалось добавить предупреждение' });
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, []);

  const filteredCitizens = citizens.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg">БАЗА ГРАЖДАН</CardTitle>
            {canModify && (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="font-mono">
                    <Icon name="Plus" className="w-4 h-4 mr-2" />
                    ДОБАВИТЬ
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="font-mono">ДОБАВИТЬ ГРАЖДАНИНА</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ИМЯ</Label>
                      <Input 
                        value={newCitizen.firstName}
                        onChange={(e) => setNewCitizen({ ...newCitizen, firstName: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ФАМИЛИЯ</Label>
                      <Input 
                        value={newCitizen.lastName}
                        onChange={(e) => setNewCitizen({ ...newCitizen, lastName: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ДАТА РОЖДЕНИЯ</Label>
                      <Input 
                        type="date"
                        value={newCitizen.dateOfBirth}
                        onChange={(e) => setNewCitizen({ ...newCitizen, dateOfBirth: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-mono text-xs">ТЕЛЕФОН</Label>
                      <Input 
                        value={newCitizen.phone}
                        onChange={(e) => setNewCitizen({ ...newCitizen, phone: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs">АДРЕС</Label>
                      <Input 
                        value={newCitizen.address}
                        onChange={(e) => setNewCitizen({ ...newCitizen, address: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs">ПРОФЕССИЯ</Label>
                      <Input 
                        value={newCitizen.occupation}
                        onChange={(e) => setNewCitizen({ ...newCitizen, occupation: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label className="font-mono text-xs">ПРИМЕЧАНИЯ</Label>
                      <Textarea 
                        value={newCitizen.notes}
                        onChange={(e) => setNewCitizen({ ...newCitizen, notes: e.target.value })}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddCitizen} className="w-full font-mono">
                    СОХРАНИТЬ
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              placeholder="Поиск по ФИО или телефону..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="font-mono"
            />
          </div>
          
          {isLoading ? (
            <div className="text-center py-8 font-mono text-muted-foreground">Загрузка...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-mono">ID</TableHead>
                  <TableHead className="font-mono">ФИО</TableHead>
                  <TableHead className="font-mono">ДАТА РОЖДЕНИЯ</TableHead>
                  <TableHead className="font-mono">ТЕЛЕФОН</TableHead>
                  <TableHead className="font-mono">ПРОФЕССИЯ</TableHead>
                  <TableHead className="font-mono text-right">ДЕЙСТВИЯ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCitizens.map((citizen) => (
                  <TableRow key={citizen.id}>
                    <TableCell className="font-mono">{citizen.id}</TableCell>
                    <TableCell className="font-mono font-medium">
                      {citizen.first_name} {citizen.last_name}
                    </TableCell>
                    <TableCell className="font-mono">{citizen.date_of_birth}</TableCell>
                    <TableCell className="font-mono">{citizen.phone}</TableCell>
                    <TableCell className="font-mono">{citizen.occupation}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => fetchCitizenDetails(citizen.id)}
                          className="font-mono"
                        >
                          <Icon name="Eye" className="w-4 h-4" />
                        </Button>
                        {canModify && (
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteCitizen(citizen.id)}
                            className="font-mono"
                          >
                            <Icon name="Trash2" className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-mono">
              ДОСЬЕ: {selectedCitizen?.first_name} {selectedCitizen?.last_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCitizen && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-muted">
                <TabsTrigger value="info" className="font-mono text-xs">ДАННЫЕ</TabsTrigger>
                <TabsTrigger value="criminal" className="font-mono text-xs">КРИМИНАЛ</TabsTrigger>
                <TabsTrigger value="fines" className="font-mono text-xs">ШТРАФЫ</TabsTrigger>
                <TabsTrigger value="warnings" className="font-mono text-xs">ПРЕДУПРЕЖДЕНИЯ</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">ID</p>
                    <p className="font-mono font-medium">{selectedCitizen.id}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">ДАТА РОЖДЕНИЯ</p>
                    <p className="font-mono font-medium">{selectedCitizen.date_of_birth}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">ТЕЛЕФОН</p>
                    <p className="font-mono font-medium">{selectedCitizen.phone}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">ПРОФЕССИЯ</p>
                    <p className="font-mono font-medium">{selectedCitizen.occupation}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-mono text-xs text-muted-foreground">АДРЕС</p>
                    <p className="font-mono font-medium">{selectedCitizen.address}</p>
                  </div>
                  {selectedCitizen.notes && (
                    <div className="col-span-2">
                      <p className="font-mono text-xs text-muted-foreground">ПРИМЕЧАНИЯ</p>
                      <p className="font-mono font-medium">{selectedCitizen.notes}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="criminal" className="space-y-4">
                {canModify && (
                  <div className="border-2 border-dashed p-4 space-y-3">
                    <p className="font-mono text-xs font-medium">ДОБАВИТЬ ЗАПИСЬ</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Тип преступления"
                        value={newRecord.crimeType}
                        onChange={(e) => setNewRecord({ ...newRecord, crimeType: e.target.value })}
                        className="font-mono text-sm"
                      />
                      <Input 
                        type="date"
                        value={newRecord.dateCommitted}
                        onChange={(e) => setNewRecord({ ...newRecord, dateCommitted: e.target.value })}
                        className="font-mono text-sm"
                      />
                      <Textarea 
                        placeholder="Описание"
                        value={newRecord.description}
                        onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
                        className="font-mono text-sm col-span-2"
                      />
                      <select 
                        value={newRecord.severity}
                        onChange={(e) => setNewRecord({ ...newRecord, severity: e.target.value })}
                        className="border rounded-md px-3 py-2 font-mono text-sm"
                      >
                        <option value="minor">Легкая</option>
                        <option value="moderate">Средняя</option>
                        <option value="severe">Тяжкая</option>
                      </select>
                      <Button onClick={handleAddCriminalRecord} size="sm" className="font-mono">
                        ДОБАВИТЬ
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {selectedCitizen.criminalRecords?.map((record: any) => (
                    <Card key={record.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono font-medium">{record.crime_type}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">{record.description}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-2">
                              Дата: {record.date_committed}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant={record.severity === 'severe' ? 'destructive' : 'secondary'} className="font-mono text-xs">
                              {record.severity}
                            </Badge>
                            <Badge variant={record.status === 'active' ? 'default' : 'outline'} className="font-mono text-xs">
                              {record.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!selectedCitizen.criminalRecords?.length && (
                    <p className="text-center py-8 font-mono text-sm text-muted-foreground">Нет записей</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="fines" className="space-y-4">
                {canModify && (
                  <div className="border-2 border-dashed p-4 space-y-3">
                    <p className="font-mono text-xs font-medium">ДОБАВИТЬ ШТРАФ</p>
                    <div className="grid grid-cols-3 gap-3">
                      <Input 
                        type="number"
                        placeholder="Сумма"
                        value={newFine.amount}
                        onChange={(e) => setNewFine({ ...newFine, amount: e.target.value })}
                        className="font-mono text-sm"
                      />
                      <Input 
                        placeholder="Причина"
                        value={newFine.reason}
                        onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })}
                        className="font-mono text-sm col-span-2"
                      />
                      <Button onClick={handleAddFine} size="sm" className="font-mono col-span-3">
                        ДОБАВИТЬ
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  {selectedCitizen.fines?.map((fine: any) => (
                    <Card key={fine.id}>
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-mono font-medium">{fine.amount} ₽</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">{fine.reason}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-2">
                              {new Date(fine.issued_at).toLocaleString('ru-RU')}
                            </p>
                          </div>
                          <Badge 
                            variant={fine.status === 'paid' ? 'default' : fine.status === 'unpaid' ? 'destructive' : 'secondary'}
                            className="font-mono text-xs"
                          >
                            {fine.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {!selectedCitizen.fines?.length && (
                    <p className="text-center py-8 font-mono text-sm text-muted-foreground">Нет штрафов</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="warnings" className="space-y-4">
                {canModify && (
                  <div className="border-2 border-dashed p-4 space-y-3">
                    <p className="font-mono text-xs font-medium">ДОБАВИТЬ ПРЕДУПРЕЖДЕНИЕ</p>
                    <Textarea 
                      placeholder="Текст предупреждения"
                      value={newWarning.warningText}
                      onChange={(e) => setNewWarning({ ...newWarning, warningText: e.target.value })}
                      className="font-mono text-sm"
                    />
                    <Button onClick={handleAddWarning} size="sm" className="font-mono w-full">
                      ДОБАВИТЬ
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {selectedCitizen.warnings?.map((warning: any) => (
                    <Card key={warning.id}>
                      <CardContent className="pt-4">
                        <p className="font-mono text-sm">{warning.warning_text}</p>
                        <p className="font-mono text-xs text-muted-foreground mt-2">
                          {new Date(warning.issued_at).toLocaleString('ru-RU')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {!selectedCitizen.warnings?.length && (
                    <p className="text-center py-8 font-mono text-sm text-muted-foreground">Нет предупреждений</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CitizensTab;
