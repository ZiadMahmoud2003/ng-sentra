CREATE TABLE `ssh_credentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`componentId` int NOT NULL,
	`host` varchar(256) NOT NULL,
	`port` int NOT NULL DEFAULT 22,
	`username` varchar(128) NOT NULL,
	`password` text NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ssh_credentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `ssh_credentials` ADD CONSTRAINT `ssh_credentials_componentId_components_id_fk` FOREIGN KEY (`componentId`) REFERENCES `components`(`id`) ON DELETE cascade ON UPDATE no action;