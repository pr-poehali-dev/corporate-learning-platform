'''
Business: Admin API to create and manage courses
Args: event with httpMethod, body for POST/PUT
Returns: Course data or update confirmation
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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
    
    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    
    if not user or user[0] != 'admin':
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Admin access required'})
        }
    
    if method == 'GET':
        cur.execute(
            """SELECT c.id, c.title, c.description, c.cover_image, c.duration_hours, c.is_published,
                      COUNT(l.id) as lessons_count
               FROM courses c
               LEFT JOIN lessons l ON c.id = l.course_id
               GROUP BY c.id
               ORDER BY c.created_at DESC"""
        )
        courses = cur.fetchall()
        
        result = [{
            'id': c[0],
            'title': c[1],
            'description': c[2],
            'coverImage': c[3],
            'durationHours': c[4],
            'isPublished': c[5],
            'lessonsCount': c[6]
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
        title = body_data.get('title', '')
        description = body_data.get('description', '')
        cover_image = body_data.get('coverImage', '')
        duration_hours = body_data.get('durationHours', 0)
        
        if not title:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Title required'})
            }
        
        cur.execute(
            """INSERT INTO courses (title, description, cover_image, duration_hours, created_by)
               VALUES (%s, %s, %s, %s, %s)
               RETURNING id, title, description, cover_image, duration_hours, is_published""",
            (title, description, cover_image, duration_hours, user_id)
        )
        course = cur.fetchone()
        conn.commit()
        
        result = {
            'id': course[0],
            'title': course[1],
            'description': course[2],
            'coverImage': course[3],
            'durationHours': course[4],
            'isPublished': course[5]
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result)
        }
    
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        course_id = body_data.get('id')
        title = body_data.get('title')
        description = body_data.get('description')
        cover_image = body_data.get('coverImage')
        duration_hours = body_data.get('durationHours')
        is_published = body_data.get('isPublished')
        
        if not course_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Course ID required'})
            }
        
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = %s")
            params.append(title)
        if description is not None:
            updates.append("description = %s")
            params.append(description)
        if cover_image is not None:
            updates.append("cover_image = %s")
            params.append(cover_image)
        if duration_hours is not None:
            updates.append("duration_hours = %s")
            params.append(duration_hours)
        if is_published is not None:
            updates.append("is_published = %s")
            params.append(is_published)
        
        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            params.append(course_id)
            
            query = f"UPDATE courses SET {', '.join(updates)} WHERE id = %s RETURNING id, title, is_published"
            cur.execute(query, params)
            course = cur.fetchone()
            conn.commit()
            
            result = {
                'id': course[0],
                'title': course[1],
                'isPublished': course[2]
            }
        else:
            result = {'message': 'No updates provided'}
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result)
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }