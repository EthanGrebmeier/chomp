CREATE TABLE `grocery_list` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grocery_list_item` (
	`id` integer PRIMARY KEY NOT NULL,
	`groceryListId` integer NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit` text NOT NULL,
	FOREIGN KEY (`groceryListId`) REFERENCES `grocery_list`(`id`) ON UPDATE no action ON DELETE no action
);
