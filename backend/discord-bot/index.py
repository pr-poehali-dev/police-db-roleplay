"""
Discord Bot для управления полицейской базой данных
Функции:
- Синхронизация ролей Discord с ролями в БД
- Создание гражданских персонажей через команды
"""

import os
import json
from typing import Dict, Any
import psycopg2


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Обработка webhook событий от Discord бота
    Args: event - dict с httpMethod, body (JSON от Discord)
          context - объект с request_id
    Returns: HTTP response dict
    """
    method: str = event.get('httpMethod', 'POST')
    
    # CORS для всех запросов
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Signature-Ed25519, X-Signature-Timestamp',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    # Парсим тело запроса
    try:
        body = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    
    # Discord Interaction Type
    interaction_type = body.get('type')
    
    # Type 1 = PING (для верификации)
    if interaction_type == 1:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'type': 1})
        }
    
    # Type 2 = APPLICATION_COMMAND
    if interaction_type == 2:
        return handle_command(body)
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Unknown interaction type'})
    }


def handle_command(interaction: Dict[str, Any]) -> Dict[str, Any]:
    """Обработка slash-команд Discord"""
    
    data = interaction.get('data', {})
    command_name = data.get('name')
    
    if command_name == 'создать_персонажа':
        return handle_create_citizen(interaction)
    
    elif command_name == 'синхронизация':
        return handle_sync_roles(interaction)
    
    elif command_name == 'мой_персонаж':
        return handle_my_citizen(interaction)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'type': 4,
            'data': {
                'content': '❌ Неизвестная команда'
            }
        })
    }


def handle_create_citizen(interaction: Dict[str, Any]) -> Dict[str, Any]:
    """Создание гражданского персонажа"""
    
    # Получаем опции команды
    data = interaction.get('data', {})
    options = {opt['name']: opt['value'] for opt in data.get('options', [])}
    
    # Извлекаем данные
    first_name = options.get('имя')
    last_name = options.get('фамилия')
    date_of_birth = options.get('дата_рождения')
    
    # Валидация
    if not all([first_name, last_name, date_of_birth]):
        return discord_response('❌ Заполните все обязательные поля')
    
    # ID пользователя Discord
    user = interaction.get('member', {}).get('user', interaction.get('user', {}))
    discord_user_id = user.get('id')
    discord_username = user.get('username')
    
    if not discord_user_id:
        return discord_response('❌ Не удалось определить пользователя')
    
    # Подключаемся к БД
    try:
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            return discord_response('❌ База данных недоступна')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Проверяем, есть ли уже персонаж у этого пользователя
        cur.execute(
            "SELECT id FROM citizens WHERE discord_user_id = %s",
            (discord_user_id,)
        )
        existing = cur.fetchone()
        
        if existing:
            cur.close()
            conn.close()
            return discord_response(
                f'❌ У вас уже есть персонаж (ID: {existing[0]})\n'
                'Используйте `/мой_персонаж` для просмотра'
            )
        
        # Генерируем ID-карту
        cur.execute("SELECT MAX(id) FROM citizens")
        max_id = cur.fetchone()[0] or 0
        citizen_id = f"ID-{str(max_id + 1).zfill(5)}"
        
        # Создаем персонажа
        cur.execute(
            """
            INSERT INTO citizens 
            (citizen_id, first_name, last_name, date_of_birth, discord_user_id, discord_username, notes) 
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
            """,
            (citizen_id, first_name, last_name, date_of_birth, discord_user_id, discord_username, 
             f'Создан через Discord: @{discord_username}')
        )
        
        new_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        return discord_response(
            f'✅ **Персонаж создан!**\n\n'
            f'📋 ID-Карта: `{citizen_id}`\n'
            f'👤 ФИО: {first_name} {last_name}\n'
            f'📅 Дата рождения: {date_of_birth}\n\n'
            f'Ваш персонаж доступен в полицейской базе данных'
        )
        
    except Exception as e:
        return discord_response(f'❌ Ошибка создания персонажа: {str(e)}')


def handle_sync_roles(interaction: Dict[str, Any]) -> Dict[str, Any]:
    """Синхронизация ролей Discord с БД (только для админов)"""
    
    # Проверяем права (админ или модератор в Discord)
    member = interaction.get('member', {})
    permissions = int(member.get('permissions', 0))
    
    # 0x8 = ADMINISTRATOR permission
    is_admin = (permissions & 0x8) == 0x8
    
    if not is_admin:
        return discord_response('❌ Недостаточно прав. Команда доступна только администраторам сервера.')
    
    user = interaction.get('member', {}).get('user', interaction.get('user', {}))
    discord_user_id = user.get('id')
    
    # Получаем роль из команды
    data = interaction.get('data', {})
    options = {opt['name']: opt['value'] for opt in data.get('options', [])}
    target_user_id = options.get('пользователь')
    role = options.get('роль', 'user')
    
    if not target_user_id:
        return discord_response('❌ Укажите пользователя')
    
    try:
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            return discord_response('❌ База данных недоступна')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Проверяем, есть ли пользователь в таблице users
        cur.execute(
            "SELECT id, role FROM users WHERE discord_user_id = %s",
            (target_user_id,)
        )
        result = cur.fetchone()
        
        if result:
            # Обновляем роль
            cur.execute(
                "UPDATE users SET role = %s WHERE discord_user_id = %s",
                (role, target_user_id)
            )
            message = f'✅ Роль пользователя обновлена на **{role}**'
        else:
            message = f'❌ Пользователь <@{target_user_id}> не найден в базе данных.\n' \
                     'Попросите его сначала войти в систему через веб-интерфейс.'
        
        conn.commit()
        cur.close()
        conn.close()
        
        return discord_response(message)
        
    except Exception as e:
        return discord_response(f'❌ Ошибка синхронизации: {str(e)}')


def handle_my_citizen(interaction: Dict[str, Any]) -> Dict[str, Any]:
    """Просмотр своего персонажа"""
    
    user = interaction.get('member', {}).get('user', interaction.get('user', {}))
    discord_user_id = user.get('id')
    
    if not discord_user_id:
        return discord_response('❌ Не удалось определить пользователя')
    
    try:
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            return discord_response('❌ База данных недоступна')
        
        conn = psycopg2.connect(db_url)
        cur = conn.cursor()
        
        # Ищем персонажа
        cur.execute(
            """
            SELECT id, citizen_id, first_name, last_name, date_of_birth, address, phone, notes,
                   (SELECT COUNT(*) FROM criminal_records WHERE citizen_id = citizens.id) as crimes_count,
                   (SELECT COUNT(*) FROM fines WHERE citizen_id = citizens.id) as fines_count,
                   (SELECT COUNT(*) FROM wanted WHERE citizen_id = citizens.id) as wanted_count
            FROM citizens 
            WHERE discord_user_id = %s
            """,
            (discord_user_id,)
        )
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if not result:
            return discord_response(
                '❌ У вас нет персонажа\n\n'
                'Создайте его с помощью команды `/создать_персонажа`'
            )
        
        citizen_id, card_id, first_name, last_name, dob, address, phone, notes, crimes, fines, wanted = result
        
        status = '🚨 **В РОЗЫСКЕ**' if wanted > 0 else '✅ Законопослушный'
        
        message = (
            f'**📋 Ваш персонаж**\n\n'
            f'🆔 ID-Карта: `{card_id}`\n'
            f'👤 ФИО: **{first_name} {last_name}**\n'
            f'📅 Дата рождения: {dob}\n'
            f'📍 Адрес: {address or "Не указан"}\n'
            f'📱 Телефон: {phone or "Не указан"}\n\n'
            f'**Статус:** {status}\n\n'
            f'📊 **Статистика:**\n'
            f'🚔 Преступлений: {crimes}\n'
            f'💰 Штрафов: {fines}\n'
        )
        
        if notes:
            message += f'\n📝 Заметки: {notes}'
        
        return discord_response(message)
        
    except Exception as e:
        return discord_response(f'❌ Ошибка получения данных: {str(e)}')


def discord_response(content: str, ephemeral: bool = False) -> Dict[str, Any]:
    """Формирование ответа для Discord"""
    response_data = {
        'content': content
    }
    
    if ephemeral:
        response_data['flags'] = 64  # EPHEMERAL flag
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({
            'type': 4,  # CHANNEL_MESSAGE_WITH_SOURCE
            'data': response_data
        })
    }
