# 🎬 Watch Party App

A real-time YouTube Watch Party application where multiple users can watch videos together in sync.

## 🔗 Live Demo
- **Frontend:** https://cerulean-croissant-e50397.netlify.app
- **Backend:** https://watchparty-jurp.onrender.com

## 🛠️ Tech Stack
- **Frontend:** React + Vite + Socket.IO Client
- **Backend:** Python + FastAPI + python-socketio
- **WebSockets:** Socket.IO (real-time communication)
- **Video:** YouTube IFrame API
- **Deployment:** Netlify (frontend) + Render (backend)

## ⚙️ Local Setup

### Backend
```bash
cd watchparty/backend
pip install fastapi python-socketio uvicorn
python -m uvicorn main:combined_app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🏗️ Architecture Overview

### How WebSockets Work in This App
The app uses Socket.IO for real-time bidirectional communication between the server and all clients in a room.

1. **User joins a room** → Server assigns role (Host if first, else Participant)
2. **Host presses Play** → Client emits `play` event to server
3. **Server validates role** → Only Host/Moderator can control playback
4. **Server broadcasts `sync_state`** → All clients in the room receive the event
5. **All clients sync** → YouTube player seeks to same time and plays

### WebSocket Events
| Event | Direction | Description |
|-------|-----------|-------------|
| join_room | Client → Server | Join or create a room |
| play | Client → Server | Play video (Host/Mod only) |
| pause | Client → Server | Pause video (Host/Mod only) |
| seek | Client → Server | Seek video (Host/Mod only) |
| change_video | Client → Server | Change YouTube video |
| assign_role | Client → Server | Assign role to user (Host only) |
| remove_participant | Client → Server | Remove user (Host only) |
| sync_state | Server → Clients | Broadcast video state to all |
| user_joined | Server → Clients | New user joined room |
| role_assigned | Server → Clients | Role updated |

## 👥 Role-Based Access Control
| Role | Permissions |
|------|-------------|
| Host | Full control: play, pause, seek, change video, assign roles, remove users |
| Moderator | Play, pause, seek, change video |
| Participant | Watch only |

## ✨ Features
- Create or join watch rooms with unique codes
- Synchronized YouTube playback for all participants
- Role-based access control
- Host can assign Moderator role to participants
- Host can remove participants from room
- Real-time participant list with roles