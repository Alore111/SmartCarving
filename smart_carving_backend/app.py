from flask import Flask, render_template, request, jsonify
from dataset import Dataset
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=3396)
