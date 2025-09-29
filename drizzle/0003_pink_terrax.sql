PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_grocery_list` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text,
	`name` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_grocery_list`("id", "date", "name") SELECT "id", "date", "name" FROM `grocery_list`;--> statement-breakpoint
DROP TABLE `grocery_list`;--> statement-breakpoint
ALTER TABLE `__new_grocery_list` RENAME TO `grocery_list`;--> statement-breakpoint
PRAGMA foreign_keys=ON;