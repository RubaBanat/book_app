DROP TABLE IF EXISTS book;

CREATE TABLE book (
  id SERIAL PRIMARY KEY,
  author VARCHAR(255),
  title VARCHAR(255),
  isbn VARCHAR(255),
  image_url VARCHAR(255),
  description TEXT
 
);

INSERT INTO book (author, title, isbn, image_url, description) 
VALUES('feed Sherry','Razan','do immediately after getting home','https://i.imgur.com/J5LVHEL.jpg','Sherry is hungry');