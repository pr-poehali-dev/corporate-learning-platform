import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';
import Icon from '@/components/ui/icon';

const Register = () => {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async () => {
    if (!phone || !fullName) {
      toast.error('Заполните все поля');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, fullName })
      });

      const data = await response.json();

      if (response.ok) {
        authService.setUser(data);
        toast.success('Регистрация успешна');
        navigate('/courses');
      } else {
        toast.error(data.error || 'Ошибка регистрации');
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
            <Icon name="UserPlus" className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>Создайте аккаунт для доступа к курсам</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">ФИО</label>
            <Input
              type="text"
              placeholder="Иван Иванов"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Номер телефона</label>
            <Input
              type="tel"
              placeholder="+7 (999) 123-45-67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
            />
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
          </Button>

          <div className="text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/login')}
              className="text-sm"
            >
              Уже есть аккаунт? Войти
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
