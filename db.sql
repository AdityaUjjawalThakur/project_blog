create database blog;
use blog;
CREATE TABLE IF NOT EXISTS users (
    id AUTOINCREMENT VARCHAR(50) PRIMARY KEY not NULL,
    name VARCHAR(100) not NULL,
    email VARCHAR(100) not null UNIQUE,
    password VARCHAR(255) not null,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

