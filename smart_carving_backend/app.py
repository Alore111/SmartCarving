from flask import Flask, render_template, request, jsonify
from dataset import Dataset
from flask_cors import CORS
from users import UserManager

app = Flask(__name__)
CORS(app)


def authenticate_request(user_id=None):
    token = None
    if 'Authorization' in request.headers:
        token = request.headers["Authorization"].split("Bearer ")[-1]

    if not token:
        return None, jsonify({"error": "未登录"}), 401

    um = UserManager()
    user = um.get_user_by_token(token)
    if not user:
        return None, jsonify({"error": "未知token"}), 403


    if user_id and user_id != user.get("userId"):
        print(user_id, user.get("userId"))
        return None, jsonify({"error": "非法token"}), 403

    return user, None, None

@app.route("/")
def home():
    return "Hello!"

# 获取所有记录或按 type 过滤
@app.route("/api/dataset/<dataset_name>", methods=["GET"])
def get_dataset(dataset_name):
    ds = Dataset(dataset_name)
    item_type = request.args.get("type")
    if item_type:
        data = ds.filter_by_type(item_type)
    else:
        data = ds.get_all()
    return jsonify(data)

# 获取某条记录
@app.route("/api/dataset/<dataset_name>/<int:item_id>", methods=["GET"])
def get_dataset_item(dataset_name, item_id):
    ds = Dataset(dataset_name)
    item = ds.get_by_id(item_id)
    if not item:
        return jsonify({"error": "Not found"}), 404
    return jsonify(item)

# 添加记录，前端需传入 type 等字段
@app.route("/api/dataset/<dataset_name>", methods=["POST"])
def add_dataset_item(dataset_name):
    ds = Dataset(dataset_name)
    data = request.get_json()
    if not data:
        return jsonify({"error": "Missing JSON"}), 400

    try:
        added = ds.add_record(data)
        return jsonify(added), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------- 足迹相关接口 ----------------

# 获取所有用户
@app.route("/api/users/<dataset_name>", methods=["GET"])
def get_all_users(dataset_name):
    ds = Dataset(dataset_name)
    users = ds.get_all_users()
    return jsonify(users)

# 添加用户（如果不存在）
@app.route("/api/users/register", methods=["POST"])
def add_user():
    data = request.get_json()
    username = data.get("userName", "")
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "用户名或密码为空"}), 400
    um = UserManager()
    reg_info = um.register(username, password)
    if reg_info.get('success'):
        user_id = reg_info.get('userId')
        ds = Dataset("zuji")
        ds.add_user_if_not_exists(user_id, username)
        return jsonify({"message": "注册成功"}), 201
    return jsonify({"error": reg_info.get("message","未知错误")}), 500

@app.route("/api/users/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("userName", "")
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "用户名或密码为空"}), 400
    um = UserManager()
    token = um.login(username, password)
    if token:
        return jsonify({"token": token}), 200
    return jsonify({"error": "用户名或密码错误"}), 401

# 添加旅游线路
@app.route("/api/users/<dataset_name>/<user_id>/tracks", methods=["POST"])
def add_track(dataset_name, user_id):
    user, auth_error, _ = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    track_data = request.get_json()
    if not track_data:
        return jsonify({"error": "Missing JSON"}), 400

    added_track = ds.add_track(user_id, track_data)
    return jsonify(added_track), 201

# 添加足迹
@app.route("/api/users/<dataset_name>/<user_id>/tracks/<route_id>/footprints", methods=["POST"])
def add_footprint(dataset_name, user_id, route_id):
    user, auth_error, _ = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    footprint = request.get_json()
    if not footprint:
        return jsonify({"error": "Missing JSON"}), 400

    added = ds.add_footprint(user_id, route_id, footprint)
    if not added:
        return jsonify({"error": "User or route not found"}), 404
    return jsonify(added), 201

# 添加照片到指定足迹（通过 timestamp 定位）
@app.route("/api/users/<dataset_name>/<user_id>/tracks/<route_id>/footprints/<timestamp>/photos", methods=["POST"])
def add_photo(dataset_name, user_id, route_id, timestamp):
    user, auth_error, _ = authenticate_request(user_id)
    if auth_error:
        return auth_error

    ds = Dataset(dataset_name)
    photo = request.get_json()
    if not photo:
        return jsonify({"error": "Missing JSON"}), 400

    added = ds.add_photo_to_footprint(user_id, route_id, timestamp, photo)
    if not added:
        return jsonify({"error": "Footprint not found"}), 404
    return jsonify(added), 201

# --------------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=3396)
