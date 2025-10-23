import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';
import Icon from '@/components/ui/icon';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!phone) {
      toast.error('Введите номер телефона');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (response.ok) {
        authService.setUser(data);
        toast.success('Вход выполнен успешно');
        navigate('/courses');
      } else {
        toast.error(data.error || 'Пользователь не найден');
      }
    } catch (error) {
      toast.error('Ошибка подключения к серверу');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Icon name="GraduationCap" className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Корпоративное обучение</CardTitle>
          <CardDescription>Войдите в систему для доступа к курсам</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Номер телефона или логин</label>
            <Input
              type="text"
              placeholder="40ebc4-001"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <p className="text-xs text-muted-foreground">
              Тестовый логин: 40ebc4-001
            </p>
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Вход...' : 'Войти'}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/register')}
              className="text-sm"
            >
              Зарегистрироваться
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
