import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';

interface CourseProgress {
  courseId: number;
  title: string;
  coverImage: string;
  progressPercent: number;
  startedAt: string;
}

const ProgressPage = () => {
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const user = authService.getUser();

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/progress', {
        headers: { 'X-User-Id': user.userId.toString() }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data);
      } else {
        toast.error('Ошибка загрузки прогресса');
      }
    } catch (error) {
      toast.error('Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Мой прогресс</h1>
          <p className="text-muted-foreground mt-2">Отслеживайте свои достижения в обучении</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-1/3" />
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {courses.map((course) => (
              <Card key={course.courseId} className="overflow-hidden">
                <div className="h-32 overflow-hidden">
                  <img 
                    src={course.coverImage} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Начат {new Date(course.startedAt).toLocaleDateString('ru-RU')}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Прогресс</span>
                      <span className="font-semibold">{course.progressPercent}%</span>
                    </div>
                    <Progress value={course.progressPercent} />
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/course/${course.courseId}`)}
                  >
                    {course.progressPercent === 100 ? 'Повторить' : 'Продолжить'}
                    <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Icon name="TrendingUp" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Вы еще не начали обучение</h3>
            <p className="text-muted-foreground mb-6">Выберите курс и начните обучение прямо сейчас</p>
            <Button onClick={() => navigate('/courses')}>
              Перейти к курсам
            </Button>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default ProgressPage;
