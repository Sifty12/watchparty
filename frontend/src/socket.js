import { io } from 'socket.io-client'

const socket = io('https://watchparty-jurp.onrender.com')

export default socket