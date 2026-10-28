CREATE TABLE `properties` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`address_line_1` text NOT NULL,
	`address_line_2` text,
	`city` text NOT NULL,
	`state_province` text NOT NULL,
	`postal_code` text NOT NULL,
	`country` text DEFAULT 'US' NOT NULL,
	`latitude` real,
	`longitude` real,
	`bedrooms` integer NOT NULL,
	`bathrooms` real NOT NULL,
	`price_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "properties_bedrooms_non_negative" CHECK("properties"."bedrooms" >= 0),
	CONSTRAINT "properties_bathrooms_non_negative" CHECK("properties"."bathrooms" >= 0),
	CONSTRAINT "properties_price_cents_non_negative" CHECK("properties"."price_cents" >= 0)
);
--> statement-breakpoint
CREATE INDEX `properties_status_idx` ON `properties` (`status`);--> statement-breakpoint
CREATE INDEX `properties_owner_id_idx` ON `properties` (`owner_id`);--> statement-breakpoint
CREATE INDEX `properties_city_idx` ON `properties` (`city`);--> statement-breakpoint
CREATE INDEX `properties_price_cents_idx` ON `properties` (`price_cents`);--> statement-breakpoint
CREATE INDEX `properties_bedrooms_idx` ON `properties` (`bedrooms`);--> statement-breakpoint
CREATE TABLE `property_media` (
	`id` text PRIMARY KEY NOT NULL,
	`property_id` text NOT NULL,
	`r2_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size_bytes` integer NOT NULL,
	`alt_text` text,
	`is_cover` integer DEFAULT false NOT NULL,
	`uploaded_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`property_id`) REFERENCES `properties`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `property_media_property_id_idx` ON `property_media` (`property_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `property_media_r2_key_unique` ON `property_media` (`r2_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `property_media_cover_unique` ON `property_media` (`property_id`) WHERE "property_media"."is_cover" = 1;