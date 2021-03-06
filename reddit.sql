-- This creates the users table. The username field is constrained to unique
-- values only, by using a UNIQUE KEY on that column
CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(60) NOT NULL, -- why 60??? ask me :)
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
);

-- This creates the posts table. The userId column references the id column of
-- users. If a user is deleted, the corresponding posts' userIds will be set NULL.
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(300) DEFAULT NULL,
  `url` varchar(2000) DEFAULT NULL,
  `userId` int(11) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL,
  `updatedAt` DATETIME NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`), -- why did we add this here? ask me :)
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL
);

-- This creates the subreddits table. Subreddit name must be unique.
CREATE TABLE `subreddits` (
`id` INT(11) NOT NULL AUTO_INCREMENT,
`name` VARCHAR(30) DEFAULT NULL,
`description` VARCHAR(200) DEFAULT NULL,
`createdAt` DATETIME NOT NULL,
`updatedAt` DATETIME NOT NULL,
PRIMARY KEY (`id`),
UNIQUE KEY `name`(`name`)
);

-- This adds subredditId to the posts table and makes it a foreign key pointing to subredditId.
ALTER TABLE `posts` 
ADD `subredditId` INT(11) DEFAULT NULL,
ADD FOREIGN KEY (`subredditId`) REFERENCES `subreddits` (`id`)
;

CREATE TABLE `votes` (
`voterId` INT NOT NULL,
`postId` INT NOT NULL,
`vote` TINYINT NOT NULL,
PRIMARY KEY (voterId, postId),
FOREIGN KEY (`voterId`) REFERENCES `users` (`id`),
FOREIGN KEY (`postId`)  REFERENCES `posts` (`id`)
);

CREATE TABLE sessions (token VARCHAR(255), userId INT, PRIMARY KEY(token), FOREIGN KEY(userId) REFERENCES users(id));