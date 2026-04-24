import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

class SocketService {
    constructor(server) {
        this.io = new Server(server, {
            cors: {
                origin: process.env.CLIENT_URL || 'http://localhost:3000',
                credentials: true
            }
        });
        
        this.authenticate();
        this.setupEvents();
    }
    
    authenticate() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                socket.userId = decoded.userId;
                socket.role = decoded.role;
                next();
            } catch (err) {
                next(new Error('Authentication error'));
            }
        });
    }
    
    setupEvents() {
        this.io.on('connection', (socket) => {
            console.log(`User connected: ${socket.userId}`);
            
            // Join user-specific room
            socket.join(`user:${socket.userId}`);
            
            // Handle notifications
            socket.on('mark-notification-read', async (notificationId) => {
                await this.markNotificationAsRead(notificationId, socket.userId);
                socket.emit('notification-updated', { id: notificationId, read: true });
            });
            
            socket.on('disconnect', () => {
                console.log(`User disconnected: ${socket.userId}`);
            });
        });
    }
    
    sendNotification(userId, notification) {
        this.io.to(`user:${userId}`).emit('new-notification', notification);
    }
    
    sendGradeUpdate(studentId, courseId, grade) {
        this.io.to(`user:${studentId}`).emit('grade-updated', {
            courseId,
            grade,
            timestamp: new Date()
        });
    }
    
    sendAnnouncement(announcement, targetRoles) {
        targetRoles.forEach(role => {
            this.io.to(`role:${role}`).emit('announcement', announcement);
        });
    }
}

export default SocketService;