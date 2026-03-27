BEGIN;

ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS id_ancien_client VARCHAR(11);

ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS fk_reservations_ancien_client;

ALTER TABLE reservations
ADD CONSTRAINT fk_reservations_ancien_client
FOREIGN KEY (id_ancien_client) REFERENCES anciens_clients(id_client);

COMMIT;