import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useNavigate } from 'react-router-dom';

const Certificates = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Мои сертификаты</h1>
          <p className="text-muted-foreground mt-2">Ваши достижения и подтверждения квалификации</p>
        </div>

        <Card className="p-12 text-center">
          <Icon name="Award" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Сертификатов пока нет</h3>
          <p className="text-muted-foreground mb-6">
            Завершите курс с прогрессом 100%, чтобы получить сертификат
          </p>
          <Button onClick={() => navigate('/courses')}>
            Перейти к курсам
          </Button>
        </Card>
      </div>
    </Layout>
  );
};

export default Certificates;
