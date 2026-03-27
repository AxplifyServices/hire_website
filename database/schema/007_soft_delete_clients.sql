BEGIN;

-- =========================
-- CLIENTS : ajout colonne banned
-- =========================
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT FALSE;

UPDATE clients
SET banned = FALSE
WHERE banned IS NULL;

-- =========================
-- CLEANUP ancienne logique anciens_clients
-- =========================

-- Reservations : suppression liaison ancien client si elle existe
ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS fk_reservations_ancien_client;

DROP INDEX IF EXISTS idx_reservations_id_ancien_client;

ALTER TABLE reservations
DROP COLUMN IF EXISTS id_ancien_client;

-- Avis : suppression liaison ancien client si elle existe
ALTER TABLE avis
DROP CONSTRAINT IF EXISTS fk_avis_ancien_client;

DROP INDEX IF EXISTS idx_avis_id_ancien_client;

ALTER TABLE avis
DROP COLUMN IF EXISTS id_ancien_client;

-- Suppression de la table anciens_clients si elle existe
DROP TABLE IF EXISTS anciens_clients;

COMMIT;