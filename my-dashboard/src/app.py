import os
import csv
import time
import random
import json
from openai import OpenAI
from datetime import datetime
from threading import Thread
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

load_dotenv()
api_key = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

# CSVファイルのパスを指定
csv_file_path = '../data/person_times.csv'

# CSVから時間データを読み込む関数
def load_time_data():
    time_data = {}
    with open('../data/person_times.csv', 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            name = row['name']
            time_data[name] = {
                "運転時間": int(row['運転時間']),
                "荷役時間": int(row['荷役時間']),
                "休憩時間": int(row['休憩時間']),
            }
    return time_data

# 時間データの保存
time_data = load_time_data()

# 状態と人物の変数
current_person_room1 = "佐藤"
current_person_room2 = "田中"
status_1, status_2 = "vacant", "vacant"

# 時間の更新ロジック
def update_person_time(name, status):
    if status == "vacant":
        time_data[name]["運転時間"] += 10
    elif status == "working":
        time_data[name]["荷役時間"] += 10
    elif status == "idling":
        time_data[name]["休憩時間"] += 10

# データストレージの拡張
data_storage = {
    "room1_temperature": [],
    "room1_humidity": [],
    "room2_temperature": [],
    "room2_humidity": [],
    "room3_temperature": [],
    "room3_humidity": []
}
MAX_DATA_LENGTH = 100

# 各部屋の最新5回分のデータをバッファに保存
data_buffer = {
    "room1_temperature": [],
    "room1_humidity": [],
    "room2_temperature": [],
    "room2_humidity": [],
    "room3_temperature": [],
    "room3_humidity": []
}
BUFFER_SIZE = 5

class DataAccesser:
    @staticmethod
    def process_data(data, data_key):
        if len(data_storage[data_key]) >= MAX_DATA_LENGTH:
            data_storage[data_key].pop(0)
        data_storage[data_key].append(data)
        print(f"[DataAccesser] {data_key} data processed: {data}")

def calculate_average_and_store(data_key):
    if len(data_buffer[data_key]) == BUFFER_SIZE:
        avg_value = sum(item["value"] for item in data_buffer[data_key]) / BUFFER_SIZE
        avg_data = {
            "sensor": data_buffer[data_key][0]["sensor"],
            "value": round(avg_value, 2),
            "timestamp": datetime.now().isoformat()
        }
        DataAccesser.process_data(avg_data, data_key)
        data_buffer[data_key] = []

class EventDataRouter:
    @staticmethod
    def route(data, data_type, room):
        data_key = f"{room}_{data_type}"
        data_buffer[data_key].append(data)
        
        if len(data_buffer[data_key]) == BUFFER_SIZE:
            calculate_average_and_store(data_key)

class EntityModel:
    entities = {
        "room1_temperature_sensor": {"type": "temperature", "location": "Room 1"},
        "room1_humidity_sensor": {"type": "humidity", "location": "Room 1"},
        "room2_temperature_sensor": {"type": "temperature", "location": "Room 2"},
        "room2_humidity_sensor": {"type": "humidity", "location": "Room 2"},
        "room3_temperature_sensor": {"type": "temperature", "location": "Room 3"},
        "room3_humidity_sensor": {"type": "humidity", "location": "Room 3"}
    }

    @staticmethod
    def get_entity_info(sensor_name):
        return EntityModel.entities.get(sensor_name, {})

def generate_temperature_data(room):
    while True:
        temp_data = {
            "sensor": f"{room}_temperature_sensor",
            "value": round(random.uniform(20, 30), 2),
            "timestamp": datetime.now().isoformat()
        }
        EventDataRouter.route(temp_data, "temperature", room)
        time.sleep(2)

def generate_humidity_data(room):
    while True:
        humidity_data = {
            "sensor": f"{room}_humidity_sensor",
            "value": round(random.uniform(40, 60), 2),
            "timestamp": datetime.now().isoformat()
        }
        EventDataRouter.route(humidity_data, "humidity", room)
        time.sleep(2)

@app.route('/data', methods=['GET'])
def get_data():
    return jsonify(data_storage)

@app.route('/entity/<sensor_name>', methods=['GET'])
def get_entity(sensor_name):
    return jsonify(EntityModel.get_entity_info(sensor_name))

@app.route('/chat', methods=['POST'])
def chat():
    try:
        user_input = request.json.get('message')

        try:    # GPT-4 Function Calling
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {"role": "user", "content": user_input}
                ],
                functions=[
                    {
                        "name": "get_room_temperature",
                        "description": "Get the temperature for a specific room",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "room_id": {"type": "string"}
                            },
                            "required": ["room_id"]
                        }
                    },
                    {
                        "name": "get_room_humidity",
                        "description": "Get the humidity for a specific room",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "room_id": {"type": "string"}
                            },
                            "required": ["room_id"]
                        }
                    }
                ],
                function_call="auto"
            )

            print("GPT-4 Response:", response)
        except Exception as e:
            print("Error in GPT-4 API request:", str(e))
            return jsonify({"response": "GPT-4 APIリクエストでエラーが発生しました。"}), 500

        # Function Callingの処理
        if response.choices[0].message.function_call:
            function_call = response.choices[0].message.function_call
            print("Function Call Detected:", function_call)

            # argumentsをJSONとしてパース
            arguments = json.loads(function_call.arguments)
            room_id = arguments.get('room_id').lower()  # 小文字に変換

            try:
                if function_call.name == "get_room_temperature":
                    temp_data = get_room_temperature(room_id)
                    return jsonify({
                        "response": f"現在（{temp_data['timestamp']}）の、{room_id}の温度は{temp_data['value']}°Cです。"
                    })

                elif function_call.name == "get_room_humidity":
                    humidity_data = get_room_humidity(room_id)
                    return jsonify({
                        "response": f"現在（{humidity_data['timestamp']}）の、{room_id}の湿度は{humidity_data['value']}%です。"
                    })

            except Exception as e:
                print("Error in Function Call Handling:", str(e))
                return jsonify({"response": "関数呼び出しの処理中にエラーが発生しました。"}), 500

        # 通常のメッセージ応答
        return jsonify({"response": response.choices[0].message.content})

    except Exception as e:
        print("An error occurred in /chat endpoint:", str(e))
        return jsonify({"response": "サーバーエラーが発生しました。ご確認ください。"}), 500

