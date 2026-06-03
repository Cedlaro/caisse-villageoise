-- =============================================================
-- Migration: 006_add_activity_to_members.sql
-- Adds activity (text) column to the members table
-- =============================================================

USE caisse_villageoise;

ALTER TABLE members
  ADD COLUMN activity TEXT NULL AFTER address;
