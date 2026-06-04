import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

/**
 * WebSocket Real-Time Communication Server
 * Handles: live conversation, real-time typing, translation streaming
 */

export interface UserSession {
  userId: string
  username: string
  sourceLanguage: string
  targetLanguage: string
  isRecording: boolean
  socketId: string
}

export interface ConversationMessage {
  id: string
  userId: string
  username: string
  originalText: string
  translatedText: string
  timestamp: number
  isAudio: boolean
}

export class PolytalkWebSocketServer {
  private io: SocketIOServer
  private activeSessions: Map<string, UserSession> = new Map()
  private conversationRooms: Map<string, ConversationMessage[]> = new Map()

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: Socket) => {
      console.log('[v0] WebSocket: Client connected', socket.id)

      // User joins conversation
      socket.on('user:join', (data: any) => {
        this.handleUserJoin(socket, data)
      })

      // Real-time recording started
      socket.on('recording:start', (data: any) => {
        this.handleRecordingStart(socket, data)
      })

      // Audio chunk received
      socket.on('audio:chunk', (data: any) => {
        this.handleAudioChunk(socket, data)
      })

      // Recording finished
      socket.on('recording:stop', (data: any) => {
        this.handleRecordingStop(socket, data)
      })

      // Message received
      socket.on('message:send', (data: any) => {
        this.handleMessage(socket, data)
      })

      // User leaves
      socket.on('disconnect', () => {
        this.handleUserDisconnect(socket)
      })

      socket.on('error', (error) => {
        console.error('[v0] WebSocket error:', error)
      })
    })
  }

  private handleUserJoin(socket: Socket, data: any) {
    const session: UserSession = {
      userId: data.userId,
      username: data.username,
      sourceLanguage: data.sourceLanguage,
      targetLanguage: data.targetLanguage,
      isRecording: false,
      socketId: socket.id,
    }

    this.activeSessions.set(socket.id, session)
    socket.join(`conversation:${data.conversationId}`)

    // Notify others that user joined
    socket.to(`conversation:${data.conversationId}`).emit('user:joined', {
      username: session.username,
      timestamp: Date.now(),
    })

    // Send user active users count
    socket.emit('users:active', {
      count: this.activeSessions.size,
      users: Array.from(this.activeSessions.values()).map(s => ({
        username: s.username,
        sourceLanguage: s.sourceLanguage,
      })),
    })
  }

  private handleRecordingStart(socket: Socket, data: any) {
    const session = this.activeSessions.get(socket.id)
    if (session) {
      session.isRecording = true
      socket.emit('recording:acknowledged', { status: 'recording' })
    }
  }

  private handleAudioChunk(socket: Socket, data: any) {
    const session = this.activeSessions.get(socket.id)
    if (session) {
      // Stream audio chunk to other users for real-time playback
      socket.to(`conversation:${data.conversationId}`).emit('audio:chunk', {
        chunk: data.chunk,
        userId: session.userId,
      })
    }
  }

  private handleRecordingStop(socket: Socket, data: any) {
    const session = this.activeSessions.get(socket.id)
    if (session) {
      session.isRecording = false
      socket.emit('recording:completed', { status: 'completed' })
    }
  }

  private handleMessage(socket: Socket, data: any) {
    const session = this.activeSessions.get(socket.id)
    if (!session) return

    const message: ConversationMessage = {
      id: Date.now().toString(),
      userId: session.userId,
      username: session.username,
      originalText: data.text,
      translatedText: data.translatedText || '',
      timestamp: Date.now(),
      isAudio: data.isAudio || false,
    }

    // Store message
    const roomId = `conversation:${data.conversationId}`
    if (!this.conversationRooms.has(roomId)) {
      this.conversationRooms.set(roomId, [])
    }
    this.conversationRooms.get(roomId)?.push(message)

    // Broadcast to room
    this.io.to(roomId).emit('message:received', message)

    // Emit typing indicator
    socket.to(roomId).emit('user:typing', {
      userId: session.userId,
      username: session.username,
    })
  }

  private handleUserDisconnect(socket: Socket) {
    const session = this.activeSessions.get(socket.id)
    if (session) {
      console.log('[v0] WebSocket: User disconnected', session.username)
      this.activeSessions.delete(socket.id)
    }
  }

  public getIO(): SocketIOServer {
    return this.io
  }

  public getActiveSessions(): UserSession[] {
    return Array.from(this.activeSessions.values())
  }

  public getConversationMessages(conversationId: string): ConversationMessage[] {
    return this.conversationRooms.get(`conversation:${conversationId}`) || []
  }
}

export default PolytalkWebSocketServer