def get_room_temperature(room_id):
    key = f"{room_id}_temperature"
    room_data = data_storage.get(key, [])
    
    if room_data:
        latest_entry = room_data[-1]
        # 時刻を整形
        timestamp = datetime.fromisoformat(latest_entry["timestamp"]).strftime("%Y年%m月%d日 %H時%M分%S秒")
        return {
            "value": latest_entry["value"],
            "timestamp": timestamp
        }
    else:
        return {"value": "データがありません", "timestamp": None}

def get_room_humidity(room_id):
    key = f"{room_id}_humidity"
    room_data = data_storage.get(key, [])
    
    if room_data:
        latest_entry = room_data[-1]
        # 時刻を整形
        timestamp = datetime.fromisoformat(latest_entry["timestamp"]).strftime("%Y年%m月%d日 %H時%M分%S秒")
        return {
            "value": latest_entry["value"],
            "timestamp": timestamp
        }
    else:
        return {"value": "データがありません", "timestamp": None}

# ステータス定数
STATUS_VACANT = "vacant"
STATUS_WORKING = "working"
STATUS_IDLING = "idling"

# 2つのステータスを格納する変数
status_1 = STATUS_VACANT
status_2 = STATUS_VACANT

# 状態遷移ロジック（同じ重みで動かす）
def get_next_status(current_status):
    if current_status == STATUS_VACANT:
        return random.choices(
            [STATUS_VACANT, STATUS_WORKING],
            weights=[0.9, 0.1],
            k=1
        )[0]
    elif current_status == STATUS_WORKING:
        return random.choices(
            [STATUS_VACANT, STATUS_WORKING, STATUS_IDLING],
            weights=[0.1, 0.6, 0.3],
            k=1
        )[0]
    elif current_status == STATUS_IDLING:
        return random.choices(
            [STATUS_VACANT, STATUS_WORKING, STATUS_IDLING],
            weights=[0.1, 0.4, 0.5],
            k=1
        )[0]

# ステータス更新時に人物の切り替えと時間の積み上げ
def update_status():
    global status_1, status_2, current_person_room1, current_person_room2
    while True:
        new_status_1 = get_next_status(status_1)
        new_status_2 = get_next_status(status_2)

        if new_status_1 == "vacant" and status_1 != "vacant":
            current_person_room1 = random.choice(["佐藤", "山田"])
        if new_status_2 == "vacant" and status_2 != "vacant":
            current_person_room2 = random.choice(["田中", "高橋"])

        update_person_time(current_person_room1, new_status_1)
        update_person_time(current_person_room2, new_status_2)

        status_1, status_2 = new_status_1, new_status_2
        time.sleep(10)

# 人物の状態時間データをフロントエンドに提供
@app.route('/person_data', methods=['GET'])
def get_person_data():
    return jsonify({
        "room1": {"person": current_person_room1, "time": time_data[current_person_room1]},
        "room2": {"person": current_person_room2, "time": time_data[current_person_room2]}
    })

# APIエンドポイント
@app.route('/device_status', methods=['GET'])
def get_device_status():
    return jsonify({
        "status_1": status_1,
        "status_2": status_2
    })

# CSVから全ての人物のデータを取得して提供するエンドポイント
@app.route('/all_person_data', methods=['GET'])
def get_all_person_data():
    return jsonify(time_data)

# 既存のコードに続き、サーバー起動後にデータ更新スレッド開始
if __name__ == '__main__':
    Thread(target=generate_temperature_data, args=("room1",)).start()
    Thread(target=generate_humidity_data, args=("room1",)).start()
    Thread(target=generate_temperature_data, args=("room2",)).start()
    Thread(target=generate_humidity_data, args=("room2",)).start()
    Thread(target=generate_temperature_data, args=("room3",)).start()
    Thread(target=generate_humidity_data, args=("room3",)).start()
    
    # ステータス更新スレッドを開始
    Thread(target=update_status).start()
    
    app.run(port=5000)
