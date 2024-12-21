import http from 'http'
import SocketService from './services/socket'
import { PrismaClient } from '@prisma/client';

const PORT = process.env.PORT || 8000

const prisma = new PrismaClient();

async function checkDatabaseConnection() {
    try {
      await prisma.$connect();
      console.log('Database connection successful');
    } catch (error: any) {
      console.error('Database connection failed:', error.message);
      process.exit(1); // Exit the process if the database connection fails
    }
  }

async function init(){
    await checkDatabaseConnection();

    const socketService = new SocketService()

    const httpServer = http.createServer()

    socketService.io.attach(httpServer)

    httpServer.listen(PORT, ()=>{
        console.log(`Server running on http://localhost:${PORT}`)
    })

    socketService.initListeners()
}

init()