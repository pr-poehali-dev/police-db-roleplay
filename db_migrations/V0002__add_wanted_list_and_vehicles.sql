-- Таблица для розыска граждан
CREATE TABLE wanted_list (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT fk_wanted_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id),
    CONSTRAINT fk_wanted_added_by FOREIGN KEY (added_by) REFERENCES users(id)
);

-- Таблица для транспортных средств
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER NOT NULL,
    plate_number VARCHAR(20) NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    color VARCHAR(50),
    year INTEGER,
    notes TEXT,
    added_by INTEGER NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT fk_vehicle_citizen FOREIGN KEY (citizen_id) REFERENCES citizens(id),
    CONSTRAINT fk_vehicle_added_by FOREIGN KEY (added_by) REFERENCES users(id)
);

-- Индексы для быстрого поиска
CREATE INDEX idx_wanted_citizen ON wanted_list(citizen_id) WHERE is_active = true;
CREATE INDEX idx_wanted_active ON wanted_list(is_active);
CREATE INDEX idx_vehicles_citizen ON vehicles(citizen_id) WHERE is_active = true;
CREATE INDEX idx_vehicles_plate ON vehicles(plate_number) WHERE is_active = true;