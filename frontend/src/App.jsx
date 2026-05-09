import { useState } from 'react'
import Home from './components/Home'
import Room from './components/Room'

function App() {
  const [roomData, setRoomData] = useState(null)

  if (!roomData) {
    return <Home setRoomData={setRoomData} />
  }

  return <Room roomData={roomData} />
}

export default App