BEGIN;

-- =========================
-- VEHICULES
-- =========================
ALTER TABLE vehicules DROP CONSTRAINT IF EXISTS chk_vehicules_status;

UPDATE vehicules
SET status_vehicule = 'Actif'
WHERE status_vehicule IN ('Disponible', 'Reserve');

UPDATE vehicules
SET status_vehicule = 'Maintenance'
WHERE status_vehicule = 'Indisponible';

UPDATE vehicules
SET status_vehicule = 'Retire_flotte'
WHERE status_vehicule = 'Retire';

ALTER TABLE vehicules
ADD CONSTRAINT chk_vehicules_status
CHECK (status_vehicule IN ('Actif', 'Maintenance', 'Retire_flotte'));

-- =========================
-- RESERVATIONS
-- =========================
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_reservations_status;

UPDATE reservations
SET status = 'Abandonnee'
WHERE status IN ('abandonnee', 'Abandonnée');

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_status
CHECK (status IN ('Valide', 'Abandonnee', 'Cloturee'));

COMMIT;