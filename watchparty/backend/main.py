import socketio
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

rooms = {}

def get_participants_list(room_id):
    room = rooms.get(room_id, {})
    result = []
    for uid, info in room.get("participants", {}).items():
        result.append({
            "userId": uid,
            "username": info["username"],
            "role": info["role"]
        })
    return result

def get_user_role(room_id, user_id):
    room = rooms.get(room_id)
    if not room:
        return None
    return room["participants"].get(user_id, {}).get("role")

@sio.event
async def connect(sid, environ):
    print(f"Connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Disconnected: {sid}")
    for room_id, room in list(rooms.items()):
        if sid in room["participants"]:
            username = room["participants"][sid]["username"]
            del room["participants"][sid]
            participants = get_participants_list(room_id)
            await sio.emit("user_left", {
                "userId": sid,
                "username": username,
                "participants": participants
            }, room=room_id)
            if not room["participants"]:
                del rooms[room_id]
            break

@sio.event
async def join_room(sid, data):
    room_id = data["roomId"]
    username = data["username"]
    if room_id not in rooms:
        rooms[room_id] = {
            "video_id": "dQw4w9WgXcQ",
            "play_state": "paused",
            "current_time": 0,
            "participants": {}
        }
        role = "host"
    else:
        role = "participant"
    rooms[room_id]["participants"][sid] = {
        "username": username,
        "role": role
    }
    await sio.enter_room(sid, room_id)
    participants = get_participants_list(room_id)
    await sio.emit("user_joined", {
        "userId": sid,
        "username": username,
        "role": role,
        "participants": participants
    }, room=room_id)
    room = rooms[room_id]
    await sio.emit("sync_state", {
        "playState": room["play_state"],
        "currentTime": room["current_time"],
        "videoId": room["video_id"]
    }, to=sid)

@sio.event
async def play(sid, data):
    room_id = data["roomId"]
    if get_user_role(room_id, sid) not in ["host", "moderator"]:
        return
    time = data.get("time", 0)
    rooms[room_id]["play_state"] = "playing"
    rooms[room_id]["current_time"] = time
    await sio.emit("sync_state", {
        "playState": "playing",
        "currentTime": time,
        "videoId": rooms[room_id]["video_id"]
    }, room=room_id)

@sio.event
async def pause(sid, data):
    room_id = data["roomId"]
    if get_user_role(room_id, sid) not in ["host", "moderator"]:
        return
    time = data.get("time", 0)
    rooms[room_id]["play_state"] = "paused"
    rooms[room_id]["current_time"] = time
    await sio.emit("sync_state", {
        "playState": "paused",
        "currentTime": time,
        "videoId": rooms[room_id]["video_id"]
    }, room=room_id)

@sio.event
async def seek(sid, data):
    room_id = data["roomId"]
    if get_user_role(room_id, sid) not in ["host", "moderator"]:
        return
    time = data.get("time", 0)
    rooms[room_id]["current_time"] = time
    await sio.emit("sync_state", {
        "playState": rooms[room_id]["play_state"],
        "currentTime": time,
        "videoId": rooms[room_id]["video_id"]
    }, room=room_id)

@sio.event
async def change_video(sid, data):
    room_id = data["roomId"]
    if get_user_role(room_id, sid) not in ["host", "moderator"]:
        return
    video_id = data["videoId"]
    rooms[room_id]["video_id"] = video_id
    rooms[room_id]["play_state"] = "paused"
    rooms[room_id]["current_time"] = 0
    await sio.emit("sync_state", {
        "playState": "paused",
        "currentTime": 0,
        "videoId": video_id
    }, room=room_id)

@sio.event
async def assign_role(sid, data):
    room_id = data["roomId"]
    if get_user_role(room_id, sid) != "host":
        return
    target_id = data["userId"]
    new_role = data["role"]
    if target_id in rooms[room_id]["participants"]:
        rooms[room_id]["participants"][target_id]["role"] = new_role
        participants = get_participants_list(room_id)
        await sio.emit("role_assigned", {
            "userId": target_id,
            "username": rooms[room_id]["participants"][target_id]["username"],
            "role": new_role,
            "participants": participants
        }, room=room_id)

@sio.event
async def remove_participant(sid, data):
    room_id = data["roomId"]
    if get_user_role(room_id, sid) != "host":
        return
    target_id = data["userId"]
    if target_id in rooms[room_id]["participants"]:
        del rooms[room_id]["participants"][target_id]
        await sio.leave_room(target_id, room_id)
        participants = get_participants_list(room_id)
        await sio.emit("participant_removed", {
            "userId": target_id,
            "participants": participants
        }, room=room_id)

combined_app = socketio.ASGIApp(sio, app)

if __name__ == "__main__":
    uvicorn.run(combined_app, host="0.0.0.0", port=8000)