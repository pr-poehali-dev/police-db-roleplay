"""
Скрипт для регистрации slash-команд Discord бота
Запустите этот скрипт один раз для регистрации команд на вашем Discord сервере
"""

import os
import requests
import sys

# Получите эти значения из секретов проекта
DISCORD_BOT_TOKEN = os.environ.get('DISCORD_BOT_TOKEN')
DISCORD_GUILD_ID = os.environ.get('DISCORD_GUILD_ID')
DISCORD_APP_ID = os.environ.get('DISCORD_APP_ID')  # Application ID из Developer Portal

if not all([DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_APP_ID]):
    print("❌ Ошибка: Не все переменные окружения установлены")
    print("Необходимо установить: DISCORD_BOT_TOKEN, DISCORD_GUILD_ID, DISCORD_APP_ID")
    sys.exit(1)

# URL для регистрации команд
url = f"https://discord.com/api/v10/applications/{DISCORD_APP_ID}/guilds/{DISCORD_GUILD_ID}/commands"

headers = {
    "Authorization": f"Bot {DISCORD_BOT_TOKEN}",
    "Content-Type": "application/json"
}

# Определяем команды
commands = [
    {
        "name": "создать_персонажа",
        "description": "Создать своего гражданского персонажа в базе данных",
        "options": [
            {
                "name": "имя",
                "description": "Имя персонажа",
                "type": 3,  # STRING
                "required": True
            },
            {
                "name": "фамилия",
                "description": "Фамилия персонажа",
                "type": 3,  # STRING
                "required": True
            },
            {
                "name": "дата_рождения",
                "description": "Дата рождения (YYYY-MM-DD)",
                "type": 3,  # STRING
                "required": True
            }
        ]
    },
    {
        "name": "мой_персонаж",
        "description": "Посмотреть информацию о своём персонаже"
    },
    {
        "name": "синхронизация",
        "description": "Синхронизировать роль пользователя с БД (только для админов)",
        "options": [
            {
                "name": "пользователь",
                "description": "Пользователь Discord",
                "type": 6,  # USER
                "required": True
            },
            {
                "name": "роль",
                "description": "Роль в системе",
                "type": 3,  # STRING
                "required": True,
                "choices": [
                    {
                        "name": "Пользователь",
                        "value": "user"
                    },
                    {
                        "name": "Модератор",
                        "value": "moderator"
                    },
                    {
                        "name": "Администратор",
                        "value": "admin"
                    }
                ]
            }
        ]
    }
]

# Регистрируем команды
print("🔄 Регистрация команд Discord...")
for command in commands:
    response = requests.post(url, json=command, headers=headers)
    if response.status_code == 200 or response.status_code == 201:
        print(f"✅ Команда '/{command['name']}' зарегистрирована")
    else:
        print(f"❌ Ошибка регистрации '/{command['name']}': {response.status_code}")
        print(response.json())

print("\n✅ Все команды зарегистрированы!")
print("\nДоступные команды:")
print("  /создать_персонажа - Создать персонажа")
print("  /мой_персонаж - Посмотреть свой персонаж")
print("  /синхронизация - Синхронизировать роли (админы)")
