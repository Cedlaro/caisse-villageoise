-- =============================================================
-- Seed: 002_seed.sql
-- Test credentials for local development only
-- Admin password : Admin@1234
-- Member password: Member@1234
-- =============================================================

USE caisse_villageoise;

-- Admin staff user (bcrypt hash of "Admin@1234", 12 rounds)
INSERT INTO staff_users (employee_id, email, first_name, last_name, password_hash, role, status)
VALUES (
  'EMP-0001',
  'admin@caisse.local',
  'System',
  'Admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
  'admin',
  'active'
);

-- Regular staff user (bcrypt hash of "Admin@1234", 12 rounds)
INSERT INTO staff_users (employee_id, email, first_name, last_name, password_hash, role, status)
VALUES (
  'EMP-0002',
  'staff@caisse.local',
  'Jean',
  'Dupont',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/HS.iK8i',
  'staff',
  'active'
);

-- Active member (bcrypt hash of "Member@1234", 12 rounds)
INSERT INTO members (member_number, email, first_name, last_name, phone, password_hash, status)
VALUES (
  'MBR-00001',
  'member@caisse.local',
  'Marie',
  'Curie',
  '+237600000001',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'active'
);

-- Suspended member for edge-case testing
INSERT INTO members (member_number, email, first_name, last_name, phone, password_hash, status)
VALUES (
  'MBR-00002',
  'suspended@caisse.local',
  'Paul',
  'Kunda',
  '+237600000002',
  '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'suspended'
);
