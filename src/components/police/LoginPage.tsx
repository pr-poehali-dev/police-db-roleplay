import { useState, useEffect } from 'react';
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
  const [rememberMe, setRememberMe] = useState(false);
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
          query: `SELECT id, username, role, full_name, badge_number, password_hash FROM users WHERE username = '${username}' LIMIT 1`
        })
      });

      const data = await response.json();
      
      if (data.rows && data.rows.length > 0) {
        const user = data.rows[0];
        const expectedHash = password + 'hash';
        
        if (user.password_hash === expectedHash) {
          const userData = {
            id: user.id,
            username: user.username,
            role: user.role,
            fullName: user.full_name,
            badgeNumber: user.badge_number
          };
          
          const expiresAt = Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 60 * 60 * 1000);
          const sessionData = { user: userData, expiresAt };
          
          localStorage.setItem('policeSession', JSON.stringify(sessionData));
          onLogin(userData);
        } else {
          toast({
            variant: 'destructive',
            title: 'Ошибка входа',
            description: 'Неверное имя пользователя или пароль'
          });
        }
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
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-input"
              />
              <label htmlFor="rememberMe" className="text-sm font-mono font-medium cursor-pointer">
                ЗАПОМНИТЬ МЕНЯ
              </label>
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