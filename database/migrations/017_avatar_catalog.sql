-- Admin-managed avatar catalog. Stable keys retain account selections and unlocks.
CREATE TABLE IF NOT EXISTS quiz_avatars (
    avatar_key VARCHAR(80) PRIMARY KEY,
    label VARCHAR(80) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    unlock_rule VARCHAR(80) NULL,
    sort_order INT NOT NULL DEFAULT 100,
    revision INT UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO quiz_avatars(avatar_key,label,image_url,unlock_rule,sort_order) VALUES
('hero','Quiz-Hero','images/website/avatar/quizo.png',NULL,'0'),
('akuma','Akuma','images/website/avatar/akuma.png',NULL,'1'),
('amphos','Amphos','images/website/avatar/amphos.png',NULL,'2'),
('anubia','Anubia','images/website/avatar/anubia.png',NULL,'3'),
('bobo','Bobo','images/website/avatar/bobo.png',NULL,'4'),
('bronko','Bronko','images/website/avatar/bronko.png',NULL,'5'),
('burgo','Burgo','images/website/avatar/burgo.png',NULL,'6'),
('cassius','Cassius','images/website/avatar/cassius.png',NULL,'7'),
('cedric','Cedric','images/website/avatar/cedric.png',NULL,'8'),
('dash','Dash','images/website/avatar/dash.png',NULL,'9'),
('goldzahn','Goldzahn','images/website/avatar/goldzahn.png',NULL,'10'),
('horus','Horus','images/website/avatar/horus.png',NULL,'11'),
('kitsu','Kitsu','images/website/avatar/kitsu.png',NULL,'12'),
('krygon','Krygon','images/website/avatar/krygon.png',NULL,'13'),
('magmore','Magmore','images/website/avatar/magmore.png',NULL,'14'),
('milo','Milo','images/website/avatar/milo.png',NULL,'15'),
('morbix','Morbix','images/website/avatar/morbix.png',NULL,'16'),
('nagero','Nagero','images/website/avatar/nagero.png',NULL,'17'),
('nefara','Nefara','images/website/avatar/nefara.png',NULL,'18'),
('professor-blitzbirne','Professor Blitzbirne','images/website/avatar/professor-blitzbirne.png',NULL,'19'),
('quizo','Quizo','images/website/avatar/quizo.png',NULL,'20'),
('shinzo','Shinzo','images/website/avatar/shinzo.png',NULL,'21'),
('sir-emmental','Sir Emmental','images/website/avatar/sir-emmental.png',NULL,'22'),
('sporix','Sporix','images/website/avatar/sporix.png',NULL,'23'),
('sternenfunke','Sternenfunke','images/website/avatar/sternenfunke.png',NULL,'24'),
('winterseherin','Winterseherin','images/website/avatar/winterseherin.png',NULL,'25'),
('astra','Astra','images/website/avatar/astra-v1.png','hero_first_try','26');
