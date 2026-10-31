-- Only replace the obsolete shipped wording, never an administrator's custom text.
UPDATE quiz_abilities
SET description='Nach dem ersten Fehlversuch einsetzen: Bei richtiger zweiter Antwort gibt es zwei statt eines Punktes.',
    revision=revision+1
WHERE id='schutzschild'
AND description='Nach dem ersten Fehlversuch ausrüsten: Bei richtiger zweiter Antwort gibt es zwei statt eines Punktes.';
-- Equipment and basic-role legacy fields remain unused, preserving old local snapshots.
-- Existing assignments, thresholds, entitlements and round history are unchanged.
