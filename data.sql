CREATE DATABASE IF NOT EXISTS songho_online;
USE songho_online;

CREATE TABLE IF NOT EXISTS game_rooms (
    room_code VARCHAR(6) PRIMARY KEY,
    board_north VARCHAR(100) NOT NULL DEFAULT '4,4,4,4,4,4',
    board_south VARCHAR(100) NOT NULL DEFAULT '4,4,4,4,4,4',
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
