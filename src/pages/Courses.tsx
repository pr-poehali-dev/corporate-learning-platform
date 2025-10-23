import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';

interface Course {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  durationHours: number;
  lessonsCount: number;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      
      if (response.ok) {
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

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Доступные курсы</h1>
          <p className="text-muted-foreground mt-2">Выберите курс для начала обучения</p>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/course/${course.id}`)}>
                <div className="h-48 overflow-hidden">
                  <img 
                    src={course.coverImage} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">
                      <Icon name="Clock" className="w-3 h-3 mr-1" />
                      {course.durationHours} ч
                    </Badge>
                    <Badge variant="secondary">
                      <Icon name="BookOpen" className="w-3 h-3 mr-1" />
                      {course.lessonsCount} уроков
                    </Badge>
                  </div>
                  <Button className="w-full">
                    Начать обучение
                    <Icon name="ArrowRight" className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && courses.length === 0 && (
          <Card className="p-12 text-center">
            <Icon name="BookX" className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Курсов пока нет</h3>
            <p className="text-muted-foreground">Новые курсы появятся в ближайшее время</p>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Courses;
