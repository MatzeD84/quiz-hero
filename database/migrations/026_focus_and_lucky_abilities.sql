INSERT IGNORE INTO quiz_abilities (id,title,description,effect,scope,rounds_required,enabled) VALUES
('scharfblick','Scharfblick','Vor der ersten Antwort zwei falsche Möglichkeiten ausblenden. Für diese Frage sind danach höchstens zwei Punkte möglich.','focus','hero',3,1),
('gluecksanker','Glücksanker','Nach dem ersten Fehlversuch einsetzen: Ist auch die zweite Antwort falsch, erhältst du einen Trostpunkt. Die Frage bleibt falsch.','lucky','hero',3,1);
