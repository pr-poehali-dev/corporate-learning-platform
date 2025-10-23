'''
Business: Get all published courses or single course details
Args: event with httpMethod, queryStringParameters
Returns: List of courses or single course with lessons
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters', {}) or {}
        course_id = params.get('id')
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        if course_id:
            cur.execute(
                """SELECT c.id, c.title, c.description, c.cover_image, c.duration_hours, c.is_published,
                          u.full_name as creator_name
                   FROM courses c
                   LEFT JOIN users u ON c.created_by = u.id
                   WHERE c.id = %s""",
                (course_id,)
            )
            course = cur.fetchone()
            
            if not course:
                cur.close()
                conn.close()
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Course not found'})
                }
            
            cur.execute(
                """SELECT id, title, content_type, content_data, order_index, duration_minutes
                   FROM lessons
                   WHERE course_id = %s
                   ORDER BY order_index""",
                (course_id,)
            )
            lessons = cur.fetchall()
            
            result = {
                'id': course[0],
                'title': course[1],
                'description': course[2],
                'coverImage': course[3],
                'durationHours': course[4],
                'isPublished': course[5],
                'creatorName': course[6],
                'lessons': [{
                    'id': l[0],
                    'title': l[1],
                    'contentType': l[2],
                    'contentData': l[3],
                    'orderIndex': l[4],
                    'durationMinutes': l[5]
                } for l in lessons]
            }
        else:
            cur.execute(
                """SELECT c.id, c.title, c.description, c.cover_image, c.duration_hours,
                          COUNT(l.id) as lessons_count
                   FROM courses c
                   LEFT JOIN lessons l ON c.id = l.course_id
                   WHERE c.is_published = true
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
                'lessonsCount': c[5]
            } for c in courses]
        
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