ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS chk_reservations_prix;

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_prix
CHECK (prix_initial >= 0 AND prix_final >= 0);