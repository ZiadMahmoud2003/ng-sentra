CREATE TABLE `wazuh_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`apiUrl` varchar(512),
	`apiUsername` varchar(128),
	`apiPassword` text,
	`elasticsearchUrl` varchar(512),
	`elasticsearchUsername` varchar(128),
	`elasticsearchPassword` text,
	`alertIndexPattern` varchar(256) DEFAULT 'wazuh-alerts-*',
	`refreshInterval` int DEFAULT 5000,
	`alertLimit` int DEFAULT 50,
	`enabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `wazuh_settings_id` PRIMARY KEY(`id`)
);
