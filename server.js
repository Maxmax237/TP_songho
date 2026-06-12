const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('.'));

const rooms = new Map();

io.on('connection', (socket) => {
    console.log('Joueur connecté');
    
    socket.on('createRoom', () => {
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        socket.join(roomCode);
        rooms.set(roomCode, { players: [socket.id], turn: socket.id });
        socket.emit('roomCreated', roomCode);
    });
    
    socket.on('joinRoom', (roomCode) => {
        const room = rooms.get(roomCode);
        if (room && room.players.length < 2) {
            socket.join(roomCode);
            room.players.push(socket.id);
            io.to(roomCode).emit('gameStart', { 
                players: ['JOUEUR 1', 'JOUEUR 2'],
                yourTurn: socket.id === room.turn 
            });
        } else {
            socket.emit('error', 'Partie pleine ou inexistante');
        }
    });
    
    socket.on('move', ({ roomCode, caseIndex }) => {
        io.to(roomCode).emit('moveMade', { caseIndex, playerId: socket.id });
    });
});

server.listen(process.env.PORT || 3000);
