import { useState, useEffect, useRef } from 'react'
import socket from '../socket'
import ParticipantList from './ParticipantList'

function Room({ roomData }) {
  const { roomId, username, role: initialRole } = roomData
  const [participants, setParticipants] = useState([])
  const [myRole, setMyRole] = useState(initialRole)
  const [videoId, setVideoId] = useState('dQw4w9WgXcQ')
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const playerRef = useRef(null)
  const playerReady = useRef(false)

  const canControl = myRole === 'host' || myRole === 'moderator'

  const extractVideoId = (url) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : null
  }

  useEffect(() => {
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player('yt-player', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: { controls: canControl ? 1 : 0 },
        events: {
          onReady: () => { playerReady.current = true },
          onStateChange: (e) => {
            if (!canControl) return
            if (e.data === window.YT.PlayerState.PLAYING) {
              socket.emit('play', { roomId, time: playerRef.current.getCurrentTime() })
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              socket.emit('pause', { roomId, time: playerRef.current.getCurrentTime() })
            }
          }
        }
      })
    }
  }, [])

  useEffect(() => {
    socket.on('user_joined', (data) => setParticipants(data.participants))
    socket.on('user_left', (data) => setParticipants(data.participants))
    socket.on('role_assigned', (data) => {
      setParticipants(data.participants)
      if (data.userId === socket.id) setMyRole(data.role)
    })
    socket.on('participant_removed', (data) => {
      setParticipants(data.participants)
      if (data.userId === socket.id) alert('You were removed!')
    })
    socket.on('sync_state', (data) => {
      if (!playerReady.current) return
      if (data.videoId && data.videoId !== videoId) {
        setVideoId(data.videoId)
        playerRef.current.loadVideoById(data.videoId)
      }
      if (data.playState === 'playing') {
        playerRef.current.seekTo(data.currentTime, true)
        playerRef.current.playVideo()
      } else {
        playerRef.current.seekTo(data.currentTime, true)
        playerRef.current.pauseVideo()
      }
    })

    return () => {
      socket.off('user_joined')
      socket.off('user_left')
      socket.off('role_assigned')
      socket.off('participant_removed')
      socket.off('sync_state')
    }
  }, [videoId])

  const handleChangeVideo = () => {
    if (!canControl) return alert('Only Host/Moderator can change video!')
    const id = extractVideoId(newVideoUrl)
    if (!id) return alert('Invalid YouTube URL!')
    socket.emit('change_video', { roomId, videoId: id })
    setNewVideoUrl('')
  }

  return (
    <div style={{ minHeight: '100vh', padding: '20px', background: '#1a1a2e', color: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background: '#16213e', padding: '15px 20px', borderRadius: '10px' }}>
        <h2>🎬 Watch Party</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#aaa' }}>Room: <b>{roomId}</b></span>
          <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', background: myRole === 'host' ? '#e94560' : myRole === 'moderator' ? '#f5a623' : '#444' }}>
            {myRole}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ width: '100%', aspectRatio: '16/9', background: '#000', borderRadius: '10px', overflow: 'hidden' }}>
            <div id="yt-player" style={{ width: '100%', height: '100%' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            {canControl ? (
              <>
                <button style={{ background: '#0f3460', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
                  onClick={() => socket.emit('play', { roomId, time: playerRef.current?.getCurrentTime() || 0 })}>
                  ▶ Play
                </button>
                <button style={{ background: '#0f3460', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
                  onClick={() => socket.emit('pause', { roomId, time: playerRef.current?.getCurrentTime() || 0 })}>
                  ⏸ Pause
                </button>
                <button style={{ background: '#0f3460', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
                  onClick={() => socket.emit('seek', { roomId, time: playerRef.current?.getCurrentTime() || 0 })}>
                  🔄 Sync
                </button>
              </>
            ) : (
              <p style={{ color: '#aaa' }}>👁 Watch only — only Host/Moderator can control</p>
            )}
          </div>

          {canControl && (
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <input
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', fontSize: '14px' }}
                placeholder="Paste YouTube URL to change video..."
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
              />
              <button style={{ background: '#e94560', color: 'white', padding: '10px 20px', borderRadius: '8px' }}
                onClick={handleChangeVideo}>
                Change Video
              </button>
            </div>
          )}
        </div>

        <ParticipantList participants={participants} myRole={myRole} roomId={roomId} />
      </div>
    </div>
  )
}

export default Room