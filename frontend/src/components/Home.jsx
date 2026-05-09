import { useState } from 'react'
import socket from '../socket'

function Home({ setRoomData }) {
  const [username, setUsername] = useState('')
  const [roomId, setRoomId] = useState('')
  const [loading, setLoading] = useState(false)

  const createRoom = () => {
    if (!username.trim()) return alert('Enter your name!')
    setLoading(true)
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase()
    socket.emit('join_room', { roomId: newRoomId, username })
    socket.on('user_joined', (data) => {
      setRoomData({ roomId: newRoomId, username, userId: socket.id, role: data.role })
      setLoading(false)
    })
  }

  const joinRoom = () => {
    if (!username.trim()) return alert('Enter your name!')
    if (!roomId.trim()) return alert('Enter room code!')
    setLoading(true)
    socket.emit('join_room', { roomId: roomId.toUpperCase(), username })
    socket.on('user_joined', (data) => {
      setRoomData({ roomId: roomId.toUpperCase(), username, userId: socket.id, role: data.role })
      setLoading(false)
    })
  }

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', padding: '20px',
      background: '#1a1a2e'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '10px', color: 'white' }}>🎬 Watch Party</h1>
      <p style={{ color: '#aaa', marginBottom: '40px' }}>Watch YouTube videos together in sync!</p>

      <div style={{
        background: '#16213e', padding: '40px',
        borderRadius: '12px', width: '100%',
        maxWidth: '400px', display: 'flex',
        flexDirection: 'column', gap: '15px'
      }}>
        <input
          style={{ padding: '12px', borderRadius: '8px', border: 'none', fontSize: '15px' }}
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button
          style={{ background: '#e94560', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          onClick={createRoom}
          disabled={loading}
        >
          {loading ? 'Creating...' : '🚀 Create New Room'}
        </button>

        <div style={{ textAlign: 'center', color: '#aaa' }}>── OR ──</div>

        <input
          style={{ padding: '12px', borderRadius: '8px', border: 'none', fontSize: '15px' }}
          placeholder="Enter Room Code"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <button
          style={{ background: '#0f3460', color: 'white', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}
          onClick={joinRoom}
          disabled={loading}
        >
          {loading ? 'Joining...' : '🔗 Join Existing Room'}
        </button>
      </div>
    </div>
  )
}

export default Home