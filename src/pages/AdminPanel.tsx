import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';

interface AdminCourse {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  durationHours: number;
  isPublished: boolean;
  lessonsCount: number;
}

const AdminPanel = () => {
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = authService.getUser();

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/courses');
      return;
    }
    loadCourses();
  }, []);

  const loadCourses = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin-courses', {
        headers: { 'X-User-Id': user.userId.toString() }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        toast.error('Ошибка загрузки курсов');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublish = async (courseId: number, isPublished: boolean) => {
    if (!user) return;

    try {
      const response = await fetch('/api/admin-courses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId.toString()
        },
        body: JSON.stringify({
          id: courseId,
          isPublished: !isPublished
        })
      });

      if (response.ok) {
        setCourses(courses.map(c => 
          c.id === courseId ? { ...c, isPublished: !isPublished } : c
        ));
        toast.success(isPublished ? 'Курс снят с публикации' : 'Курс опубликован');
      }
    } catch (error) {
      toast.error('Ошибка обновления курса');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Панель администратора</h1>
            <p className="text-muted-foreground mt-2">Управление курсами и контентом</p>
          </div>
          <Button onClick={() => navigate('/admin/editor')}>
            <Icon name="Plus" className="w-4 h-4 mr-2" />
            Создать курс
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Всего курсов</CardTitle>
              <Icon name="BookOpen" className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{courses.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Опубликовано</CardTitle>
              <Icon name="CheckCircle2" className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.filter(c => c.isPublished).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">В разработке</CardTitle>
              <Icon name="Clock" className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.filter(c => !c.isPublished).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Все курсы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {courses.map((course) => (
                  <div 
                    key={course.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img 
                        src={course.coverImage} 
                        alt={course.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {course.lessonsCount} уроков
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {course.durationHours} ч
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {course.isPublished ? 'Опубликован' : 'Черновик'}
                        </span>
                        <Switch
                          checked={course.isPublished}
                          onCheckedChange={() => togglePublish(course.id, course.isPublished)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/editor/${course.id}`)}
                      >
                        <Icon name="Edit" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {courses.length === 0 && (
                  <div className="text-center py-12">
                    <Icon name="BookX" className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Курсов пока нет</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default AdminPanel;
