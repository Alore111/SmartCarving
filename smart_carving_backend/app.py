from uuid import uuid4

from flask import Flask, render_template, request, jsonify
from dataset import Dataset
from flask_cors import CORS
from users import UserManager
from database_sql import DatabaseSql

app = Flask(__name__)
CORS(app)

def make_response(code=200, message="success", data=None):
    return jsonify({
        "code": code,
        "message": message,
        "data": data
    })

def authenticate_request(user_id=None, role=None):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers["Authorization"].split("Bearer ")[-1]

    if not token:
        return None, make_response(401, "未登录")

    um = UserManager()
    user = um.get_user_by_token(token)
    if not user:
        return None, make_response(403, "登录已失效")

    if role and user.get("role") != role:
        return None, make_response(403, "权限不足")

    if user_id and user_id != user.get("userId"):
        return None, make_response(403, "非法token")

    return user, None

@app.route("/")
def home():
    return make_response(200, "Hello", "Hello!")

# 获取所有记录或按 type 过滤
@app.route("/api/dataset/<dataset_name>", methods=["GET"])
def get_dataset(dataset_name):
    sql = DatabaseSql()
    data = None
    if dataset_name == "dongtai":
        item_type = request.args.get("type")
        if item_type:
            data = sql.get_dongtai_by_type(item_type)
        else:
            data = sql.get_all_dongtai()
    elif dataset_name == "luntan":
        data = sql.get_all_luntan()
    elif dataset_name == "spots":
        data = sql.get_all_spots()
    elif dataset_name == "zuji":
        ds = Dataset(dataset_name)
        data = ds.get_all()
    elif dataset_name == "users":
        user, err = authenticate_request(role="admin")
        if err:
            return err
        data = sql.get_all_users()
    return make_response(200, "获取成功", data)

# 添加记录，前端需传入 type 等字段
@app.route("/api/dataset/<dataset_name>", methods=["POST"])
def add_dataset_item(dataset_name):
    user, err = authenticate_request(role="admin")

    try:
        sql = DatabaseSql()
        data = request.get_json()
        if dataset_name == "dongtai":
            id_ = str(uuid4())
            type_ = data.get("type")
            content = data.get("content")
            title = data.get("title")
            cover_img = data.get("cover_img")
            url = data.get("url")
            date = data.get("date")
            if not type_ or not content or not title or not cover_img or not url or not date:
                return make_response(400, "缺少 JSON 数据")
            try:
                sql.insert_dongtai(id_, type_, title, cover_img, content, url, date)
            except Exception as e:
                return make_response(500, f"添加失败: {str(e)}")
            return make_response(200, "添加成功")
        elif dataset_name == "luntan":
            id_ = str(uuid4())
            type_ = data.get("type")
            title = data.get("title")
            content = data.get("content")
            url = data.get("url")
            date = data.get("date")
            if not type_ or not title or not content or not url or not date:
                return make_response(400, "缺少 JSON 数据")
            try:
                sql.insert_luntan(id_, type_, title, content, url, date)
            except Exception as e:
                return make_response(500, f"添加失败: {str(e)}")

        elif dataset_name == "spots":
            try:
                sql.insert_spots_from_json(data)
            except Exception as e:
                return make_response(500, f"添加失败: {str(e)}")
            return make_response(200, "添加成功")

    except Exception as e:
        return make_response(500, f"添加失败: {str(e)}")

@app.route("/api/dataset/<dataset_name>/<item_code>", methods=["PUT"])
def update_dataset_item(dataset_name, item_code):
    user, err = authenticate_request(role="admin")
    if err:
        return err
    update_data = request.get_json()
    sql = DatabaseSql()
    if dataset_name == "dongtai":
        sql.update_dongtai(item_code)
    elif dataset_name == "luntan":
        sql.update_luntan(item_code)
    elif dataset_name == "spots":
        sql.update_spots_from_json(update_data)
    return make_response(200, "更新成功")

