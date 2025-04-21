import pymysql

class DatabaseSql:
    def __init__(self):
        host = "localhost"
        # host = "124.70.222.169"
        # host = "sql.t.2ndtool.top"
        port = 3306
        user = "smart_carving"
        password = "smart_carving_123456"
        database = "smart_carving"
        self.conn = pymysql.connect(host=host, user=user, password=password, database=database, port=port)
        self.cursor = self.conn.cursor(pymysql.cursors.DictCursor)

    def insert_user(self, userId, userName, password):
        sql = "INSERT INTO users (userId, userName, password) VALUES (%s, %s, %s)"
        try:
            self.cursor.execute(sql, (userId, userName, password))
            self.conn.commit()
            return True
        except pymysql.err.IntegrityError:
            return False

    def find_user_by_credentials(self, userName, password):
        sql = "SELECT * FROM users WHERE userName = %s AND password = %s"
        self.cursor.execute(sql, (userName, password))
        return self.cursor.fetchone()

    def update_user_token(self, userId, token, token_time):
        sql = "UPDATE users SET token = %s, token_time = %s WHERE userId = %s"
        self.cursor.execute(sql, (token, token_time, userId))
        self.conn.commit()

    def get_user_by_token(self, token):
        sql = "SELECT userId, userName, token_time FROM users WHERE token = %s"
        self.cursor.execute(sql, (token,))
        return self.cursor.fetchone()

    def close(self):
        self.cursor.close()
        self.conn.close()

    def __del__(self):
        self.close()
