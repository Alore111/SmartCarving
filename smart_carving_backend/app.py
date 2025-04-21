from flask import Flask, render_template, request, jsonify
from dataset import Dataset
from flask_cors import CORS
from users import UserManager

app = Flask(__name__)
CORS(app)

def make_response(code=200, message="success", data=None):
    return jsonify({
        "code": code,
        "message": message,
        "data": data
    })

def authenticate_request(user_id=None):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers["Authorization"].split("Bearer ")[-1]

    if not token:
        return None, make_response(401, "未登录")

    um = UserManager()
    user = um.get_user_by_token(token)
    if not user:
        return None, make_response(403, "登录已失效")

    if user_id and user_id != user.get("userId"):
        return None, make_response(403, "非法token")

    return user, None

@app.route("/")
def home():
    return make_response(200, "Hello", "Hello!")

# 获取所有记录或按 type 过滤
@app.route("/api/dataset/<dataset_name>", methods=["GET"])
def get_dataset(dataset_name):
    ds = Dataset(dataset_name)
    item_type = request.args.get("type")
    if item_type:
        data = ds.filter_by_type(item_type)
    else:
        data = ds.get_all()
    return make_response(200, "获取成功", data)

# 获取某条记录
@app.route("/api/dataset/<dataset_name>/<int:item_id>", methods=["GET"])
def get_dataset_item(dataset_name, item_id):
    ds = Dataset(dataset_name)
    item = ds.get_by_id(item_id)
    if not item:
        return make_response(404, "记录不存在")
    return make_response(200, "获取成功", item)

# 添加记录，前端需传入 type 等字段
@app.route("/api/dataset/<dataset_name>", methods=["POST"])
def add_dataset_item(dataset_name):
    ds = Dataset(dataset_name)
    data = request.get_json()
    if not data:
        return make_response(400, "缺少 JSON 数据")

    try:
        added = ds.add_record(data)
        return make_response(200, "添加成功", added)
    except Exception as e:
        return make_response(500, f"添加失败: {str(e)}")

# ------------- 足迹相关接口 ----------------

# 获取所有用户
@app.route("/api/users/<dataset_name>", methods=["GET"])
def get_all_users(dataset_name):
    ds = Dataset(dataset_name)
    users = ds.get_all_users()
    return make_response(200, "获取成功", users)

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
