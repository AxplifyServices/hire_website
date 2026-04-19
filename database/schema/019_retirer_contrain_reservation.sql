ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_reservations_status;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS chk_reservations_payment_status;

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_status
CHECK (
  status IN (
    'PANIER_EN_COURS',
    'ABANDONNEE',
    'EN_ATTENTE_PAIEMENT',
    'VALIDEE',
    'EN_COURS',
    'TERMINEE',
    'ANNULEE'
  )
);

ALTER TABLE reservations
ADD CONSTRAINT chk_reservations_payment_status
CHECK (
  payment_status IN (
    'not_started',
    'pending',
    'paid',
    'cancelled'
  )
);