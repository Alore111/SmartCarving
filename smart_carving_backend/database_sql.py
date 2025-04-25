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

    def get_all_spots(self):
        sql = """
        SELECT code, name, description, address, opening_hours,
               ticket_price, tips, latitude, longitude
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
                    "longitude": row["longitude"]
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


    # 添加景点
    def insert_jingdian(self, name, keyword, descriptionShort, description, img, location, lon, lat):
        sql = """
            INSERT INTO jingdian (name, keyword, descriptionShort, description, img, location, lonlat)
            VALUES (%s, %s, %s, %s, %s, %s, ST_PointFromText(%s))
        """
        point_wkt = f'POINT({lon} {lat})'  # 经纬度用WKT格式
        self.cursor.execute(sql, (name, keyword, descriptionShort, description, img, location, point_wkt))
        self.conn.commit()

    # 查询所有景点
    def get_all_jingdian(self):
        sql = "SELECT id, name, keyword, descriptionShort, description, img, location, ST_AsText(lonlat) as lonlat FROM jingdian"
        self.cursor.execute(sql)
        return self.cursor.fetchall()

    # 根据ID查询景点
    def get_jingdian_by_id(self, jingdian_id):
        sql = "SELECT id, name, keyword, descriptionShort, description, img, location, ST_AsText(lonlat) as lonlat FROM jingdian WHERE id = %s"
        self.cursor.execute(sql, (jingdian_id,))
        return self.cursor.fetchone()

    # 更新景点信息
    def update_jingdian(self, jingdian_id, name=None, keyword=None, descriptionShort=None, description=None, img=None, location=None, lon=None, lat=None):
        fields = []
        values = []
        if name is not None:
            fields.append("name = %s")
            values.append(name)
        if keyword is not None:
            fields.append("keyword = %s")
            values.append(keyword)
        if descriptionShort is not None:
            fields.append("descriptionShort = %s")
            values.append(descriptionShort)
        if description is not None:
            fields.append("description = %s")
            values.append(description)
        if img is not None:
            fields.append("img = %s")
            values.append(img)
        if location is not None:
            fields.append("location = %s")
            values.append(location)
        if lon is not None and lat is not None:
            fields.append("lonlat = ST_PointFromText(%s)")
            values.append(f"POINT({lon} {lat})")

        if not fields:
            return  # 没有需要更新的字段

        sql = f"UPDATE jingdian SET {', '.join(fields)} WHERE id = %s"
        values.append(jingdian_id)
        self.cursor.execute(sql, values)
        self.conn.commit()

    # 删除景点
    def delete_jingdian(self, jingdian_id):
        sql = "DELETE FROM jingdian WHERE id = %s"
        self.cursor.execute(sql, (jingdian_id,))
        self.conn.commit()

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


