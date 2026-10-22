-- Additive definitions; existing awards and admin revisions remain unchanged.
INSERT IGNORE INTO quiz_souvenir_definitions(souvenir_key,revision,category_id,title,description,image_url,rule_type,target,state) VALUES
('neapel-first-visit',1,'neapel','Neapel besucht','Dein erster Halt am Golf von Neapel. Zwischen Meer und Vesuv beginnt dein Abenteuer.','images/souvenirs/neapel-stamp-v1.png','first_visit',1,'active'),
('neapel-discoverer',1,'neapel','Deine neapolitanische Reisemarke','Neue Geschichten am Fuße des Vesuvs: Ein Stück Neapel reist mit dir weiter.','images/souvenirs/neapel-token-v1.png','discover',5,'active'),
('florenz-first-visit',1,'florenz','Florenz besucht','Willkommen in der Stadt der Renaissance. Deine erste Entdeckung ist erst der Anfang.','images/souvenirs/florenz-stamp-v1.png','first_visit',1,'active'),
('florenz-discoverer',1,'florenz','Deine florentinische Reisemarke','Kunst, Kuppeln und kluge Köpfe: Deine Entdeckungen machen Florenz zu einem Teil deiner Sammlung.','images/souvenirs/florenz-token-v1.png','discover',20,'active');
