'''
Business: Track and get user learning progress
Args: event with httpMethod, body for POST, query params for GET
Returns: Progress data or update confirmation
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers_dict = event.get('headers', {})
    user_id = headers_dict.get('X-User-Id') or headers_dict.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'User ID required'})
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    if method == 'GET':
        params = event.get('queryStringParameters', {}) or {}
        course_id = params.get('courseId')
        
        if course_id:
            cur.execute(
                """SELECT ucp.progress_percent, ucp.started_at, ucp.completed_at,
                          c.title, c.cover_image
                   FROM user_course_progress ucp
                   JOIN courses c ON ucp.course_id = c.id
                   WHERE ucp.user_id = %s AND ucp.course_id = %s""",
                (user_id, course_id)
            )
            progress = cur.fetchone()
            
            if progress:
                result = {
                    'progressPercent': progress[0],
                    'startedAt': progress[1].isoformat() if progress[1] else None,
                    'completedAt': progress[2].isoformat() if progress[2] else None,
                    'courseTitle': progress[3],
                    'coverImage': progress[4]
                }
            else:
                result = {'progressPercent': 0}
        else:
            cur.execute(
                """SELECT c.id, c.title, c.cover_image, ucp.progress_percent, ucp.started_at
                   FROM user_course_progress ucp
                   JOIN courses c ON ucp.course_id = c.id
                   WHERE ucp.user_id = %s
                   ORDER BY ucp.started_at DESC""",
                (user_id,)
            )
            courses = cur.fetchall()
            
            result = [{
                'courseId': c[0],
                'title': c[1],
                'coverImage': c[2],
                'progressPercent': c[3],
                'startedAt': c[4].isoformat() if c[4] else None
            } for c in courses]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result)
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        course_id = body_data.get('courseId')
        lesson_id = body_data.get('lessonId')
        completed = body_data.get('completed', False)
        
        if not course_id or not lesson_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'courseId and lessonId required'})
            }
        
        cur.execute(
            """INSERT INTO user_course_progress (user_id, course_id)
               VALUES (%s, %s)
               ON CONFLICT (user_id, course_id) DO NOTHING""",
            (user_id, course_id)
        )
        
        if completed:
            cur.execute(
                """INSERT INTO user_lesson_progress (user_id, lesson_id, completed, completed_at)
                   VALUES (%s, %s, true, CURRENT_TIMESTAMP)
                   ON CONFLICT (user_id, lesson_id) 
                   DO UPDATE SET completed = true, completed_at = CURRENT_TIMESTAMP""",
                (user_id, lesson_id)
            )
        
        cur.execute("SELECT COUNT(*) FROM lessons WHERE course_id = %s", (course_id,))
        total_lessons = cur.fetchone()[0]
        
        cur.execute(
            """SELECT COUNT(*) FROM user_lesson_progress
               WHERE user_id = %s AND lesson_id IN (SELECT id FROM lessons WHERE course_id = %s)
               AND completed = true""",
            (user_id, course_id)
        )
        completed_lessons = cur.fetchone()[0]
        
        progress_percent = int((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        cur.execute(
            """UPDATE user_course_progress
               SET progress_percent = %s
               WHERE user_id = %s AND course_id = %s""",
            (progress_percent, user_id, course_id)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'progressPercent': progress_percent})
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }