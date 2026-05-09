import socket from '../socket'

function ParticipantList({ participants, myRole, roomId }) {

  const assignRole = (userId, role) => {
    socket.emit('assign_role', { roomId, userId, role })
  }

  const removeParticipant = (userId) => {
    socket.emit('remove_participant', { roomId, userId })
  }

  return (
    <div style={{ background: '#16213e', padding: '20px', borderRadius: '12px', width: '280px', color: 'white' }}>
      <h3 style={{ marginBottom: '15px', color: '#e94560' }}>👥 Participants ({participants.length})</h3>
      {participants.map((p) => (
        <div key={p.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #333' }}>
          <div>
            <span style={{ marginRight: '8px' }}>{p.username}</span>
            <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '11px', textTransform: 'uppercase', background: p.role === 'host' ? '#e94560' : p.role === 'moderator' ? '#f5a623' : '#444' }}>
              {p.role}
            </span>
          </div>
          {myRole === 'host' && p.role !== 'host' && (
            <div style={{ display: 'flex', gap: '5px' }}>
              {p.role === 'participant' && (
                <button style={{ background: '#f5a623', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: 'none', cursor: 'pointer' }}
                  onClick={() => assignRole(p.userId, 'moderator')}>
                  Make Mod
                </button>
              )}
              {p.role === 'moderator' && (
                <button style={{ background: '#f5a623', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: 'none', cursor: 'pointer' }}
                  onClick={() => assignRole(p.userId, 'participant')}>
                  Remove Mod
                </button>
              )}
              <button style={{ background: '#e94560', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: 'none', cursor: 'pointer' }}
                onClick={() => removeParticipant(p.userId)}>
                Kick
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default ParticipantList