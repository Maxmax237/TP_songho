const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" }
});

app.use(express.static(path.join(__dirname))); // sert votre HTML/CSS/JS/APK

// Stockage des parties en mémoire
const rooms = new Map();

io.on('connection', (socket) => {
  console.log('✅ Joueur connecté:', socket.id);

  socket.on('createRoom', () => {
    const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
    socket.join(roomCode);
    rooms.set(roomCode, {
      players: [socket.id],
      turn: socket.id,
      board: { north: [4,4,4,4,4,4], south: [4,4,4,4,4,4] },
      scores: { [socket.id]: 0 }
    });
    socket.emit('roomCreated', { roomCode, playerId: socket.id });
    socket.emit('waitingForPlayer');
    console.log(`🎲 Partie créée: ${roomCode}`);
  });

  socket.on('joinRoom', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('error', 'Partie introuvable');
    if (room.players.length >= 2) return socket.emit('error', 'Partie pleine');
    socket.join(roomCode);
    room.players.push(socket.id);
    room.turn = room.players[0];
    io.to(roomCode).emit('gameStart', {
      players: room.players,
      turn: room.turn,
      board: room.board,
      scores: room.scores
    });
    console.log(`🚀 Partie ${roomCode} démarrée`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Joueur déconnecté:', socket.id);
    // Nettoyage simple (vous pourrez l'affiner)
    for (let [code, room] of rooms.entries()) {
      if (room.players.includes(socket.id)) {
        io.to(code).emit('playerLeft');
        rooms.delete(code);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Backend Socket.IO prêt sur le port ${PORT}`);
});
