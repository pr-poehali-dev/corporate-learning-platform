'''
Business: Register new student by phone
Args: event with httpMethod, body containing phone and full_name
Returns: New user info
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
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        phone = body_data.get('phone', '')
        full_name = body_data.get('fullName', '')
        
        if not phone or not full_name:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Phone and fullName required'})
            }
        
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        cur = conn.cursor()
        
        cur.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        existing = cur.fetchone()
        
        if existing:
            cur.close()
            conn.close()
            return {
                'statusCode': 409,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User already exists'})
            }
        
        cur.execute(
            "INSERT INTO users (phone, full_name, role) VALUES (%s, %s, 'student') RETURNING id, phone, full_name, role",
            (phone, full_name)
        )
        user = cur.fetchone()
        conn.commit()
        
        result = {
            'userId': user[0],
            'phone': user[1],
            'fullName': user[2],
            'role': user[3]
        }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps(result)
        }
    
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'})
    }