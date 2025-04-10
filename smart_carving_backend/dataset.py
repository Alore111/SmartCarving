import json
import os
from datetime import datetime


class Dataset:
    def __init__(self, dataset_type='dongtai'):
        self.dataset_paths = {
            'dongtai': 'dataset/dongtai.json',
            # 可扩展其他数据集
        }
        self.dataset_type = dataset_type
        self.data = []

        self._load_dataset()

    def _load_dataset(self):
        """
        从文件中加载数据到 self.data 中。
        """
        path = self.dataset_paths.get(self.dataset_type)
        if not path:
            raise ValueError(f"Unsupported dataset type: {self.dataset_type}")

        if not os.path.exists(path):
            self.data = []  # 如果文件不存在，初始化为空列表
            return

        with open(path, 'r', encoding='utf-8') as f:
            try:
                self.data = json.load(f)
            except json.JSONDecodeError:
                raise ValueError(f"Invalid JSON format in file: {path}")

    def _save_dataset(self):
        """
        保存当前数据到文件。
        """
        path = self.dataset_paths.get(self.dataset_type)
        with open(path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    def get_all(self):
        return self.data

    def get_by_id(self, item_id):
        for item in self.data:
            if str(item.get('id')) == str(item_id):
                return item
        return None

    def filter_by_type(self, item_type):
        return [item for item in self.data if item.get('type') == item_type]

    def reload(self):
        self._load_dataset()

    def add_record(self, record):
        """
        添加一条记录：
        - 自动分配自增 ID；
        - 自动生成当前日期字段；
        - 保存回 JSON 文件；
        """
        new_id = str(self._get_next_id())
        current_date = datetime.now().strftime('%Y-%m-%d')

        new_record = {
            "id": new_id,
            "date": current_date,
            **record
        }

        self.data.append(new_record)
        self._save_dataset()
        return new_record

    def _get_next_id(self):
        """
        获取下一个自增 ID。
        """
        if not self.data:
            return 1
        existing_ids = [int(item.get('id', 0)) for item in self.data if str(item.get('id', '')).isdigit()]
        return max(existing_ids, default=0) + 1


if __name__ == '__main__':
    ds = Dataset('dongtai')
    all_data = ds.get_all()
    print(all_data)
    cover_items = ds.filter_by_type('cover')
    print(cover_items)
    specific_item = ds.get_by_id('3')
    print(specific_item)