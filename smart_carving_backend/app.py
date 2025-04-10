from flask import Flask, render_template, request, jsonify
from dataset import Dataset

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/listDT", methods=["GET"])
def listDT():
    dt = Dataset('dongtai')
    data = dt.get_all()
    return jsonify({
        "data": data,
        "code":200
    })

if __name__ == "__main__":
    app.run(debug=True, port=3398)