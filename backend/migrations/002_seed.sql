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
  '$2b$12$N2QKX3hteEUZ11/QnSnDROi0DhpnPGFHLj9wEGFPQibeJ0E9mgTDe',
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
  '$2b$12$N2QKX3hteEUZ11/QnSnDROi0DhpnPGFHLj9wEGFPQibeJ0E9mgTDe',
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
  '$2b$12$8IwkmD.wJjzO.wl..7Un0uJ9lBSf2UkARmjcS1nn1FnCCXGV2R4G2',
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
  '$2b$12$8IwkmD.wJjzO.wl..7Un0uJ9lBSf2UkARmjcS1nn1FnCCXGV2R4G2',
  'suspended'
);
