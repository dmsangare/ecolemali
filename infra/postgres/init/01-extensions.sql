-- ============================================================
-- SIS-MALI — PostgreSQL 16 initialization
-- Required extensions for UUID, cryptography and fuzzy search
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Set default timezone for the database
ALTER DATABASE sis_mali SET timezone TO 'Africa/Bamako';