@app.route("/api/dataset/<dataset_name>/<item_code>", methods=["DELETE"])
def delete_dataset_item(dataset_name, item_code):
    user, err = authenticate_request(role="admin")
    if err:
        return err
    sql = DatabaseSql()
    if dataset_name == "dongtai":
        sql.delete_dongtai(item_code)
    elif dataset_name == "luntan":
        sql.delete_luntan(item_code)
    elif dataset_name == "spots":
        del_data = {item_code:{}}
        sql.delete_spots_by_json(del_data)
    return make_response(200, "删除成功")
# ------------- 足迹相关接口 ----------------

# 添加用户（如果不存在）
@app.route("/api/users/register", methods=["POST"])
def add_user():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")
    if not username or not password:
        return make_response(400, "用户名或密码为空")

    um = UserManager()
    reg_info = um.register(username, password)
    if reg_info.get('success'):
        user_id = reg_info.get('userId')
        ds = Dataset("zuji")
        ds.add_user_if_not_exists(user_id, username)
        return make_response(201, "注册成功", {"userId": user_id})
    return make_response(500, reg_info.get("message", "未知错误"))

@app.route("/api/users/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "")
    password = data.get("password", "")
    if not username or not password:
        return make_response(400, "用户名或密码为空")

    um = UserManager()
    token = um.login(username, password)
    if token['success']:
        return_data = {
            "userId": token['userId'],
            "token": token['token']
        }
        return make_response(200, "登录成功", return_data)
    return make_response(401, "用户名或密码错误")

# 获取用户信息
@app.route("/api/users/info", methods=["GET"])
def get_user_info():
    user, auth_error= authenticate_request()
    if auth_error:
        return auth_error
    return make_response(200, "获取成功", user)

@app.route("/api/users/info", methods=["PUT"])
def update_user_info():
    user, auth_error = authenticate_request(role="admin")
    if auth_error:
        return auth_error
    data = request.get_json()
    userId = data.get("userId")
    userName = data.get("userName")
    role = data.get("role")
    sql = DatabaseSql()
    if sql.update_user_info(userId, userName, role):
        return make_response(200, "更新成功")
    return make_response(500, "更新失败")

@app.route("/api/users/add", methods=["POST"])
def add_user_to_dataset():
    user, auth_error = authenticate_request(role="admin")
    if auth_error:
        return auth_error
    data = request.get_json()
    userName = data.get("userName")
    password = data.get("password")
    role = data.get("role")
    um = UserManager()
    insert_info = um.insert_user(userName, password, role)
    if insert_info.get('success'):
        user_id= insert_info.get('userId')
        ds = Dataset("zuji")
        ds.add_user_if_not_exists(user_id, userName)
        return make_response(200, "添加成功")
    return make_response(500, "添加失败")

@app.route("/api/users/delete/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    user, auth_error = authenticate_request(role="admin")
    if auth_error:
        return auth_error
    sql = DatabaseSql()
    if sql.delete_user(user_id):
        return make_response(200, "删除成功")
    return make_response(500, "删除失败")


# 获取评论列表（支持按 spot_id 查询）
@app.route("/api/comments", methods=["GET"])
def get_comments():
    sql = DatabaseSql()
    spot_id = request.args.get("spot_id")
    limit = int(request.args.get("limit", 10))
    offset = int(request.args.get("offset", 0))

    if not isinstance(spot_id, int):
        spot_id = sql.get_spot_id_by_code(spot_id)

    if not spot_id:
        return make_response(400, "缺少景点 spot_id 参数")

    try:
        comments = sql.list_comments(spot_id, limit, offset)
        return make_response(200, "获取成功", comments)
    except Exception as e:
        return make_response(500, f"查询失败: {str(e)}")


# 获取所有评论（后台用，不按景点 spot_id 限制）
@app.route('/api/comments/all', methods=['GET'])
def get_all_comments():
    user, auth_error = authenticate_request(role="admin")
    if auth_error:
        return auth_error

    limit = int(request.args.get('limit', 20))
    offset = int(request.args.get('offset', 0))
    status_filter = request.args.get('status')  # 可选：pending / approved / rejected
    try:
        sql = DatabaseSql()
        comments = sql.list_comments_all(status_filter, limit, offset)
        return make_response(200, "获取成功", comments)
    except Exception as e:
        return make_response(500, f"获取评论失败: {str(e)}")

# 用户提交评论
@app.route("/api/comments", methods=["POST"])
def submit_comment():
    user, err = authenticate_request()
    if err:
        return err

    data = request.get_json()
    spot_id = data.get("spot_id")
    content = data.get("content")
    recommend = data.get("recommend")  # 1: 推荐  0: 雷

    if spot_id is None or content is None or recommend is None:
        return make_response(400, "缺少必填字段")

    try:
        sql = DatabaseSql()
        if type(spot_id) == str:
            spot_id = sql.get_spot_id_by_code(spot_id)
        sql.submit_comment(spot_id, user['userId'], content, recommend)
        return make_response(201, "评论提交成功，等待审核")
    except Exception as e:
        return make_response(500, f"提交失败: {str(e)}")

# 审核评论（通过）
@app.route("/api/comments/<comment_id>/approve", methods=["PUT"])
def approve_comment(comment_id):
    user, err = authenticate_request(role="admin")
    if err:
        return err

    try:
        sql = DatabaseSql()
        success = sql.approve_comment(comment_id)
        if success:
            return make_response(200, "审核通过成功")
        else:
            return make_response(404, "未找到待审核的评论")
    except Exception as e:
        return make_response(500, f"审核失败: {str(e)}")

# 审核评论（拒绝）
@app.route("/api/comments/<comment_id>/reject", methods=["PUT"])
def reject_comment(comment_id):
    user, err = authenticate_request(role="admin")
    if err:
        return err

    try:
        sql = DatabaseSql()
        sql.reject_comment(comment_id)
        return make_response(200, "审核拒绝成功")
    except Exception as e:
        return make_response(500, f"审核失败: {str(e)}")

# 软删除评论
@app.route("/api/comments/<comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    user, err = authenticate_request(role="admin")
    if err:
        return err

    try:
        sql = DatabaseSql()
        sql.delete_comment(comment_id)
        return make_response(200, "删除成功")
    except Exception as e:
        return make_response(500, f"删除失败: {str(e)}")

# 添加旅游线路
@app.route("/api/users/<dataset_name>/<user_id>/tracks", methods=["POST"])
def add_track(dataset_name, user_id):
    user, auth_error = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    track_data = request.get_json()
    if not track_data:
        return make_response(400, "缺少 JSON 数据")

    added_track = ds.add_track(user_id, track_data)
    return make_response(201, "添加成功", added_track)

# 添加足迹
@app.route("/api/users/<dataset_name>/<user_id>/tracks/<route_id>/footprints", methods=["POST"])
def add_footprint(dataset_name, user_id, route_id):
    user, auth_error = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    footprint = request.get_json()
    if not footprint:
        return make_response(400, "缺少 JSON 数据")

    added = ds.add_footprint(user_id, route_id, footprint)
    if not added:
        return make_response(404, "用户或路线不存在")
    return make_response(201, "添加成功", added)

# 添加照片到指定足迹（通过 timestamp 定位）
@app.route("/api/users/<dataset_name>/<user_id>/tracks/<route_id>/footprints/<timestamp>/photos", methods=["POST"])
def add_photo(dataset_name, user_id, route_id, timestamp):
    user, auth_error = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    photo = request.get_json()
    if not photo:
        return make_response(400, "缺少 JSON 数据")

    added = ds.add_photo_to_footprint(user_id, route_id, timestamp, photo)
    if not added:
        return make_response(404, "未找到指定的足迹")
    return make_response(201, "添加成功", added)

@app.route("/api/users/<dataset_name>/<user_id>/tracks/update", methods=["POST"])
def upsert_track(dataset_name, user_id):
    user, auth_error = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    track_data = request.get_json()
    if not track_data:
        return make_response(400, "缺少 JSON 数据")

    updated_track = ds.upsert_track(user_id, track_data)
    if not updated_track:
        return make_response(404, "用户不存在")
    return make_response(200, "处理成功", updated_track)

@app.route("/api/users/<dataset_name>/<user_id>/tracks/<route_id>", methods=["DELETE"])
def delete_track(dataset_name, user_id, route_id):
    user, auth_error = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    success = ds.delete_track(user_id, route_id)
    if not success:
        return make_response(404, "未找到指定用户或路径")
    return make_response(200, "删除成功")


if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=3396)
