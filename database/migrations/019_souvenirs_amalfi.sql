-- Additive Amalfi Coast definitions; existing awards and admin revisions stay unchanged.
-- Explorer progress uses correctly solved distinct questions (first or second try).
INSERT IGNORE INTO quiz_souvenir_definitions(souvenir_key,revision,category_id,title,description,image_url,rule_type,target,state) VALUES
('amalfi-first-visit',1,'amalfi','Amalfi-Küste besucht','Dein erster Halt zwischen bunten Häusern, Zitronenhainen und türkisblauem Meer. Die Küste heißt dich willkommen.','images/souvenirs/amalfi-stamp-v1.png','first_visit',1,'active'),
('amalfi-discoverer',1,'amalfi','Deine Reisemarke der Amalfi-Küste','Zwischen Küstenpfaden und kleinen Entdeckungen: Ein sonniges Stück Amalfi-Küste begleitet deine Quizreise.','images/souvenirs/amalfi-token-v1.png','discover',20,'active');
