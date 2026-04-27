const pool = require('./database');

const migrations = `
  -- Extensão para cálculo de distância geoespacial
  CREATE EXTENSION IF NOT EXISTS cube;
  CREATE EXTENSION IF NOT EXISTS earthdistance;

  -- Tabela de usuários
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tabela de relatos rápidos (animal encontrado — sem login)
  CREATE TABLE IF NOT EXISTS quick_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_text TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    city VARCHAR(255),
    neighborhood VARCHAR(255),
    photo_url TEXT NOT NULL,
    reporter_name VARCHAR(255),
    reporter_phone VARCHAR(20),
    accepts_contact BOOLEAN DEFAULT false,
    contact_methods JSONB DEFAULT '[]',
    wants_updates BOOLEAN DEFAULT false,
    reporter_email VARCHAR(255),
    animal_type VARCHAR(50),
    animal_color VARCHAR(255),
    description TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Tabela de animais perdidos (requer login)
  CREATE TABLE IF NOT EXISTS lost_pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    breed VARCHAR(255),
    color VARCHAR(255) NOT NULL,
    approximate_age VARCHAR(100),
    last_seen_location TEXT NOT NULL,
    last_seen_latitude DECIMAL(10, 8),
    last_seen_longitude DECIMAL(11, 8),
    city VARCHAR(255),
    neighborhood VARCHAR(255),
    description TEXT,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    reward_info TEXT,
    status VARCHAR(50) DEFAULT 'lost',
    photos JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Índices para performance de busca
  CREATE INDEX IF NOT EXISTS idx_quick_reports_created_at ON quick_reports(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_quick_reports_animal_type ON quick_reports(animal_type);
  CREATE INDEX IF NOT EXISTS idx_quick_reports_status ON quick_reports(status);
  CREATE INDEX IF NOT EXISTS idx_quick_reports_city ON quick_reports(city);
  CREATE INDEX IF NOT EXISTS idx_lost_pets_created_at ON lost_pets(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_lost_pets_type ON lost_pets(type);
  CREATE INDEX IF NOT EXISTS idx_lost_pets_status ON lost_pets(status);
  CREATE INDEX IF NOT EXISTS idx_lost_pets_user_id ON lost_pets(user_id);
  CREATE INDEX IF NOT EXISTS idx_lost_pets_city ON lost_pets(city);

  -- Trigger para atualizar updated_at automaticamente
  CREATE OR REPLACE FUNCTION update_updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  DROP TRIGGER IF EXISTS update_users_updated_at ON users;
  CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_quick_reports_updated_at ON quick_reports;
  CREATE TRIGGER update_quick_reports_updated_at
    BEFORE UPDATE ON quick_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

  DROP TRIGGER IF EXISTS update_lost_pets_updated_at ON lost_pets;
  CREATE TRIGGER update_lost_pets_updated_at
    BEFORE UPDATE ON lost_pets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Iniciando migrations...');
    await client.query(migrations);
    console.log('✅ Migrations executadas com sucesso!');
  } catch (error) {
    console.error('❌ Erro nas migrations:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
