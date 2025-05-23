import pymysql

class DatabaseSql:
    def __init__(self):
        host = "localhost"
        port = 3306
        user = "smart_carving"
        password = "smart_carving_123456"
        database = "smart_carving"
        self.conn = pymysql.connect(host=host, user=user, password=password, database=database, port=port)
        self.cursor = self.conn.cursor(pymysql.cursors.DictCursor)

    def insert_user(self, userId, userName, password, role="tourist"):
        sql = "INSERT INTO users (userId, userName, password, role) VALUES (%s, %s, %s, %s)"
        try:
            self.cursor.execute(sql, (userId, userName, password, role))
            self.conn.commit()
            return True
        except pymysql.err.IntegrityError:
            return False

    def delete_user(self, userId):
        sql = "DELETE FROM users WHERE userId = %s"
        try:
            self.cursor.execute(sql, (userId,))
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
        sql = "SELECT userId, userName, role, token_time FROM users WHERE token = %s"
        self.cursor.execute(sql, (token,))
        return self.cursor.fetchone()

    def get_all_users(self):
        sql = "SELECT userId, userName, role FROM users"
        self.cursor.execute(sql)
        return self.cursor.fetchall()

    def get_user_by_id(self, userId):
        sql = "SELECT userId, userName, role FROM users WHERE userId = %s"
        self.cursor.execute(sql, (userId,))
        return self.cursor.fetchone()

    def update_user_info(self, userId, userName=None, role=None):
        # 根据需要更新 userName 或 role
        user_info = self.get_user_by_id(userId)
        sql = "UPDATE users SET userName = %s, role = %s WHERE userId = %s"
        self.cursor.execute(sql, (userName if userName else user_info['userName'], role if role else user_info['role'], userId))
        self.conn.commit()
        return True

    def insert_spots_from_json(self, data):
        sql = """
        INSERT INTO spots (code, name, description, address, opening_hours, ticket_price, tips, latitude, longitude)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        for code, content in data.items():
            name = content.get("name")
            description = content.get("description")
            details = content.get("details", {})
            self.cursor.execute(sql, (
                code,
                name,
                description,
                details.get("address"),
                details.get("openingHours"),
                details.get("ticketPrice"),
                details.get("bk", ""),
                details.get("latitude"),
                details.get("longitude")
            ))
        self.conn.commit()

    def get_spot_by_code(self, code):
        sql = """
        SELECT code, name, description, address, opening_hours,
               ticket_price, tips, latitude, longitude
        FROM spots
        WHERE code = %s
        """
        self.cursor.execute(sql, (code,))
        row = self.cursor.fetchone()
        if not row:
            return {}

        return {
            row['code']: {
                "name": row["name"],
                "description": row["description"],
                "details": {
                    "address": row["address"],
                    "openingHours": row["opening_hours"],
                    "ticketPrice": row["ticket_price"],
                    "bk": row["tips"],
                    "latitude": row["latitude"],
                    "longitude": row["longitude"]
                }
            }
        }

    def get_spot_id_by_code(self, code):
        sql = "SELECT id FROM spots WHERE code = %s"
        self.cursor.execute(sql, (code,))
        row = self.cursor.fetchone()
        if not row:
            return None
        return row['id']

    def get_all_spots(self):
        sql = """
        SELECT code, name, description, address, opening_hours,
               ticket_price, tips, latitude, longitude, recommend_count, thunder_count
        FROM spots
        """
        self.cursor.execute(sql)
        rows = self.cursor.fetchall()

        result = {}
        for row in rows:
            result[row["code"]] = {
                "name": row["name"],
                "description": row["description"],
                "details": {
                    "address": row["address"],
                    "openingHours": row["opening_hours"],
                    "ticketPrice": row["ticket_price"],
                    "bk": row["tips"],
                    "latitude": row["latitude"],
                    "longitude": row["longitude"],
                    "recommend_count": row["recommend_count"],
                    "thunder_count": row["thunder_count"],
                }
            }
        return result

    def update_spots_from_json(self, data):
        sql = """
        UPDATE spots
        SET name=%s, description=%s, address=%s, opening_hours=%s, ticket_price=%s,
            tips=%s, latitude=%s, longitude=%s
        WHERE code=%s
        """
        for code, content in data.items():
            name = content.get("name")
            description = content.get("description")
            details = content.get("details", {})
            self.cursor.execute(sql, (
                name,
                description,
                details.get("address"),
                details.get("openingHours"),
                details.get("ticketPrice"),
                details.get("bk", ""),
                details.get("latitude"),
                details.get("longitude"),
                code
            ))
        self.conn.commit()

    def delete_spots_by_json(self, data):
        for code in data.keys():
            self.cursor.execute("DELETE FROM spots WHERE code=%s", (code,))
        self.conn.commit()

    # 添加动态
    def insert_dongtai(self, id, type_, title, cover_img, content, url, date):
        sql = """
            INSERT INTO dongtai (id, type, title, cover_img, content, url, date)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        self.cursor.execute(sql, (id, type_, title, cover_img, content, url, date))
        self.conn.commit()

    # 查询所有动态
    def get_all_dongtai(self):
        sql = "SELECT * FROM dongtai ORDER BY date DESC"
        self.cursor.execute(sql)
        return self.cursor.fetchall()

    # 根据 ID 查询动态
    def get_dongtai_by_id(self, id):
        sql = "SELECT * FROM dongtai WHERE id = %s"
        self.cursor.execute(sql, (id,))
        return self.cursor.fetchone()

    # 根据 type 查询动态
    def get_dongtai_by_type(self, type_):
        sql = "SELECT * FROM dongtai WHERE type = %s ORDER BY date DESC"
        self.cursor.execute(sql, (type_,))
        return self.cursor.fetchall()


    # 更新动态
    def update_dongtai(self, id, **kwargs):
        fields = []
        values = []
        for key in ['type', 'title', 'cover_img', 'content', 'url', 'date']:
            if key in kwargs:
                fields.append(f"{key} = %s")
                values.append(kwargs[key])
        if not fields:
            return
        sql = f"UPDATE dongtai SET {', '.join(fields)} WHERE id = %s"
        values.append(id)
        self.cursor.execute(sql, values)
        self.conn.commit()

    # 删除动态
    def delete_dongtai(self, id):
        sql = "DELETE FROM dongtai WHERE id = %s"
        self.cursor.execute(sql, (id,))
        self.conn.commit()

    # 添加论坛内容
    def insert_luntan(self, id, type_, title, content, url, date):
        sql = """
            INSERT INTO luntan (id, type, title, content, url, date)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        self.cursor.execute(sql, (id, type_, title, content, url, date))
        self.conn.commit()

    # 查询所有论坛内容
    def get_all_luntan(self):
        sql = "SELECT * FROM luntan ORDER BY date DESC"
        self.cursor.execute(sql)
        return self.cursor.fetchall()

    # 根据 ID 查询论坛内容
    def get_luntan_by_id(self, id):
        sql = "SELECT * FROM luntan WHERE id = %s"
        self.cursor.execute(sql, (id,))
        return self.cursor.fetchone()

    # 更新论坛内容
    def update_luntan(self, id, **kwargs):
        fields = []
        values = []
        for key in ['type', 'title', 'content', 'url', 'date']:
            if key in kwargs:
                fields.append(f"{key} = %s")
                values.append(kwargs[key])
        if not fields:
            return
        sql = f"UPDATE luntan SET {', '.join(fields)} WHERE id = %s"
        values.append(id)
        self.cursor.execute(sql, values)
        self.conn.commit()

    # 删除论坛内容
    def delete_luntan(self, id):
        sql = "DELETE FROM luntan WHERE id = %s"
        self.cursor.execute(sql, (id,))
        self.conn.commit()

    def submit_comment(self, spot_id, user_id, content, recommend):
        """
        用户提交评论
        """
        sql = """
            INSERT INTO spot_comments (spot_id, user_id, content, recommend, status, is_deleted, created_at)
            VALUES (%s, %s, %s, %s, 'pending', 0, NOW())
        """
        self.cursor.execute(sql, (spot_id, user_id, content, recommend))
        self.conn.commit()

    def approve_comment(self, comment_id):
        """
        审核通过评论，同时更新对应景点的推荐/雷数
        """
        # 先查评论详情
        select_sql = "SELECT spot_id, recommend FROM spot_comments WHERE id = %s  AND is_deleted = 0"
        self.cursor.execute(select_sql, (comment_id,))
        comment = self.cursor.fetchone()

        if comment:
            spot_id = comment['spot_id']
            recommend = comment['recommend']

            # 更新评论审核状态
            update_comment_sql = """
                UPDATE spot_comments 
                SET status = 'approved', approved_at = NOW()
                WHERE id = %s
            """
            self.cursor.execute(update_comment_sql, (comment_id,))

            # 更新景点 recommend_count 或 thunder_count
            if recommend == 1:
                update_spot_sql = "UPDATE spots SET recommend_count = recommend_count + 1 WHERE id = %s"
            elif recommend == 0:
                update_spot_sql = "UPDATE spots SET thunder_count = thunder_count + 1 WHERE id = %s"
            else:
                update_spot_sql = None

            if update_spot_sql:
                self.cursor.execute(update_spot_sql, (spot_id,))

            self.conn.commit()
            return True
        else:
            return False

    def reject_comment(self, comment_id):
        """
        审核拒绝评论
        """
        sql = """
            UPDATE spot_comments 
            SET status = 'rejected', approved_at = NOW()
            WHERE id = %s AND is_deleted = 0
        """
        self.cursor.execute(sql, (comment_id,))
        self.conn.commit()

    def delete_comment(self, comment_id):
        """
        软删除评论
        """
        sql = """
            UPDATE spot_comments 
            SET is_deleted = 1
            WHERE id = %s
        """
        self.cursor.execute(sql, (comment_id,))
        self.conn.commit()

    def list_comments(self, spot_id, limit=10, offset=0):
        """
        查询某景点审核通过且未删除的评论列表
        """
        sql = """
            SELECT spot_comments.id, userName, content, recommend, created_at, spots.name AS spot_name
            FROM spot_comments, users, spots
            WHERE spot_id = %s AND status = 'approved' AND is_deleted = 0 
            AND spot_comments.user_id = users.userId AND spot_comments.spot_id = spots.id
            ORDER BY created_at DESC
        """
        if limit:
            sql += " LIMIT %s OFFSET %s"
        self.cursor.execute(sql, (spot_id, limit, offset))
        return self.cursor.fetchall()

    def list_comments_all(self, status_filter, limit=10, offset=0):
        try:
            query = """
                SELECT approved_at, spot_comments.id, status, content, recommend, created_at, users.userName, spots.name AS spot_name
                FROM spot_comments, users, spots
                WHERE is_deleted = 0 AND spot_comments.user_id = users.userId AND spot_comments.spot_id = spots.id
            """
            params = []

            if status_filter:
                query += " AND status = %s"
                params.append(status_filter)

            if limit:
                query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
                params.extend([limit, offset])
            else:
                query += " ORDER BY created_at DESC"

            self.cursor.execute(query, params)
            comments = self.cursor.fetchall()
            return comments
        except Exception as e:
            print(f"Error: {e}")
            return []

    def close(self):
        self.cursor.close()
        self.conn.close()

    def __del__(self):
        self.close()


if __name__ == "__main__":
    db = DatabaseSql()
    # 查询动态
    # 查询全部
    # all_spots = db.get_spot()
    # all_details = db.get_spot_detail()

    # 按条件查询
    spot_by_code = db.get_spot_by_code(code="dalitang")
    print(spot_by_code)
    # detail_by_addr = db.get_spot_detail(address="渝中区")
    # new_data = {
    #     'hongyadong': {
    #         'name': "洪崖洞",
    #         'description': "洪崖洞是国家4A级旅游景区，坐落于渝中区嘉陵江畔，以巴渝传统吊脚楼建筑群为核心，融合民俗风貌、山城景观与现代商业，是重庆最具标志性的历史人文地标。其依山就势的11层立体建筑，集文化体验、特色餐饮、观景休闲于一体，被誉为“悬崖上的魔幻之城”。",
    #         'details': {
    #             'address': "重庆市渝中区嘉陵江滨江路88号",
    #             'openingHours': "全天开放（开灯时间：19:00）",
    #             'ticketPrice': "免费（无需预约）",
    #             'bk':"1.千厮门大桥观景台：俯瞰洪崖洞全景与两江夜景的黄金视角。 2.洪崖洞崖壁栈道：近距离感受吊脚楼与崖壁的结合。 3.尽量错峰出行（其实最后的结果都是人挤人） 4.走楼梯，不要等电梯，等很久都挤不上一趟。 5.不适合购物，溢价严重。 6.极有可能打不到车。",
    #             "latitude": 29.562201,
    #             "longitude": 106.579031
    #         }
    #     }
    # }
    #
    # db.update_spots_from_json(new_data)


