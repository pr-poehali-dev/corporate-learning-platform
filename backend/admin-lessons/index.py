'''
Business: Admin API to create and manage course lessons
Args: event with httpMethod, body for POST/PUT
Returns: Lesson data or update confirmation
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
                'Access-Control-Allow-Methods': 'POST, PUT, OPTIONS',
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
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        course_id = body_data.get('courseId')
        title = body_data.get('title', '')
        content_type = body_data.get('contentType', '')
        content_data = body_data.get('contentData', {})
        order_index = body_data.get('orderIndex', 0)
        duration_minutes = body_data.get('durationMinutes', 0)
        
        if not course_id or not title or not content_type:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'courseId, title and contentType required'})
            }
        
        cur.execute(
            """INSERT INTO lessons (course_id, title, content_type, content_data, order_index, duration_minutes)
               VALUES (%s, %s, %s, %s, %s, %s)
               RETURNING id, course_id, title, content_type, content_data, order_index, duration_minutes""",
            (course_id, title, content_type, json.dumps(content_data), order_index, duration_minutes)
        )
        lesson = cur.fetchone()
        conn.commit()
        
        result = {
            'id': lesson[0],
            'courseId': lesson[1],
            'title': lesson[2],
            'contentType': lesson[3],
            'contentData': lesson[4],
            'orderIndex': lesson[5],
            'durationMinutes': lesson[6]
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
        lesson_id = body_data.get('id')
        title = body_data.get('title')
        content_type = body_data.get('contentType')
        content_data = body_data.get('contentData')
        order_index = body_data.get('orderIndex')
        duration_minutes = body_data.get('durationMinutes')
        
        if not lesson_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Lesson ID required'})
            }
        
        updates = []
        params = []
        
        if title is not None:
            updates.append("title = %s")
            params.append(title)
        if content_type is not None:
            updates.append("content_type = %s")
            params.append(content_type)
        if content_data is not None:
            updates.append("content_data = %s")
            params.append(json.dumps(content_data))
        if order_index is not None:
            updates.append("order_index = %s")
            params.append(order_index)
        if duration_minutes is not None:
            updates.append("duration_minutes = %s")
            params.append(duration_minutes)
        
        if updates:
            params.append(lesson_id)
            query = f"UPDATE lessons SET {', '.join(updates)} WHERE id = %s RETURNING id, title"
            cur.execute(query, params)
            lesson = cur.fetchone()
            conn.commit()
            
            result = {
                'id': lesson[0],
                'title': lesson[1]
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