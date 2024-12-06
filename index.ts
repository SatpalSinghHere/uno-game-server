import http from 'http'
import SocketService from './services/socket'

const PORT = process.env.PORT || 8000

async function init(){
    const socketService = new SocketService()

    const httpServer = http.createServer()

    socketService.io.attach(httpServer)

    httpServer.listen(PORT, ()=>{
        console.log(`Server running on http://localhost:${PORT}`)
    })

    socketService.initListeners()
}

init()