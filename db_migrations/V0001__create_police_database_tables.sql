-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'moderator', 'admin')),
    full_name VARCHAR(255) NOT NULL,
    badge_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Citizens table (персонажи)
CREATE TABLE IF NOT EXISTS citizens (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    photo_url TEXT,
    occupation VARCHAR(255),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criminal records table
CREATE TABLE IF NOT EXISTS criminal_records (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER REFERENCES citizens(id),
    crime_type VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    date_committed DATE NOT NULL,
    arresting_officer INTEGER REFERENCES users(id),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'closed', 'pending')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor', 'moderate', 'severe')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fines table
CREATE TABLE IF NOT EXISTS fines (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER REFERENCES citizens(id),
    amount DECIMAL(10, 2) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('unpaid', 'paid', 'cancelled')),
    issued_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP
);

-- Warnings table
CREATE TABLE IF NOT EXISTS warnings (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER REFERENCES citizens(id),
    warning_text TEXT NOT NULL,
    issued_by INTEGER REFERENCES users(id),
    is_active BOOLEAN DEFAULT TRUE,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patrol units table
CREATE TABLE IF NOT EXISTS patrol_units (
    id SERIAL PRIMARY KEY,
    unit_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('available', 'busy', 'offline', 'emergency')),
    location_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    officer_1 INTEGER REFERENCES users(id),
    officer_2 INTEGER REFERENCES users(id),
    vehicle_number VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, password_hash, role, full_name, badge_number) 
VALUES ('admin', 'admin123hash', 'admin', 'Главный администратор', 'ADM-001');

-- Insert sample moderator
INSERT INTO users (username, password_hash, role, full_name, badge_number) 
VALUES ('moderator', 'mod123hash', 'moderator', 'Модератор Иванов', 'MOD-042');

-- Insert sample user
INSERT INTO users (username, password_hash, role, full_name, badge_number) 
VALUES ('officer', 'user123hash', 'user', 'Офицер Петров', 'OFF-123');

-- Insert sample citizens
INSERT INTO citizens (first_name, last_name, date_of_birth, address, phone, occupation, created_by)
VALUES 
('Иван', 'Смирнов', '1985-03-15', 'ул. Ленина, д.42, кв.15', '+7-999-123-4567', 'Программист', 1),
('Анна', 'Петрова', '1992-07-22', 'пр. Мира, д.10, кв.88', '+7-999-234-5678', 'Учитель', 1),
('Дмитрий', 'Козлов', '1978-11-03', 'ул. Садовая, д.5', '+7-999-345-6789', 'Механик', 1);

-- Insert sample criminal records
INSERT INTO criminal_records (citizen_id, crime_type, description, date_committed, arresting_officer, status, severity)
VALUES 
(3, 'Превышение скорости', 'Превышение скорости на 40 км/ч', '2024-10-15', 3, 'closed', 'minor'),
(3, 'Нарушение ПДД', 'Проезд на красный свет', '2024-11-01', 2, 'active', 'moderate');

-- Insert sample fines
INSERT INTO fines (citizen_id, amount, reason, status, issued_by)
VALUES 
(3, 5000.00, 'Превышение скорости', 'paid', 3),
(3, 3000.00, 'Проезд на красный свет', 'unpaid', 2);

-- Insert sample warnings
INSERT INTO warnings (citizen_id, warning_text, issued_by)
VALUES 
(1, 'Предупреждение за курение в общественном месте', 3),
(2, 'Предупреждение за шумное поведение', 2);

-- Insert sample patrol units
INSERT INTO patrol_units (unit_name, status, location_name, latitude, longitude, officer_1, officer_2, vehicle_number)
VALUES 
('Альфа-1', 'available', 'Центральный район', 55.751244, 37.618423, 2, 3, 'A777AA777'),
('Бета-2', 'busy', 'Промышленная зона', 55.742244, 37.628423, 3, NULL, 'B555BB555');