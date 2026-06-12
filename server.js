const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Servir les fichiers statiques
app.use(express.static(__dirname));

// Stockage des parties
const rooms = new Map();

io.on('connection', (socket) => {
    console.log('👤 Joueur connecté:', socket.id);

    // Créer une partie
    socket.on('createRoom', () => {
        const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
        socket.join(roomCode);
        
        rooms.set(roomCode, {
            players: [socket.id],
            playerNames: { [socket.id]: 'JOUEUR 1' },
            turn: socket.id,
            gameStarted: false,
            scores: { [socket.id]: 0 },
            board: initBoard()
        });
        
        socket.emit('roomCreated', { roomCode, playerId: socket.id });
        socket.emit('waitingForPlayer', { message: 'En attente d\'un adversaire...' });
        console.log(`📦 Partie créée: ${roomCode} par ${socket.id}`);
    });

    // Rejoindre une partie
    socket.on('joinRoom', ({ roomCode, playerName }) => {
        const room = rooms.get(roomCode);
        
        if (!room) {
            socket.emit('error', 'Partie introuvable');
            return;
        }
        
        if (room.players.length >= 2) {
            socket.emit('error', 'Partie pleine');
            return;
        }
        
        socket.join(roomCode);
        room.players.push(socket.id);
        room.playerNames[socket.id] = 'JOUEUR 2';
        room.scores[socket.id] = 0;
        room.gameStarted = true;
        
        // Informer les deux joueurs que la partie commence
        io.to(roomCode).emit('gameStart', {
            players: {
                [room.players[0]]: 'JOUEUR 1',
                [room.players[1]]: 'JOUEUR 2'
            },
            currentTurn: room.turn,
            board: room.board,
            scores: room.scores
        });
        
        console.log(`🎮 Partie ${roomCode} démarrée avec 2 joueurs`);
    });

    // Jouer un coup
    socket.on('playMove', ({ roomCode, caseIndex, playerId }) => {
        const room = rooms.get(roomCode);
        
        if (!room || !room.gameStarted) {
            socket.emit('error', 'Partie non disponible');
            return;
        }
        
        if (room.turn !== socket.id) {
            socket.emit('error', 'Ce n\'est pas votre tour');
            return;
        }
        
        // Mettre à jour le plateau (logique du jeu Songho)
        const moveResult = applyMove(room.board, caseIndex, socket.id === room.players[0] ? 'north' : 'south');
        
        if (moveResult.valid) {
            room.board = moveResult.board;
            room.scores[socket.id] += moveResult.points;
            
            // Changer de joueur
            room.turn = room.players.find(id => id !== socket.id);
            
            // Envoyer la mise à jour aux deux joueurs
            io.to(roomCode).emit('moveMade', {
                board: room.board,
                scores: room.scores,
                currentTurn: room.turn,
                lastMove: { player: socket.id, caseIndex, points: moveResult.points }
            });
            
            // Vérifier la fin de partie
            if (isGameOver(room.board)) {
                let winner = room.scores[room.players[0]] > room.scores[room.players[1]] ? room.players[0] : room.players[1];
                io.to(roomCode).emit('gameOver', { winner, scores: room.scores });
                rooms.delete(roomCode);
            }
        } else {
            socket.emit('error', 'Coup invalide');
        }
    });

    // Quitter la partie
    socket.on('quitRoom', ({ roomCode }) => {
        const room = rooms.get(roomCode);
        if (room) {
            io.to(roomCode).emit('playerLeft', 'L\'adversaire a quitté la partie');
            rooms.delete(roomCode);
        }
        socket.leave(roomCode);
    });

    // Déconnexion
    socket.on('disconnect', () => {
        console.log('👋 Joueur déconnecté:', socket.id);
        // Nettoyer les parties où ce joueur était
        for (const [roomCode, room] of rooms.entries()) {
            if (room.players.includes(socket.id)) {
                io.to(roomCode).emit('playerLeft', 'L\'adversaire a quitté la partie');
                rooms.delete(roomCode);
                break;
            }
        }
    });
});

// Initialiser le plateau du jeu Songho
function initBoard() {
    return {
        north: [4, 4, 4, 4, 4, 4], // 6 cases pour le joueur du haut
        south: [4, 4, 4, 4, 4, 4]  // 6 cases pour le joueur du bas
    };
}

// Appliquer un coup (logique simplifiée du Songho)
function applyMove(board, caseIndex, player) {
    // À adapter selon les règles exactes du Songho
    // Version simplifiée pour test
    let points = 0;
    let valid = true;
    const row = player === 'north' ? board.north : board.south;
    
    if (row[caseIndex] === 0) {
        valid = false;
    } else {
        points = row[caseIndex];
        row[caseIndex] = 0;
    }
    
    return { valid, board, points };
}

// Vérifier si la partie est finie
function isGameOver(board) {
    const northEmpty = board.north.every(cell => cell === 0);
    const southEmpty = board.south.every(cell => cell === 0);
    return northEmpty || southEmpty;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur le port ${PORT}`);
    console.log(`📱 Disponible sur http://localhost:${PORT}`);
});
