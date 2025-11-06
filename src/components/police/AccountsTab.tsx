import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { MOCK_USERS } from '@/utils/mockData';

interface User {
  id: number;
  username: string;
  role: string;
  fullName: string;
  badgeNumber: string;
}

interface AccountsTabProps {
  currentUser: User;
}

const ROLE_LABELS = {
  admin: 'АДМИНИСТРАТОР',
  moderator: 'МОДЕРАТОР',
  user: 'ПОЛЬЗОВАТЕЛЬ'
};

const ROLE_COLORS = {
  admin: 'destructive',
  moderator: 'default',
  user: 'secondary'
} as const;

const AccountsTab = ({ currentUser }: AccountsTabProps) => {
  const [users, setUsers] = useState<any[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    badgeNumber: '',
    role: 'user'
  });

  const [editUser, setEditUser] = useState({
    username: '',
    fullName: '',
    badgeNumber: '',
    role: 'user',
    newPassword: ''
  });

  const isAdmin = currentUser.role === 'admin';

  const fetchUsers = () => {
    setIsLoading(true);
    // ⚠️ ИСПОЛЬЗУЮТСЯ MOCK-ДАННЫЕ (БД временно отключена из-за лимита)
    setTimeout(() => {
      setUsers(MOCK_USERS);
      setIsLoading(false);
    }, 300);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const handleAddUser = () => {
    if (!isAdmin) return;
    
    if (!newUser.username || !newUser.password || !newUser.fullName || !newUser.badgeNumber) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Заполните все обязательные поля' });
      return;
    }

    // ⚠️ MOCK-РЕЖИМ: БД отключена
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов. Добавление недоступно.' });
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setEditUser({
      username: user.username,
      fullName: user.full_name,
      badgeNumber: user.badge_number,
      role: user.role,
      newPassword: ''
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!isAdmin || !editingUser) return;
    
    if (!editUser.username || !editUser.fullName || !editUser.badgeNumber) {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Заполните все обязательные поля' });
      return;
    }

    // ⚠️ MOCK-РЕЖИМ: БД отключена
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов. Изменение недоступно.' });
  };

  const handleDeleteUser = (userId: number) => {
    if (!isAdmin) return;
    
    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin') {
      toast({ variant: 'destructive', title: 'Ошибка', description: 'Невозможно удалить администратора' });
      return;
    }

    // ⚠️ MOCK-РЕЖИМ: БД отключена
    toast({ variant: 'destructive', title: 'MOCK-РЕЖИМ', description: 'База данных временно отключена из-за лимита запросов. Удаление недоступно.' });
  };

  if (!isAdmin) {
    return (
      <Card className="border-2">
        <CardContent className="p-8 text-center">
          <Icon name="Lock" className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="font-mono text-muted-foreground">Доступ запрещен. Только для администраторов.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-mono text-lg">УПРАВЛЕНИЕ АККАУНТАМИ</CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={fetchUsers}
                disabled={isLoading}
                className="font-mono"
              >
                <Icon name="RefreshCw" className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'ЗАГРУЗКА...' : 'ОБНОВИТЬ'}
              </Button>
              <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="font-mono">
                <Icon name="Plus" className="w-4 h-4 mr-2" />
                ДОБАВИТЬ АККАУНТ
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 font-mono text-muted-foreground">Загрузка...</div>
          ) : (
            <div className="border-2 rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="font-mono text-xs">ID</TableHead>
                    <TableHead className="font-mono text-xs">ЛОГИН</TableHead>
                    <TableHead className="font-mono text-xs">ФИО</TableHead>
                    <TableHead className="font-mono text-xs">ЖЕТОН</TableHead>
                    <TableHead className="font-mono text-xs">РОЛЬ</TableHead>
                    <TableHead className="font-mono text-xs">СОЗДАН</TableHead>
                    <TableHead className="font-mono text-xs">ДЕЙСТВИЯ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-blue-50">
                      <TableCell className="font-mono text-xs">{user.id}</TableCell>
                      <TableCell className="font-mono text-xs font-bold">{user.username}</TableCell>
                      <TableCell className="font-mono text-xs">{user.full_name}</TableCell>
                      <TableCell className="font-mono text-xs">{user.badge_number}</TableCell>
                      <TableCell>
                        <Badge variant={ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]} className="font-mono text-xs">
                          {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(user)}
                            className="font-mono text-xs"
                          >
                            <Icon name="Edit" className="w-3 h-3" />
                          </Button>
                          {user.role !== 'admin' && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                              className="font-mono text-xs"
                            >
                              <Icon name="Trash2" className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Диалог добавления */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">СОЗДАТЬ АККАУНТ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-xs">ЛОГИН</Label>
                <Input 
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="username"
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">ПАРОЛЬ</Label>
                <Input 
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  className="font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="font-mono text-xs">ПОЛНОЕ ИМЯ</Label>
              <Input 
                value={newUser.fullName}
                onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                placeholder="Иван Иванов"
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-mono text-xs">НОМЕР ЖЕТОНА</Label>
                <Input 
                  value={newUser.badgeNumber}
                  onChange={(e) => setNewUser({ ...newUser, badgeNumber: e.target.value })}
                  placeholder="B-1234"
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">РОЛЬ</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger className="font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user" className="font-mono">ПОЛЬЗОВАТЕЛЬ</SelectItem>
                    <SelectItem value="moderator" className="font-mono">МОДЕРАТОР</SelectItem>
                    <SelectItem value="admin" className="font-mono">АДМИНИСТРАТОР</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddUser} className="w-full font-mono">
              СОЗДАТЬ АККАУНТ
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-mono">РЕДАКТИРОВАТЬ АККАУНТ #{editingUser?.id}</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              <div>
                <Label className="font-mono text-xs">ЛОГИН</Label>
                <Input 
                  value={editUser.username}
                  onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div>
                <Label className="font-mono text-xs">ПОЛНОЕ ИМЯ</Label>
                <Input 
                  value={editUser.fullName}
                  onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  className="font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-mono text-xs">НОМЕР ЖЕТОНА</Label>
                  <Input 
                    value={editUser.badgeNumber}
                    onChange={(e) => setEditUser({ ...editUser, badgeNumber: e.target.value })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <Label className="font-mono text-xs">РОЛЬ</Label>
                  <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v })}>
                    <SelectTrigger className="font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user" className="font-mono">ПОЛЬЗОВАТЕЛЬ</SelectItem>
                      <SelectItem value="moderator" className="font-mono">МОДЕРАТОР</SelectItem>
                      <SelectItem value="admin" className="font-mono">АДМИНИСТРАТОР</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="font-mono text-xs">НОВЫЙ ПАРОЛЬ (оставьте пустым, чтобы не менять)</Label>
                <Input 
                  type="password"
                  value={editUser.newPassword}
                  onChange={(e) => setEditUser({ ...editUser, newPassword: e.target.value })}
                  placeholder="••••••••"
                  className="font-mono"
                />
              </div>
              <Button onClick={handleUpdateUser} className="w-full font-mono">
                СОХРАНИТЬ ИЗМЕНЕНИЯ
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountsTab;
