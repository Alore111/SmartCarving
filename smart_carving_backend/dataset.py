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

    def get_all_users(self):
        return self._load().get("users", [])

    def get_user(self, user_id):
        users = self.get_all_users()
        return next((u for u in users if u.get("userId") == user_id), None)

    def add_user_if_not_exists(self, user_id, user_name=""):
        data = self._load()
        users = data.get("users", [])
        if not any(u.get("userId") == user_id for u in users):
            users.append({
                "userId": user_id,
                "userName": user_name,
                "tracks": []
            })
            self._save({"users": users})

    def add_track(self, user_id, track):
        self.add_user_if_not_exists(user_id)
        data = self._load()
        for user in data["users"]:
            if user["userId"] == user_id:
                if "tracks" not in user:
                    user["tracks"] = []
                track["routeId"] = f"route_{len(user['tracks']) + 1}"
                user["tracks"].append(track)
                break
        self._save(data)
        return track

    def add_footprint(self, user_id, route_id, footprint):
        data = self._load()
        for user in data["users"]:
            if user["userId"] == user_id:
                for track in user.get("tracks", []):
                    if track["routeId"] == route_id:
                        if "footprints" not in track:
                            track["footprints"] = []
                        track["footprints"].append(footprint)
                        self._save(data)
                        return footprint
        return None

    def add_photo_to_footprint(self, user_id, route_id, timestamp, photo):
        data = self._load()
        for user in data["users"]:
            if user["userId"] == user_id:
                for track in user.get("tracks", []):
                    if track["routeId"] == route_id:
                        for fp in track.get("footprints", []):
                            if fp.get("timestamp") == timestamp:
                                if "photos" not in fp:
                                    fp["photos"] = []
                                fp["photos"].append(photo)
                                self._save(data)
                                return photo
        return None

    def upsert_track(self, user_id, track):
        self.add_user_if_not_exists(user_id)
        data = self._load()
        for user in data["users"]:
            if user["userId"] == user_id:
                if "tracks" not in user:
                    user["tracks"] = []

                # 如果存在 routeId，尝试更新已有轨迹
                if "routeId" in track:
                    for i, existing_track in enumerate(user["tracks"]):
                        if existing_track["routeId"] == track["routeId"]:
                            user["tracks"][i] = track
                            self._save(data)
                            return track
                    # 没找到匹配 routeId，就当新增处理
                else:
                    track["routeId"] = f"route_{len(user['tracks']) + 1}"
                    user["tracks"].append(track)
                    self._save(data)
                    return track

        return None
