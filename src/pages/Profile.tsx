import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { authService } from '@/lib/auth';

const Profile = () => {
  const user = authService.getUser();

  if (!user) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Личный профиль</h1>
          <p className="text-muted-foreground mt-2">Ваша информация и настройки</p>
        </div>

        <Card>
          <CardHeader className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
                {user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{user.fullName}</CardTitle>
            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="mx-auto">
              {user.role === 'admin' ? 'Администратор' : 'Студент'}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center gap-3">
                <Icon name="Phone" className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Телефон</p>
                  <p className="font-medium">{user.phone}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Icon name="User" className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">ID пользователя</p>
                  <p className="font-medium">{user.userId}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
