import hashlib
import uuid
import secrets
import time
from database_sql import DatabaseSql

class UserManager:
    def __init__(self):
        self.db = DatabaseSql()

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode()).hexdigest()

    def _generate_token(self) -> str:
        return secrets.token_hex(32)

    def register(self, userName: str, password: str):
        userId = str(uuid.uuid4())
        hashed_password = self._hash_password(password)
        success = self.db.insert_user(userId, userName, hashed_password)
        if success:
            return {'success': True, 'message': '注册成功', 'userId': userId}
        else:
            return {'success': False, 'message': '用户名已存在'}

    def login(self, userName: str, password: str):
        hashed_password = self._hash_password(password)
        user = self.db.find_user_by_credentials(userName, hashed_password)
        if user:
            token = self._generate_token()
            token_time = time.time()
            self.db.update_user_token(user['userId'], token, token_time)
            return {'success': True, 'message': '登录成功', 'userId': user['userId'], 'token': token}
        return {'success': False, 'message': '用户名或密码错误'}

    def get_user_by_token(self, token: str):
        return self.db.get_user_by_token(token)

    def insert_user(self, userName, password, role):
        userId = str(uuid.uuid4())
        hashed_password = self._hash_password(password)
        insert_info = self.db.insert_user(userId, userName, hashed_password, role)
        if insert_info:
            return {'success': True, 'message': '注册成功', 'userId': userId}
