import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface LoginPageProps {
  onLogin: (user: any) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('https://api.poehali.dev/v0/sql-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `SELECT id, username, role, full_name, badge_number FROM users WHERE username = '${username}' AND password_hash = '${password}hash' LIMIT 1`
        })
      });

      const data = await response.json();
      
      if (data.rows && data.rows.length > 0) {
        const user = data.rows[0];
        onLogin({
          id: user.id,
          username: user.username,
          role: user.role,
          fullName: user.full_name,
          badgeNumber: user.badge_number
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Ошибка входа',
          description: 'Неверное имя пользователя или пароль'
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Не удалось выполнить вход'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-[400px] border-2">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-sm flex items-center justify-center">
              <Icon name="Shield" className="w-10 h-10 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-mono tracking-tight">
            ПОЛИЦЕЙСКАЯ БД
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center font-mono">
            СИСТЕМА АВТОРИЗАЦИИ
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-mono font-medium">ЛОГИН</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Введите логин"
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-mono font-medium">ПАРОЛЬ</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                className="font-mono"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-mono font-medium"
              disabled={isLoading}
            >
              {isLoading ? 'ВХОД...' : 'ВОЙТИ'}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t text-xs text-muted-foreground font-mono space-y-1">
            <p>Тестовые аккаунты:</p>
            <p>admin / admin123 (АДМИН)</p>
            <p>moderator / mod123 (МОДЕРАТОР)</p>
            <p>officer / user123 (ПОЛЬЗОВАТЕЛЬ)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
