-- Création de la base de données
CREATE DATABASE IF NOT EXISTS songho_online;
USE songho_online;

-- Table des parties
CREATE TABLE IF NOT EXISTS game_rooms (
    room_code VARCHAR(6) PRIMARY KEY,
    board_north VARCHAR(100) NOT NULL,
    board_south VARCHAR(100) NOT NULL,
    captured_north INT DEFAULT 0,
    captured_south INT DEFAULT 0,
    current_player VARCHAR(10) DEFAULT 'south',
    game_active BOOLEAN DEFAULT TRUE,
    game_ended BOOLEAN DEFAULT FALSE,
    winner VARCHAR(50) DEFAULT NULL,
    player_north_id VARCHAR(32) DEFAULT NULL,
    player_south_id VARCHAR(32) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_move TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_room_code (room_code)
);

-- Table des sessions actives (pour nettoyage)
CREATE TABLE IF NOT EXISTS active_sessions (
    player_id VARCHAR(32) PRIMARY KEY,
    room_code VARCHAR(6),
    last_ping TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_code) REFERENCES game_rooms(room_code) ON DELETE CASCADE,
    INDEX idx_last_ping (last_ping)
);