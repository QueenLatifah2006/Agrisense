-- Script de création des tables pour AgriSense AI

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'farmer',
    profile_picture TEXT,
    domain VARCHAR(255),
    organization_id VARCHAR(255),
    phone VARCHAR(50),
    location VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT role_check CHECK (role IN ('superadmin', 'admin', 'farmer'))
);

-- Insertion ou mise à jour du SuperAdmin par défaut (Mot de passe: SuperAdmin@123)
-- Pour corriger les anciennes installations avec un hash invalide, on remplace s'il existe déjà
INSERT INTO users (name, email, password, role)
VALUES ('Super Admin', 'superadmin@agrisense.ai', '$2b$10$5fzFLDqzvoUG0G5xXlzl3ea2T/c7hJrcqCxInUK1OHlaP4sbguvGq', 'superadmin')
ON CONFLICT (email) 
DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role;

-- Table des cultures
CREATE TABLE IF NOT EXISTS crops (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(255),
    variety VARCHAR(255),
    area VARCHAR(255),
    planting_date DATE,
    sowing_start DATE,
    sowing_end DATE,
    harvest_start DATE,
    harvest_end DATE,
    selling_start DATE,
    selling_end DATE,
    status VARCHAR(50) DEFAULT 'active',
    progress DECIMAL DEFAULT 0,
    image_url TEXT,
    price_recorded_date VARCHAR(100),
    market VARCHAR(255),
    quantity DECIMAL DEFAULT 0,
    price DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table de l'historique des chats
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    last_message TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'validated'
    cloudinary_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des messages détaillés
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chat_history(id),
    sender VARCHAR(50), -- 'user' or 'ai'
    content TEXT NOT NULL,
    pdf_url TEXT,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des codes de réinitialisation
CREATE TABLE IF NOT EXISTS reset_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Table des notes de terrain
CREATE TABLE IF NOT EXISTS farmer_notes (
    id SERIAL PRIMARY KEY,
    farmer_name VARCHAR(255) NOT NULL,
    crop_name VARCHAR(255) NOT NULL,
    price DECIMAL NOT NULL,
    zone VARCHAR(255) NOT NULL,
    recorded_at VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    pdf_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    knowledge_base_stored BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

