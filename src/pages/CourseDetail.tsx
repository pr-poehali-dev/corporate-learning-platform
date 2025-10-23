import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';

interface Lesson {
  id: number;
  title: string;
  contentType: string;
  contentData: any;
  orderIndex: number;
  durationMinutes: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  coverImage: string;
  durationHours: number;
  isPublished: boolean;
  creatorName: string;
  lessons: Lesson[];
}

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const user = authService.getUser();

  useEffect(() => {
    loadCourse();
    loadProgress();
  }, [id]);

  const loadCourse = async () => {
    try {
      const response = await fetch(`/api/courses?id=${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCourse(data);
      } else {
        toast.error('Курс не найден');
        navigate('/courses');
      }
    } catch (error) {
      toast.error('Ошибка загрузки курса');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgress = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/progress?courseId=${id}`, {
        headers: { 'X-User-Id': user.userId.toString() }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProgress(data.progressPercent || 0);
      }
    } catch (error) {
      console.error('Failed to load progress');
    }
  };

  const handleCompleteLesson = async (lessonId: number) => {
    if (!user) return;

    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId.toString()
        },
        body: JSON.stringify({
          courseId: Number(id),
          lessonId,
          completed: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCompletedLessons(prev => new Set(prev).add(lessonId));
        setProgress(data.progressPercent);
        toast.success('Урок завершен');
      }
    } catch (error) {
      toast.error('Ошибка сохранения прогресса');
    }
  };

  const renderLessonContent = (lesson: Lesson) => {
    switch (lesson.contentType) {
      case 'video':
        return (
          <div className="space-y-3">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <Icon name="Video" className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{lesson.contentData.description}</p>
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{lesson.contentData.text}</p>
            {lesson.contentData.images?.map((img: string, idx: number) => (
              <img key={idx} src={img} alt="" className="rounded-lg w-full" />
            ))}
          </div>
        );
      
      case 'quiz':
        return (
          <div className="space-y-4">
            {lesson.contentData.questions?.map((q: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-base">{q.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {q.options?.map((opt: string, optIdx: number) => (
                    <Button
                      key={optIdx}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        if (optIdx === q.correct) {
                          toast.success('Правильно!');
                        } else {
                          toast.error('Неверно, попробуйте еще раз');
                        }
                      }}
                    >
                      {opt}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        );
      
      default:
        return <p className="text-muted-foreground">Неизвестный тип контента</p>;
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse space-y-4">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
      </Layout>
    );
  }

  if (!course) return null;

  return (
    <Layout>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/courses')}>
          <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
          Назад к курсам
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="h-64 overflow-hidden">
                <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">{course.title}</CardTitle>
                <p className="text-muted-foreground">{course.description}</p>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Программа курса</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {course.lessons.map((lesson) => (
                    <AccordionItem key={lesson.id} value={`lesson-${lesson.id}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-left">
                          {completedLessons.has(lesson.id) ? (
                            <Icon name="CheckCircle2" className="w-5 h-5 text-green-600 flex-shrink-0" />
                          ) : (
                            <Icon name="Circle" className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                          )}
                          <span>{lesson.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        {renderLessonContent(lesson)}
                        {!completedLessons.has(lesson.id) && (
                          <Button 
                            onClick={() => handleCompleteLesson(lesson.id)}
                            className="w-full"
                          >
                            Завершить урок
                          </Button>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ваш прогресс</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Пройдено</span>
                    <span className="font-semibold">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Clock" className="w-4 h-4 text-muted-foreground" />
                    <span>{course.durationHours} часов</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="BookOpen" className="w-4 h-4 text-muted-foreground" />
                    <span>{course.lessons.length} уроков</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="User" className="w-4 h-4 text-muted-foreground" />
                    <span>{course.creatorName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {progress === 100 && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Icon name="Award" className="w-5 h-5" />
                    Курс завершен!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => navigate('/certificates')}>
                    Получить сертификат
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseDetail;
