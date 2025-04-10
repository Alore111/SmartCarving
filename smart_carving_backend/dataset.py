# dataset.py
import os
import json
from datetime import datetime

class Dataset:
    def __init__(self, name):
        self.name = name
        self.path = f'dataset/{name}.json'
        if not os.path.exists(self.path):
            with open(self.path, 'w', encoding='utf-8') as f:
                json.dump([], f, ensure_ascii=False, indent=2)

    def _load(self):
        with open(self.path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def _save(self, data):
        with open(self.path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def get_all(self):
        return self._load()

    def get_by_id(self, id):
        data = self._load()
        return next((item for item in data if str(item.get("id")) == str(id)), None)

    def filter_by_type(self, type_):
        return [item for item in self._load() if item.get("type") == type_]

    def add_record(self, record):
        data = self._load()
        new_id = max([item.get("id", 0) for item in data] or [0]) + 1
        record["id"] = new_id
        record["date"] = datetime.now().strftime("%Y-%m-%d")
        data.append(record)
        self._save(data)
        return record
