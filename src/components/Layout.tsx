import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authService } from '@/lib/auth';
import Icon from '@/components/ui/icon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/courses', label: 'Курсы', icon: 'BookOpen' },
    { path: '/progress', label: 'Мой прогресс', icon: 'TrendingUp' },
    { path: '/certificates', label: 'Сертификаты', icon: 'Award' },
    { path: '/profile', label: 'Профиль', icon: 'User' },
  ];

  if (user?.role === 'admin') {
    navItems.push(
      { path: '/admin', label: 'Панель админа', icon: 'Settings' },
      { path: '/admin/editor', label: 'Редактор курсов', icon: 'Edit' }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Icon name="GraduationCap" className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold">Корпоративное обучение</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                      {user.fullName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:inline">{user.fullName}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <Icon name="LogOut" className="w-4 h-4 mr-2" />
                  Выйти
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                className="rounded-none border-b-2"
                onClick={() => navigate(item.path)}
              >
                <Icon name={item.icon as any} className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;
