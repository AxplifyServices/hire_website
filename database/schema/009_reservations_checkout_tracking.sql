ALTER TABLE reservations
ADD COLUMN IF NOT EXISTS session_panier VARCHAR(100),
ADD COLUMN IF NOT EXISTS source_reservation VARCHAR(30),
ADD COLUMN IF NOT EXISTS etape_panier VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_abandoned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS date_abandon TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS date_derniere_activite TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100),
ADD COLUMN IF NOT EXISTS nom_snapshot VARCHAR(100),
ADD COLUMN IF NOT EXISTS prenom_snapshot VARCHAR(100),
ADD COLUMN IF NOT EXISTS mail_snapshot VARCHAR(150),
ADD COLUMN IF NOT EXISTS prefixe_tel_snapshot VARCHAR(10),
ADD COLUMN IF NOT EXISTS num_tel_snapshot VARCHAR(20);

ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS chk_reservations_status;

UPDATE reservations
SET status = 'VALIDEE'
WHERE status = 'Valide';

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_status
CHECK (
  status IS NULL OR status IN (
    'PANIER_EN_COURS',
    'ABANDONNEE',
    'EN_ATTENTE_PAIEMENT',
    'VALIDEE',
    'ANNULEE',
    'CLOTUREE'
  )
);

ALTER TABLE reservations
DROP CONSTRAINT IF EXISTS chk_reservations_payment_status;

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_payment_status
CHECK (
  payment_status IS NULL OR payment_status IN (
    'not_started',
    'pending',
    'paid',
    'failed'
  )
);