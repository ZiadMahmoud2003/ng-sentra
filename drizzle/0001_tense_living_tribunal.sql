CREATE TABLE `ai_models` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`endpointUrl` varchar(512),
	`status` enum('running','stopped','error','unknown') NOT NULL DEFAULT 'unknown',
	`lastActive` timestamp,
	`recentOutput` text,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ai_models_id` PRIMARY KEY(`id`),
	CONSTRAINT `ai_models_name_unique` UNIQUE(`name`),
	CONSTRAINT `ai_models_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`userName` varchar(256),
	`userRole` varchar(32),
	`action` varchar(128) NOT NULL,
	`target` varchar(256),
	`details` text,
	`ipAddress` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `components` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(128) NOT NULL,
	`slug` varchar(64) NOT NULL,
	`url` varchar(512),
	`port` int,
	`description` text,
	`icon` varchar(64),
	`category` varchar(64),
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `components_id` PRIMARY KEY(`id`),
	CONSTRAINT `components_name_unique` UNIQUE(`name`),
	CONSTRAINT `components_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `soar_approaches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(64) NOT NULL,
	`slug` varchar(32) NOT NULL,
	`webhookUrl` varchar(512),
	`description` text,
	`enabled` boolean NOT NULL DEFAULT true,
	`lastTriggered` timestamp,
	`triggerCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `soar_approaches_id` PRIMARY KEY(`id`),
	CONSTRAINT `soar_approaches_name_unique` UNIQUE(`name`),
	CONSTRAINT `soar_approaches_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','Admin','Analyst','Viewer') NOT NULL DEFAULT 'Viewer';