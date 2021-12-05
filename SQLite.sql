
CREATE TABLE people (
  name TEXT PRIMARY KEY,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  BIRTHDAY datetime not NULL
);

INSERT INTO people (name,width,height,birthday) VALUES ('Gal',65,178,'1991-06-17');
INSERT INTO people (name,width,height,birthday) VALUES ('Shlomo',15,195,'1992-09-17');
INSERT INTO people (name,width,height,birthday) VALUES ('Dan',65,185,'1990-10-17');
INSERT INTO people (name,width,height,birthday) VALUES ('Tom',90,191,'1994-11-17');

SELECT name FROM people ORDER BY width DESC,height DESC;

SELECT AVG(height) FROM people WHERE birthday >= '1990-01-01' AND birthday <= '1993-01-01';

CREATE TABLE propotion AS SELECT *,(height/(SELECT AVG(height) FROM people WHERE birthday >= '1990-01-01' AND birthday <= '1993-01-01')) as height_propotion
FROM people WHERE birthday >= '1990-01-01' AND birthday <= '1993-01-01';

SELECT people.*,propotion.height_propotion FROM
 people LEFT JOIN propotion ON people.name == propotion.name
  WHERE people.width > 75 AND people.height > 185;