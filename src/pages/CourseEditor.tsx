import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';

interface Lesson {
  id?: number;
  title: string;
  contentType: 'text' | 'video' | 'quiz';
  contentData: any;
  orderIndex: number;
  durationMinutes: number;
}

const CourseEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getUser();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [durationHours, setDurationHours] = useState(0);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson>({
    title: '',
    contentType: 'text',
    contentData: { text: '' },
    orderIndex: 0,
    durationMinutes: 0
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/courses');
      return;
    }
    if (id) {
      loadCourse();
    }
  }, [id]);

  const loadCourse = async () => {
    try {
      const response = await fetch(`/api/courses?id=${id}`);
      if (response.ok) {
        const data = await response.json();
        setTitle(data.title);
        setDescription(data.description);
        setCoverImage(data.coverImage);
        setDurationHours(data.durationHours);
        setLessons(data.lessons || []);
      }
    } catch (error) {
      toast.error('Ошибка загрузки курса');
    }
  };

  const saveCourse = async () => {
    if (!title) {
      toast.error('Введите название курса');
      return;
    }

    if (!user) return;

    try {
      const response = await fetch('/api/admin-courses', {
        method: id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId.toString()
        },
        body: JSON.stringify({
          ...(id && { id: Number(id) }),
          title,
          description,
          coverImage,
          durationHours
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(id ? 'Курс обновлен' : 'Курс создан');
        if (!id) {
          navigate(`/admin/editor/${data.id}`);
        }
      }
    } catch (error) {
      toast.error('Ошибка сохранения курса');
    }
  };

  const addLesson = async () => {
    if (!currentLesson.title) {
      toast.error('Введите название урока');
      return;
    }

    if (!id) {
      toast.error('Сначала сохраните курс');
      return;
    }

    if (!user) return;

    try {
      const response = await fetch('/api/admin-lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user.userId.toString()
        },
        body: JSON.stringify({
          courseId: Number(id),
          ...currentLesson,
          orderIndex: lessons.length + 1
        })
      });

      if (response.ok) {
        const data = await response.json();
        setLessons([...lessons, data]);
        setCurrentLesson({
          title: '',
          contentType: 'text',
          contentData: { text: '' },
          orderIndex: 0,
          durationMinutes: 0
        });
        toast.success('Урок добавлен');
      }
    } catch (error) {
      toast.error('Ошибка добавления урока');
    }
  };

  const renderContentEditor = () => {
    switch (currentLesson.contentType) {
      case 'text':
        return (
          <div className="space-y-3">
            <Textarea
              placeholder="Текст урока"
              value={currentLesson.contentData.text || ''}
              onChange={(e) => setCurrentLesson({
                ...currentLesson,
                contentData: { ...currentLesson.contentData, text: e.target.value }
              })}
              rows={6}
            />
            <Input
              placeholder="URL изображения (опционально)"
              value={currentLesson.contentData.images?.[0] || ''}
              onChange={(e) => setCurrentLesson({
                ...currentLesson,
                contentData: { ...currentLesson.contentData, images: [e.target.value] }
              })}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-3">
            <Input
              placeholder="URL видео"
              value={currentLesson.contentData.video_url || ''}
              onChange={(e) => setCurrentLesson({
                ...currentLesson,
                contentData: { ...currentLesson.contentData, video_url: e.target.value }
              })}
            />
            <Textarea
              placeholder="Описание видео"
              value={currentLesson.contentData.description || ''}
              onChange={(e) => setCurrentLesson({
                ...currentLesson,
                contentData: { ...currentLesson.contentData, description: e.target.value }
              })}
              rows={3}
            />
          </div>
        );
      
      case 'quiz':
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Для создания теста используйте JSON формат с вопросами и вариантами ответов
            </p>
            <Textarea
              placeholder='{"questions": [{"question": "Вопрос?", "options": ["А", "Б", "В"], "correct": 0}]}'
              value={JSON.stringify(currentLesson.contentData, null, 2)}
              onChange={(e) => {
                try {
                  setCurrentLesson({
                    ...currentLesson,
                    contentData: JSON.parse(e.target.value)
                  });
                } catch {}
              }}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
        );
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Button variant="ghost" onClick={() => navigate('/admin')}>
              <Icon name="ArrowLeft" className="w-4 h-4 mr-2" />
              Назад
            </Button>
          </div>
          <Button onClick={saveCourse}>
            <Icon name="Save" className="w-4 h-4 mr-2" />
            Сохранить курс
          </Button>
        </div>

        <Tabs defaultValue="general">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Общая информация</TabsTrigger>
            <TabsTrigger value="lessons">Уроки ({lessons.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Информация о курсе</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Название</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Введите название курса"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Описание</label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опишите курс"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">URL обложки</label>
                  <Input
                    value={coverImage}
                    onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                  {coverImage && (
                    <img 
                      src={coverImage} 
                      alt="Preview" 
                      className="mt-2 h-32 object-cover rounded"
                    />
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Длительность (часы)</label>
                  <Input
                    type="number"
                    value={durationHours}
                    onChange={(e) => setDurationHours(Number(e.target.value))}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lessons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Добавить урок</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Название урока</label>
                  <Input
                    value={currentLesson.title}
                    onChange={(e) => setCurrentLesson({ ...currentLesson, title: e.target.value })}
                    placeholder="Введите название урока"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Тип контента</label>
                    <Select
                      value={currentLesson.contentType}
                      onValueChange={(value: any) => setCurrentLesson({
                        ...currentLesson,
                        contentType: value,
                        contentData: value === 'text' ? { text: '' } : value === 'video' ? { video_url: '', description: '' } : { questions: [] }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Текст</SelectItem>
                        <SelectItem value="video">Видео</SelectItem>
                        <SelectItem value="quiz">Тест</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Длительность (мин)</label>
                    <Input
                      type="number"
                      value={currentLesson.durationMinutes}
                      onChange={(e) => setCurrentLesson({ ...currentLesson, durationMinutes: Number(e.target.value) })}
                    />
                  </div>
                </div>

                {renderContentEditor()}

                <Button onClick={addLesson} className="w-full">
                  <Icon name="Plus" className="w-4 h-4 mr-2" />
                  Добавить урок
                </Button>
              </CardContent>
            </Card>

            {lessons.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Уроки курса</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lessons.map((lesson, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 border rounded">
                        <span className="font-semibold text-muted-foreground">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="font-medium">{lesson.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {lesson.contentType} • {lesson.durationMinutes} мин
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default CourseEditor;
