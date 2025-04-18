import json
import os
import hashlib
import uuid
import secrets
import time

class UserManager:
    def __init__(self, data_file='dataset/users.json'):
        self.data_file = data_file
        os.makedirs(os.path.dirname(data_file), exist_ok=True)
        if not os.path.exists(data_file):
            with open(data_file, 'w') as f:
                json.dump([], f)
        self.users = self._load_users()

    def _load_users(self):
        with open(self.data_file, 'r') as f:
            return json.load(f)

    def _save_users(self):
        with open(self.data_file, 'w') as f:
            json.dump(self.users, f, indent=2)

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def _generate_token(self) -> str:
        return secrets.token_hex(32)

    def register(self, userName: str, password: str):
        if any(u['userName'] == userName for u in self.users):
            return {'success': False, 'message': '用户名已存在'}

        userId = str(uuid.uuid4())
        hashed_password = self._hash_password(password)

        new_user = {
            'userId': userId,
            'userName': userName,
            'password': hashed_password,
            'token': None,
            'token_time': None
        }
        self.users.append(new_user)
        self._save_users()
        return {'success': True, 'message': '注册成功', 'userId': userId}

    def login(self, userName: str, password: str):
        hashed_password = self._hash_password(password)
        for user in self.users:
            if user['userName'] == userName and user['password'] == hashed_password:
                token = self._generate_token()
                user['token'] = token
                user['token_time'] = time.time()
                self._save_users()
                return {'success': True, 'message': '登录成功', 'userId': user['userId'], 'token': token}
        return {'success': False, 'message': '用户名或密码错误'}

    def get_user_by_token(self, token: str):
        for user in self.users:
            if user.get('token') == token:
                return {
                    'userId': user['userId'],
                    'userName': user['userName'],
                    'token_time': user.get('token_time')
                }
        return None

# 示例用法
if __name__ == '__main__':
    um = UserManager()

    # 注册
    print(um.register('hahaha', '123456'))

    # 登录
    result = um.login('hahaha', '123456')
    print(result)

    # 通过 token 获取用户信息
    if result['success']:
        user_info = um.get_user_by_token(result['token'])
        print("根据 token 获取用户信息：", user_info)
