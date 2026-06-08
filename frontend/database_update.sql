-- Migration: Add structured address fields and color standardization
-- Description: Adds logradouro, numero, bairro, cidade, estado, cep fields
--              and standardizes the color field for both quick_reports and lost_pets tables

-- Alter quick_reports table
ALTER TABLE quick_reports
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(255),
ADD COLUMN IF NOT EXISTS cidade VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS cor_padronizada VARCHAR(50);

-- Create an index for faster searches by structured address fields
CREATE INDEX IF NOT EXISTS idx_quick_reports_cidade_bairro ON quick_reports(cidade, bairro);
CREATE INDEX IF NOT EXISTS idx_quick_reports_cor ON quick_reports(cor_padronizada);

-- Alter lost_pets table
ALTER TABLE lost_pets
ADD COLUMN IF NOT EXISTS logradouro VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero VARCHAR(20),
ADD COLUMN IF NOT EXISTS bairro VARCHAR(255),
ADD COLUMN IF NOT EXISTS cidade_estruturada VARCHAR(255),
ADD COLUMN IF NOT EXISTS estado VARCHAR(2),
ADD COLUMN IF NOT EXISTS cep VARCHAR(10),
ADD COLUMN IF NOT EXISTS cor_padronizada VARCHAR(50);

-- Create indexes for faster searches by structured address fields
CREATE INDEX IF NOT EXISTS idx_lost_pets_cidade_estruturada_bairro ON lost_pets(cidade_estruturada, bairro);
CREATE INDEX IF NOT EXISTS idx_lost_pets_cor_padronizada ON lost_pets(cor_padronizada);

-- Optional: Create a table for standardized colors (for reference and future use)
CREATE TABLE IF NOT EXISTS standardized_colors (
    id SERIAL PRIMARY KEY,
    nome_cor VARCHAR(50) NOT NULL UNIQUE,
    codigo_hex VARCHAR(7),
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert standard colors
INSERT INTO standardized_colors (nome_cor, codigo_hex, descricao) VALUES
    ('Preto', '#000000', 'Cor preta sólida'),
    ('Branco', '#FFFFFF', 'Cor branca sólida'),
    ('Marrom', '#8B4513', 'Cor marrom'),
    ('Caramelo', '#D2B48C', 'Cor caramelo/tan'),
    ('Cinza', '#808080', 'Cor cinza'),
    ('Bege', '#F5F5DC', 'Cor bege'),
    ('Laranja', '#FFA500', 'Cor laranja'),
    ('Preto e Branco', '#555555', 'Combinação de preto e branco'),
    ('Marrom e Branco', '#8B4513', 'Combinação de marrom e branco'),
    ('Outro', '#CCCCCC', 'Outra cor não listada')
ON CONFLICT (nome_cor) DO NOTHING;

-- Add a comment to the tables for documentation
COMMENT ON COLUMN quick_reports.logradouro IS 'Rua ou avenida onde o animal foi avistado';
COMMENT ON COLUMN quick_reports.numero IS 'Número do logradouro';
COMMENT ON COLUMN quick_reports.bairro IS 'Bairro onde o animal foi avistado';
COMMENT ON COLUMN quick_reports.cidade IS 'Cidade onde o animal foi avistado';
COMMENT ON COLUMN quick_reports.estado IS 'Estado (UF) onde o animal foi avistado';
COMMENT ON COLUMN quick_reports.cep IS 'CEP da localização';
COMMENT ON COLUMN quick_reports.cor_padronizada IS 'Cor do animal (padronizada)';

COMMENT ON COLUMN lost_pets.logradouro IS 'Rua ou avenida onde o pet foi avistado por último';
COMMENT ON COLUMN lost_pets.numero IS 'Número do logradouro';
COMMENT ON COLUMN lost_pets.bairro IS 'Bairro onde o pet foi avistado por último';
COMMENT ON COLUMN lost_pets.cidade_estruturada IS 'Cidade onde o pet foi avistado por último';
COMMENT ON COLUMN lost_pets.estado IS 'Estado (UF) onde o pet foi avistado por último';
COMMENT ON COLUMN lost_pets.cep IS 'CEP da localização';
COMMENT ON COLUMN lost_pets.cor_padronizada IS 'Cor do pet (padronizada)';
