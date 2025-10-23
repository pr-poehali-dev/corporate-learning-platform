-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image TEXT,
    duration_hours INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT false
);

-- Create lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_data JSONB NOT NULL,
    order_index INTEGER NOT NULL,
    duration_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create user_course_progress table
CREATE TABLE user_course_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percent INTEGER DEFAULT 0,
    UNIQUE(user_id, course_id)
);

-- Create user_lesson_progress table
CREATE TABLE user_lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    lesson_id INTEGER REFERENCES lessons(id),
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    UNIQUE(user_id, lesson_id)
);

-- Create certificates table
CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    course_id INTEGER REFERENCES courses(id),
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    certificate_url TEXT,
    UNIQUE(user_id, course_id)
);

-- Insert test admin user
INSERT INTO users (phone, full_name, role) VALUES ('+79999999999', 'Администратор', 'admin');

-- Insert test student
INSERT INTO users (phone, full_name, role) VALUES ('40ebc4-001', 'Тестовый ученик', 'student');

-- Insert sample course
INSERT INTO courses (title, description, cover_image, duration_hours, created_by, is_published) 
VALUES (
    'Основы корпоративной этики',
    'Курс для новых сотрудников компании о корпоративных ценностях, правилах поведения и взаимодействия в коллективе',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
    4,
    1,
    true
);

-- Insert sample lessons
INSERT INTO lessons (course_id, title, content_type, content_data, order_index, duration_minutes) VALUES
(1, 'Введение в корпоративную культуру', 'video', '{"video_url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "description": "Знакомство с корпоративной культурой компании"}', 1, 15),
(1, 'Ценности компании', 'text', '{"text": "Наши основные ценности: честность, профессионализм, инновации, командная работа. Каждый сотрудник должен следовать этим принципам в работе.", "images": ["https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800"]}', 2, 20),
(1, 'Тест: Корпоративная этика', 'quiz', '{"questions": [{"question": "Какая главная ценность компании?", "options": ["Прибыль", "Честность", "Скорость", "Экономия"], "correct": 1}, {"question": "Как решать конфликты?", "options": ["Игнорировать", "Через диалог", "Жаловаться руководству", "Увольняться"], "correct": 1}]}', 3, 10),
(1, 'Правила делового общения', 'text', '{"text": "Деловое общение должно быть вежливым, конструктивным и профессиональным. Избегайте личных нападок и эмоциональных реакций.", "images": []}', 4, 15);