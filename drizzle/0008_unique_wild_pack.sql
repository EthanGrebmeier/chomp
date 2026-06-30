ALTER TABLE `local_saved_item` ADD `ownerId` text;--> statement-breakpoint
ALTER TABLE `local_saved_item` ADD `isDefault` integer DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE `local_saved_item`
SET `ownerId` = NULL, `isDefault` = true
WHERE `id` GLOB 'local-[0-9]*';--> statement-breakpoint
DELETE FROM `local_saved_item`
WHERE `ownerId` IS NULL AND `isDefault` = false;