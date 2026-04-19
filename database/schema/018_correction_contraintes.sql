ALTER TABLE vehicules
DROP CONSTRAINT IF EXISTS chk_vehicules_carburant;

ALTER TABLE vehicules
ADD CONSTRAINT chk_vehicules_carburant
CHECK (carburant IN ('Gazoil', 'Essence', 'Electrique', 'Hybride'));