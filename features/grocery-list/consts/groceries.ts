import { Category } from '../../shared/category/categories';
import { BaseGroceryItem } from '../types';

// Type utilities to ensure no duplicate names in the groceries array
type ExtractNames<T extends readonly { name: string }[]> = {
  [K in keyof T]: T[K] extends { name: infer N } ? N : never;
};

type HasDuplicates<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? First extends Rest[number]
    ? true
    : HasDuplicates<Rest>
  : false;

type StoredGroceryItem = Pick<BaseGroceryItem, 'name' | 'category'>;

// Helper function to enforce unique names at compile time
function createGroceryList<const T extends readonly StoredGroceryItem[]>(
  items: HasDuplicates<ExtractNames<T>> extends true
    ? { error: 'Duplicate names found'; items: never }
    : T
): T {
  return items as T;
}

export const categories: Record<Category, Category> = {
  produce: 'produce',
  deli: 'deli',
  dairy: 'dairy',
  bakery: 'bakery',
  frozen: 'frozen',
  pantry: 'pantry',
  beverages: 'beverages',
  snacks: 'snacks',
  'health-beauty': 'health-beauty',
  household: 'household',
  other: 'other',
} as const;

export const groceries = createGroceryList([
  // PRODUCE - Fruits
  {
    name: 'Avocado',
    category: categories.produce,
  },
  {
    name: 'Blackberries',
    category: categories.produce,
  },
  {
    name: 'Blueberries',
    category: categories.produce,
  },
  {
    name: 'Cantaloupe',
    category: categories.produce,
  },
  {
    name: 'Cherries',
    category: categories.produce,
  },
  {
    name: 'Coconut',
    category: categories.produce,
  },
  {
    name: 'Cranberries',
    category: categories.produce,
  },
  {
    name: 'Fuji Apple',
    category: categories.produce,
  },
  {
    name: 'Grapefruit',
    category: categories.produce,
  },
  {
    name: 'Granny Smith Apple',
    category: categories.produce,
  },
  {
    name: 'Green Grapes',
    category: categories.produce,
  },
  {
    name: 'Honeycrisp Apple',
    category: categories.produce,
  },
  {
    name: 'Honeydew Melon',
    category: categories.produce,
  },
  {
    name: 'Kiwi',
    category: categories.produce,
  },
  {
    name: 'Lemon',
    category: categories.produce,
  },
  {
    name: 'Lime',
    category: categories.produce,
  },
  {
    name: 'Mango',
    category: categories.produce,
  },
  {
    name: 'Nectarine',
    category: categories.produce,
  },
  {
    name: 'Orange',
    category: categories.produce,
  },
  {
    name: 'Papaya',
    category: categories.produce,
  },
  {
    name: 'Peach',
    category: categories.produce,
  },
  {
    name: 'Pear',
    category: categories.produce,
  },
  {
    name: 'Pineapple',
    category: categories.produce,
  },
  {
    name: 'Plum',
    category: categories.produce,
  },
  {
    name: 'Pomegranate',
    category: categories.produce,
  },
  {
    name: 'Raspberries',
    category: categories.produce,
  },
  {
    name: 'Red Grapes',
    category: categories.produce,
  },
  {
    name: 'Strawberries',
    category: categories.produce,
  },
  {
    name: 'Tangerine',
    category: categories.produce,
  },
  {
    name: 'Watermelon',
    category: categories.produce,
  },
  {
    name: 'Yellow Banana',
    category: categories.produce,
  },

  // PRODUCE - Vegetables
  {
    name: 'Artichoke',
    category: categories.produce,
  },
  {
    name: 'Arugula',
    category: categories.produce,
  },
  {
    name: 'Asparagus',
    category: categories.produce,
  },
  {
    name: 'Baby Carrots',
    category: categories.produce,
  },
  {
    name: 'Basil',
    category: categories.produce,
  },
  {
    name: 'Beets',
    category: categories.produce,
  },
  {
    name: 'Bell Pepper - Green',
    category: categories.produce,
  },
  {
    name: 'Bell Pepper - Red',
    category: categories.produce,
  },
  {
    name: 'Bell Pepper - Yellow',
    category: categories.produce,
  },
  {
    name: 'Bok Choy',
    category: categories.produce,
  },
  {
    name: 'Broccoli',
    category: categories.produce,
  },
  {
    name: 'Brussels Sprouts',
    category: categories.produce,
  },
  {
    name: 'Butternut Squash',
    category: categories.produce,
  },
  {
    name: 'Cabbage',
    category: categories.produce,
  },
  {
    name: 'Carrots',
    category: categories.produce,
  },
  {
    name: 'Cauliflower',
    category: categories.produce,
  },
  {
    name: 'Celery',
    category: categories.produce,
  },
  {
    name: 'Cherry Tomatoes',
    category: categories.produce,
  },
  {
    name: 'Cilantro',
    category: categories.produce,
  },
  {
    name: 'Corn',
    category: categories.produce,
  },
  {
    name: 'Cucumber',
    category: categories.produce,
  },
  {
    name: 'Eggplant',
    category: categories.produce,
  },
  {
    name: 'Garlic',
    category: categories.produce,
  },
  {
    name: 'Ginger',
    category: categories.produce,
  },
  {
    name: 'Green Beans',
    category: categories.produce,
  },
  {
    name: 'Green Onions',
    category: categories.produce,
  },
  {
    name: 'Iceberg Lettuce',
    category: categories.produce,
  },
  {
    name: 'Jalapeño Peppers',
    category: categories.produce,
  },
  {
    name: 'Kale',
    category: categories.produce,
  },
  {
    name: 'Leeks',
    category: categories.produce,
  },
  {
    name: 'Mixed Greens',
    category: categories.produce,
  },
  {
    name: 'Mushrooms',
    category: categories.produce,
  },
  {
    name: 'Parsley',
    category: categories.produce,
  },
  {
    name: 'Potatoes - Russet',
    category: categories.produce,
  },
  {
    name: 'Potatoes - Sweet',
    category: categories.produce,
  },
  {
    name: 'Potatoes - Red',
    category: categories.produce,
  },
  {
    name: 'Pumpkin',
    category: categories.produce,
  },
  {
    name: 'Radishes',
    category: categories.produce,
  },
  {
    name: 'Red Onion',
    category: categories.produce,
  },
  {
    name: 'Romaine Lettuce',
    category: categories.produce,
  },
  {
    name: 'Shallots',
    category: categories.produce,
  },
  {
    name: 'Spinach',
    category: categories.produce,
  },
  {
    name: 'Tomatoes - Roma',
    category: categories.produce,
  },
  {
    name: 'Tomatoes - Vine',
    category: categories.produce,
  },
  {
    name: 'Turnips',
    category: categories.produce,
  },
  {
    name: 'Yellow Onion',
    category: categories.produce,
  },
  {
    name: 'Yellow Squash',
    category: categories.produce,
  },
  {
    name: 'Zucchini',
    category: categories.produce,
  },

  // DELI
  {
    name: 'Black Forest Ham',
    category: categories.deli,
  },
  {
    name: 'Bologna',
    category: categories.deli,
  },
  {
    name: 'Capicola',
    category: categories.deli,
  },
  {
    name: 'Chicken Salad',
    category: categories.deli,
  },
  {
    name: 'Coleslaw',
    category: categories.deli,
  },
  {
    name: 'Corned Beef',
    category: categories.deli,
  },
  {
    name: 'Deli Cheese - American',
    category: categories.deli,
  },
  {
    name: 'Deli Cheese - Cheddar',
    category: categories.deli,
  },
  {
    name: 'Deli Cheese - Provolone',
    category: categories.deli,
  },
  {
    name: 'Deli Cheese - Swiss',
    category: categories.deli,
  },
  {
    name: 'Egg Salad',
    category: categories.deli,
  },
  {
    name: 'Genoa Salami',
    category: categories.deli,
  },
  {
    name: 'Hard Salami',
    category: categories.deli,
  },
  {
    name: 'Honey Ham',
    category: categories.deli,
  },
  {
    name: 'Hot Dogs',
    category: categories.deli,
  },
  {
    name: 'Hummus',
    category: categories.deli,
  },
  {
    name: 'Italian Sub Meat',
    category: categories.deli,
  },
  {
    name: 'Liverwurst',
    category: categories.deli,
  },
  {
    name: 'Macaroni Salad',
    category: categories.deli,
  },
  {
    name: 'Mortadella',
    category: categories.deli,
  },
  {
    name: 'Olive Loaf',
    category: categories.deli,
  },
  {
    name: 'Pastrami',
    category: categories.deli,
  },
  {
    name: 'Pepperoni',
    category: categories.deli,
  },
  {
    name: 'Pickle Loaf',
    category: categories.deli,
  },
  {
    name: 'Potato Salad',
    category: categories.deli,
  },
  {
    name: 'Prosciutto',
    category: categories.deli,
  },
  {
    name: 'Roast Beef',
    category: categories.deli,
  },
  {
    name: 'Roasted Turkey Breast',
    category: categories.deli,
  },
  {
    name: 'Rotisserie Chicken',
    category: categories.deli,
  },
  {
    name: 'Salami',
    category: categories.deli,
  },
  {
    name: 'Smoked Sausage',
    category: categories.deli,
  },
  {
    name: 'Smoked Turkey',
    category: categories.deli,
  },
  {
    name: 'Summer Sausage',
    category: categories.deli,
  },
  {
    name: 'Tuna Salad',
    category: categories.deli,
  },
  {
    name: 'Turkey Breast',
    category: categories.deli,
  },
  {
    name: 'Turkey Pastrami',
    category: categories.deli,
  },
  {
    name: 'Virginia Ham',
    category: categories.deli,
  },

  // DAIRY
  {
    name: '2% Milk',
    category: categories.dairy,
  },
  {
    name: 'Almond Milk',
    category: categories.dairy,
  },
  {
    name: 'American Cheese',
    category: categories.dairy,
  },
  {
    name: 'Bleu Cheese',
    category: categories.dairy,
  },
  {
    name: 'Brie Cheese',
    category: categories.dairy,
  },
  {
    name: 'Buttermilk',
    category: categories.dairy,
  },
  {
    name: 'Cheddar Cheese',
    category: categories.dairy,
  },
  {
    name: 'Colby Jack Cheese',
    category: categories.dairy,
  },
  {
    name: 'Cottage Cheese',
    category: categories.dairy,
  },
  {
    name: 'Cream Cheese',
    category: categories.dairy,
  },
  {
    name: 'Eggnog',
    category: categories.dairy,
  },
  {
    name: 'Eggs - Brown',
    category: categories.dairy,
  },
  {
    name: 'Eggs - White',
    category: categories.dairy,
  },
  {
    name: 'Feta Cheese',
    category: categories.dairy,
  },
  {
    name: 'Goat Cheese',
    category: categories.dairy,
  },
  {
    name: 'Gouda Cheese',
    category: categories.dairy,
  },
  {
    name: 'Greek Yogurt',
    category: categories.dairy,
  },
  {
    name: 'Gruyere Cheese',
    category: categories.dairy,
  },
  {
    name: 'Half and Half',
    category: categories.dairy,
  },
  {
    name: 'Heavy Cream',
    category: categories.dairy,
  },
  {
    name: 'Margarine',
    category: categories.dairy,
  },
  {
    name: 'Mexican Cheese Blend',
    category: categories.dairy,
  },
  {
    name: 'Monterey Jack Cheese',
    category: categories.dairy,
  },
  {
    name: 'Mozzarella Cheese',
    category: categories.dairy,
  },
  {
    name: 'Muenster Cheese',
    category: categories.dairy,
  },
  {
    name: 'Oat Milk',
    category: categories.dairy,
  },
  {
    name: 'Parmesan Cheese',
    category: categories.dairy,
  },
  {
    name: 'Pepper Jack Cheese',
    category: categories.dairy,
  },
  {
    name: 'Provolone Cheese',
    category: categories.dairy,
  },
  {
    name: 'Ricotta Cheese',
    category: categories.dairy,
  },
  {
    name: 'Salted Butter',
    category: categories.dairy,
  },
  {
    name: 'Shredded Cheddar',
    category: categories.dairy,
  },
  {
    name: 'Shredded Mozzarella',
    category: categories.dairy,
  },
  {
    name: 'Skim Milk',
    category: categories.dairy,
  },
  {
    name: 'Sour Cream',
    category: categories.dairy,
  },
  {
    name: 'Soy Milk',
    category: categories.dairy,
  },
  {
    name: 'String Cheese',
    category: categories.dairy,
  },
  {
    name: 'Swiss Cheese',
    category: categories.dairy,
  },
  {
    name: 'Unsalted Butter',
    category: categories.dairy,
  },
  {
    name: 'Vanilla Yogurt',
    category: categories.dairy,
  },
  {
    name: 'Whipped Cream',
    category: categories.dairy,
  },
  {
    name: 'Whole Milk',
    category: categories.dairy,
  },
  {
    name: 'Yogurt - Blueberry',
    category: categories.dairy,
  },
  {
    name: 'Yogurt - Strawberry',
    category: categories.dairy,
  },

  // BAKERY
  {
    name: 'Bagels',
    category: categories.bakery,
  },
  {
    name: 'Banana Bread',
    category: categories.bakery,
  },
  {
    name: 'Biscuits',
    category: categories.bakery,
  },
  {
    name: 'Blueberry Muffins',
    category: categories.bakery,
  },
  {
    name: 'Brioche',
    category: categories.bakery,
  },
  {
    name: 'Brownies',
    category: categories.bakery,
  },
  {
    name: 'Chocolate Chip Cookies',
    category: categories.bakery,
  },
  {
    name: 'Ciabatta',
    category: categories.bakery,
  },
  {
    name: 'Cinnamon Rolls',
    category: categories.bakery,
  },
  {
    name: 'Cornbread',
    category: categories.bakery,
  },
  {
    name: 'Croissants',
    category: categories.bakery,
  },
  {
    name: 'Cupcakes',
    category: categories.bakery,
  },
  {
    name: 'Danish Pastry',
    category: categories.bakery,
  },
  {
    name: 'Dinner Rolls',
    category: categories.bakery,
  },
  {
    name: 'Donuts',
    category: categories.bakery,
  },
  {
    name: 'English Muffins',
    category: categories.bakery,
  },
  {
    name: 'Flatbread',
    category: categories.bakery,
  },
  {
    name: 'Focaccia',
    category: categories.bakery,
  },
  {
    name: 'French Baguette',
    category: categories.bakery,
  },
  {
    name: 'Garlic Bread',
    category: categories.bakery,
  },
  {
    name: 'Hamburger Buns',
    category: categories.bakery,
  },
  {
    name: 'Hot Dog Buns',
    category: categories.bakery,
  },
  {
    name: 'Italian Bread',
    category: categories.bakery,
  },
  {
    name: 'Kaiser Rolls',
    category: categories.bakery,
  },
  {
    name: 'Marble Rye Bread',
    category: categories.bakery,
  },
  {
    name: 'Multigrain Bread',
    category: categories.bakery,
  },
  {
    name: 'Naan',
    category: categories.bakery,
  },
  {
    name: 'Oatmeal Cookies',
    category: categories.bakery,
  },
  {
    name: 'Pita Bread',
    category: categories.bakery,
  },
  {
    name: 'Pound Cake',
    category: categories.bakery,
  },
  {
    name: 'Pumpernickel Bread',
    category: categories.bakery,
  },
  {
    name: 'Rye Bread',
    category: categories.bakery,
  },
  {
    name: 'Scones',
    category: categories.bakery,
  },
  {
    name: 'Sourdough Bread',
    category: categories.bakery,
  },
  {
    name: 'Sugar Cookies',
    category: categories.bakery,
  },
  {
    name: 'Tortillas - Corn',
    category: categories.bakery,
  },
  {
    name: 'Tortillas - Flour',
    category: categories.bakery,
  },
  {
    name: 'White Bread',
    category: categories.bakery,
  },
  {
    name: 'Whole Wheat Bread',
    category: categories.bakery,
  },

  // FROZEN
  {
    name: 'Breakfast Burritos',
    category: categories.frozen,
  },
  {
    name: 'Chicken Nuggets',
    category: categories.frozen,
  },
  {
    name: 'Chicken Tenders',
    category: categories.frozen,
  },
  {
    name: 'Chocolate Ice Cream',
    category: categories.frozen,
  },
  {
    name: 'Corn Dogs',
    category: categories.frozen,
  },
  {
    name: 'Egg Rolls',
    category: categories.frozen,
  },
  {
    name: 'Fish Sticks',
    category: categories.frozen,
  },
  {
    name: 'French Fries',
    category: categories.frozen,
  },
  {
    name: 'Frozen Berries',
    category: categories.frozen,
  },
  {
    name: 'Frozen Broccoli',
    category: categories.frozen,
  },
  {
    name: 'Frozen Carrots',
    category: categories.frozen,
  },
  {
    name: 'Frozen Cauliflower',
    category: categories.frozen,
  },
  {
    name: 'Frozen Corn',
    category: categories.frozen,
  },
  {
    name: 'Frozen Green Beans',
    category: categories.frozen,
  },
  {
    name: 'Frozen Mango',
    category: categories.frozen,
  },
  {
    name: 'Frozen Meatballs',
    category: categories.frozen,
  },
  {
    name: 'Frozen Mixed Vegetables',
    category: categories.frozen,
  },
  {
    name: 'Frozen Peas',
    category: categories.frozen,
  },
  {
    name: 'Frozen Pizza',
    category: categories.frozen,
  },
  {
    name: 'Frozen Shrimp',
    category: categories.frozen,
  },
  {
    name: 'Frozen Spinach',
    category: categories.frozen,
  },
  {
    name: 'Frozen Stir Fry Mix',
    category: categories.frozen,
  },
  {
    name: 'Frozen Strawberries',
    category: categories.frozen,
  },
  {
    name: 'Frozen Tilapia',
    category: categories.frozen,
  },
  {
    name: 'Frozen Waffles',
    category: categories.frozen,
  },
  {
    name: 'Hash Browns',
    category: categories.frozen,
  },
  {
    name: 'Hot Pockets',
    category: categories.frozen,
  },
  {
    name: 'Ice Cream Bars',
    category: categories.frozen,
  },
  {
    name: 'Ice Cream Sandwiches',
    category: categories.frozen,
  },
  {
    name: 'Lasagna - Frozen',
    category: categories.frozen,
  },
  {
    name: 'Mint Chocolate Chip Ice Cream',
    category: categories.frozen,
  },
  {
    name: 'Mozzarella Sticks',
    category: categories.frozen,
  },
  {
    name: 'Onion Rings',
    category: categories.frozen,
  },
  {
    name: 'Pancakes - Frozen',
    category: categories.frozen,
  },
  {
    name: 'Pierogies',
    category: categories.frozen,
  },
  {
    name: 'Pizza Rolls',
    category: categories.frozen,
  },
  {
    name: 'Popcorn Chicken',
    category: categories.frozen,
  },
  {
    name: 'Popsicles',
    category: categories.frozen,
  },
  {
    name: 'Pot Pie',
    category: categories.frozen,
  },
  {
    name: 'Sherbet',
    category: categories.frozen,
  },
  {
    name: 'Sorbet',
    category: categories.frozen,
  },
  {
    name: 'Tater Tots',
    category: categories.frozen,
  },
  {
    name: 'TV Dinners',
    category: categories.frozen,
  },
  {
    name: 'Vanilla Ice Cream',
    category: categories.frozen,
  },
  {
    name: 'Veggie Burgers',
    category: categories.frozen,
  },
  {
    name: 'Waffle Fries',
    category: categories.frozen,
  },
  {
    name: 'Wings - Frozen',
    category: categories.frozen,
  },

  // PANTRY
  {
    name: 'All-Purpose Flour',
    category: categories.pantry,
  },
  {
    name: 'Almond Butter',
    category: categories.pantry,
  },
  {
    name: 'Angel Hair Pasta',
    category: categories.pantry,
  },
  {
    name: 'Arborio Rice',
    category: categories.pantry,
  },
  {
    name: 'Baking Powder',
    category: categories.pantry,
  },
  {
    name: 'Baking Soda',
    category: categories.pantry,
  },
  {
    name: 'Barbecue Sauce',
    category: categories.pantry,
  },
  {
    name: 'Basmati Rice',
    category: categories.pantry,
  },
  {
    name: 'Black Beans - Canned',
    category: categories.pantry,
  },
  {
    name: 'Black Pepper',
    category: categories.pantry,
  },
  {
    name: 'Bread Crumbs',
    category: categories.pantry,
  },
  {
    name: 'Brown Rice',
    category: categories.pantry,
  },
  {
    name: 'Brown Sugar',
    category: categories.pantry,
  },
  {
    name: 'Canola Oil',
    category: categories.pantry,
  },
  {
    name: 'Canned Chicken',
    category: categories.pantry,
  },
  {
    name: 'Canned Corn',
    category: categories.pantry,
  },
  {
    name: 'Canned Green Beans',
    category: categories.pantry,
  },
  {
    name: 'Canned Peas',
    category: categories.pantry,
  },
  {
    name: 'Canned Tuna',
    category: categories.pantry,
  },
  {
    name: 'Cereal - Cheerios',
    category: categories.pantry,
  },
  {
    name: 'Cereal - Corn Flakes',
    category: categories.pantry,
  },
  {
    name: 'Cereal - Frosted Flakes',
    category: categories.pantry,
  },
  {
    name: 'Cereal - Granola',
    category: categories.pantry,
  },
  {
    name: 'Cereal - Raisin Bran',
    category: categories.pantry,
  },
  {
    name: 'Chicken Broth',
    category: categories.pantry,
  },
  {
    name: 'Chickpeas - Canned',
    category: categories.pantry,
  },
  {
    name: 'Chili Powder',
    category: categories.pantry,
  },
  {
    name: 'Chocolate Chips',
    category: categories.pantry,
  },
  {
    name: 'Cinnamon',
    category: categories.pantry,
  },
  {
    name: 'Coconut Oil',
    category: categories.pantry,
  },
  {
    name: 'Cooking Spray',
    category: categories.pantry,
  },
  {
    name: 'Cornmeal',
    category: categories.pantry,
  },
  {
    name: 'Cornstarch',
    category: categories.pantry,
  },
  {
    name: 'Couscous',
    category: categories.pantry,
  },
  {
    name: 'Cranberry Sauce',
    category: categories.pantry,
  },
  {
    name: 'Crushed Tomatoes',
    category: categories.pantry,
  },
  {
    name: 'Cumin',
    category: categories.pantry,
  },
  {
    name: 'Diced Tomatoes',
    category: categories.pantry,
  },
  {
    name: 'Dijon Mustard',
    category: categories.pantry,
  },
  {
    name: 'Dried Oregano',
    category: categories.pantry,
  },
  {
    name: 'Elbow Macaroni',
    category: categories.pantry,
  },
  {
    name: 'Fettuccine',
    category: categories.pantry,
  },
  {
    name: 'Garlic Powder',
    category: categories.pantry,
  },
  {
    name: 'Granulated Sugar',
    category: categories.pantry,
  },
  {
    name: 'Honey',
    category: categories.pantry,
  },
  {
    name: 'Hot Sauce',
    category: categories.pantry,
  },
  {
    name: 'Italian Seasoning',
    category: categories.pantry,
  },
  {
    name: 'Jasmine Rice',
    category: categories.pantry,
  },
  {
    name: 'Ketchup',
    category: categories.pantry,
  },
  {
    name: 'Kidney Beans - Canned',
    category: categories.pantry,
  },
  {
    name: 'Linguine',
    category: categories.pantry,
  },
  {
    name: 'Maple Syrup',
    category: categories.pantry,
  },
  {
    name: 'Marinara Sauce',
    category: categories.pantry,
  },
  {
    name: 'Mayonnaise',
    category: categories.pantry,
  },
  {
    name: 'Oatmeal',
    category: categories.pantry,
  },
  {
    name: 'Olive Oil',
    category: categories.pantry,
  },
  {
    name: 'Onion Powder',
    category: categories.pantry,
  },
  {
    name: 'Paprika',
    category: categories.pantry,
  },
  {
    name: 'Peanut Butter',
    category: categories.pantry,
  },
  {
    name: 'Penne Pasta',
    category: categories.pantry,
  },
  {
    name: 'Pinto Beans - Canned',
    category: categories.pantry,
  },
  {
    name: 'Popcorn Kernels',
    category: categories.pantry,
  },
  {
    name: 'Powdered Sugar',
    category: categories.pantry,
  },
  {
    name: 'Quinoa',
    category: categories.pantry,
  },
  {
    name: 'Ranch Dressing',
    category: categories.pantry,
  },
  {
    name: 'Red Wine Vinegar',
    category: categories.pantry,
  },
  {
    name: 'Refried Beans',
    category: categories.pantry,
  },
  {
    name: 'Rigatoni',
    category: categories.pantry,
  },
  {
    name: 'Salsa',
    category: categories.pantry,
  },
  {
    name: 'Salt',
    category: categories.pantry,
  },
  {
    name: 'Soy Sauce',
    category: categories.pantry,
  },
  {
    name: 'Spaghetti',
    category: categories.pantry,
  },
  {
    name: 'Teriyaki Sauce',
    category: categories.pantry,
  },
  {
    name: 'Tomato Paste',
    category: categories.pantry,
  },
  {
    name: 'Tomato Sauce',
    category: categories.pantry,
  },
  {
    name: 'Vanilla Extract',
    category: categories.pantry,
  },
  {
    name: 'Vegetable Broth',
    category: categories.pantry,
  },
  {
    name: 'Vegetable Oil',
    category: categories.pantry,
  },
  {
    name: 'White Rice',
    category: categories.pantry,
  },
  {
    name: 'White Vinegar',
    category: categories.pantry,
  },
  {
    name: 'Worcestershire Sauce',
    category: categories.pantry,
  },
  {
    name: 'Yellow Mustard',
    category: categories.pantry,
  },

  // BEVERAGES
  {
    name: 'Apple Juice',
    category: categories.beverages,
  },
  {
    name: 'Beer',
    category: categories.beverages,
  },
  {
    name: 'Bottled Water',
    category: categories.beverages,
  },
  {
    name: 'Champagne',
    category: categories.beverages,
  },
  {
    name: 'Chocolate Milk',
    category: categories.beverages,
  },
  {
    name: 'Club Soda',
    category: categories.beverages,
  },
  {
    name: 'Coca Cola',
    category: categories.beverages,
  },
  {
    name: 'Coffee - Ground',
    category: categories.beverages,
  },
  {
    name: 'Coffee - Whole Beans',
    category: categories.beverages,
  },
  {
    name: 'Cranberry Juice',
    category: categories.beverages,
  },
  {
    name: 'Diet Coke',
    category: categories.beverages,
  },
  {
    name: 'Dr Pepper',
    category: categories.beverages,
  },
  {
    name: 'Energy Drinks',
    category: categories.beverages,
  },
  {
    name: 'Fruit Punch',
    category: categories.beverages,
  },
  {
    name: 'Ginger Ale',
    category: categories.beverages,
  },
  {
    name: 'Grape Juice',
    category: categories.beverages,
  },
  {
    name: 'Grapefruit Juice',
    category: categories.beverages,
  },
  {
    name: 'Green Tea',
    category: categories.beverages,
  },
  {
    name: 'Herbal Tea',
    category: categories.beverages,
  },
  {
    name: 'Hot Chocolate Mix',
    category: categories.beverages,
  },
  {
    name: 'Iced Tea',
    category: categories.beverages,
  },
  {
    name: 'Lemonade',
    category: categories.beverages,
  },
  {
    name: 'Limeade',
    category: categories.beverages,
  },
  {
    name: 'Mountain Dew',
    category: categories.beverages,
  },
  {
    name: 'Orange Juice',
    category: categories.beverages,
  },
  {
    name: 'Pepsi',
    category: categories.beverages,
  },
  {
    name: 'Pineapple Juice',
    category: categories.beverages,
  },
  {
    name: 'Red Bull',
    category: categories.beverages,
  },
  {
    name: 'Red Wine',
    category: categories.beverages,
  },
  {
    name: 'Root Beer',
    category: categories.beverages,
  },
  {
    name: 'Sparkling Water',
    category: categories.beverages,
  },
  {
    name: 'Sprite',
    category: categories.beverages,
  },
  {
    name: 'Sports Drinks',
    category: categories.beverages,
  },
  {
    name: 'Tomato Juice',
    category: categories.beverages,
  },
  {
    name: 'Tonic Water',
    category: categories.beverages,
  },
  {
    name: 'V8 Juice',
    category: categories.beverages,
  },
  {
    name: 'Vodka',
    category: categories.beverages,
  },
  {
    name: 'White Wine',
    category: categories.beverages,
  },

  // SNACKS
  {
    name: 'Animal Crackers',
    category: categories.snacks,
  },
  {
    name: 'Beef Jerky',
    category: categories.snacks,
  },
  {
    name: 'Candy Bars',
    category: categories.snacks,
  },
  {
    name: 'Caramel Popcorn',
    category: categories.snacks,
  },
  {
    name: 'Cashews',
    category: categories.snacks,
  },
  {
    name: 'Cheese Crackers',
    category: categories.snacks,
  },
  {
    name: 'Cheetos',
    category: categories.snacks,
  },
  {
    name: 'Cheez-Its',
    category: categories.snacks,
  },
  {
    name: 'Chex Mix',
    category: categories.snacks,
  },
  {
    name: 'Chocolate Bars',
    category: categories.snacks,
  },
  {
    name: 'Cookies',
    category: categories.snacks,
  },
  {
    name: 'Doritos',
    category: categories.snacks,
  },
  {
    name: 'Dried Cranberries',
    category: categories.snacks,
  },
  {
    name: 'Dried Fruit',
    category: categories.snacks,
  },
  {
    name: 'Fruit Gummies',
    category: categories.snacks,
  },
  {
    name: 'Fruit Snacks',
    category: categories.snacks,
  },
  {
    name: 'Goldfish Crackers',
    category: categories.snacks,
  },
  {
    name: 'Graham Crackers',
    category: categories.snacks,
  },
  {
    name: 'Granola Bars',
    category: categories.snacks,
  },
  {
    name: 'Gummy Bears',
    category: categories.snacks,
  },
  {
    name: 'Gummy Worms',
    category: categories.snacks,
  },
  {
    name: 'Jerky',
    category: categories.snacks,
  },
  {
    name: 'Lays Chips',
    category: categories.snacks,
  },
  {
    name: 'Licorice',
    category: categories.snacks,
  },
  {
    name: 'M&Ms',
    category: categories.snacks,
  },
  {
    name: 'Microwave Popcorn',
    category: categories.snacks,
  },
  {
    name: 'Mixed Nuts',
    category: categories.snacks,
  },
  {
    name: 'Peanuts',
    category: categories.snacks,
  },
  {
    name: 'Pecans',
    category: categories.snacks,
  },
  {
    name: 'Pistachios',
    category: categories.snacks,
  },
  {
    name: 'Popcorn',
    category: categories.snacks,
  },
  {
    name: 'Potato Chips',
    category: categories.snacks,
  },
  {
    name: 'Pretzels',
    category: categories.snacks,
  },
  {
    name: 'Pringles',
    category: categories.snacks,
  },
  {
    name: 'Protein Bars',
    category: categories.snacks,
  },
  {
    name: 'Rice Cakes',
    category: categories.snacks,
  },
  {
    name: 'Ritz Crackers',
    category: categories.snacks,
  },
  {
    name: 'Saltine Crackers',
    category: categories.snacks,
  },
  {
    name: 'Skittles',
    category: categories.snacks,
  },
  {
    name: 'Sunflower Seeds',
    category: categories.snacks,
  },
  {
    name: 'Tortilla Chips',
    category: categories.snacks,
  },
  {
    name: 'Trail Mix',
    category: categories.snacks,
  },
  {
    name: 'Twizzlers',
    category: categories.snacks,
  },
  {
    name: 'Walnuts',
    category: categories.snacks,
  },

  // HEALTH & BEAUTY
  {
    name: 'Acne Treatment',
    category: categories['health-beauty'],
  },
  {
    name: 'Aftershave',
    category: categories['health-beauty'],
  },
  {
    name: 'Allergy Medicine',
    category: categories['health-beauty'],
  },
  {
    name: 'Antacid',
    category: categories['health-beauty'],
  },
  {
    name: 'Aspirin',
    category: categories['health-beauty'],
  },
  {
    name: 'Band-Aids',
    category: categories['health-beauty'],
  },
  {
    name: 'Body Lotion',
    category: categories['health-beauty'],
  },
  {
    name: 'Body Wash',
    category: categories['health-beauty'],
  },
  {
    name: 'Cold Medicine',
    category: categories['health-beauty'],
  },
  {
    name: 'Conditioner',
    category: categories['health-beauty'],
  },
  {
    name: 'Contact Lens Solution',
    category: categories['health-beauty'],
  },
  {
    name: 'Cotton Balls',
    category: categories['health-beauty'],
  },
  {
    name: 'Cotton Swabs',
    category: categories['health-beauty'],
  },
  {
    name: 'Cough Drops',
    category: categories['health-beauty'],
  },
  {
    name: 'Dental Floss',
    category: categories['health-beauty'],
  },
  {
    name: 'Deodorant',
    category: categories['health-beauty'],
  },
  {
    name: 'Face Cream',
    category: categories['health-beauty'],
  },
  {
    name: 'Face Wash',
    category: categories['health-beauty'],
  },
  {
    name: 'Feminine Products',
    category: categories['health-beauty'],
  },
  {
    name: 'Hair Gel',
    category: categories['health-beauty'],
  },
  {
    name: 'Hair Spray',
    category: categories['health-beauty'],
  },
  {
    name: 'Hand Soap',
    category: categories['health-beauty'],
  },
  {
    name: 'Ibuprofen',
    category: categories['health-beauty'],
  },
  {
    name: 'Lip Balm',
    category: categories['health-beauty'],
  },
  {
    name: 'Makeup Remover',
    category: categories['health-beauty'],
  },
  {
    name: 'Mouthwash',
    category: categories['health-beauty'],
  },
  {
    name: 'Nail Polish',
    category: categories['health-beauty'],
  },
  {
    name: 'Pain Reliever',
    category: categories['health-beauty'],
  },
  {
    name: 'Razor Blades',
    category: categories['health-beauty'],
  },
  {
    name: 'Shampoo',
    category: categories['health-beauty'],
  },
  {
    name: 'Shaving Cream',
    category: categories['health-beauty'],
  },
  {
    name: 'Sunscreen',
    category: categories['health-beauty'],
  },
  {
    name: 'Tissues',
    category: categories['health-beauty'],
  },
  {
    name: 'Toothbrush',
    category: categories['health-beauty'],
  },
  {
    name: 'Toothpaste',
    category: categories['health-beauty'],
  },
  {
    name: 'Vitamins',
    category: categories['health-beauty'],
  },

  // HOUSEHOLD
  {
    name: 'Air Freshener',
    category: categories.household,
  },
  {
    name: 'All-Purpose Cleaner',
    category: categories.household,
  },
  {
    name: 'Bathroom Cleaner',
    category: categories.household,
  },
  {
    name: 'Bleach',
    category: categories.household,
  },
  {
    name: 'Broom',
    category: categories.household,
  },
  {
    name: 'Candles',
    category: categories.household,
  },
  {
    name: 'Dish Soap',
    category: categories.household,
  },
  {
    name: 'Dishwasher Detergent',
    category: categories.household,
  },
  {
    name: 'Disinfecting Wipes',
    category: categories.household,
  },
  {
    name: 'Dryer Sheets',
    category: categories.household,
  },
  {
    name: 'Fabric Softener',
    category: categories.household,
  },
  {
    name: 'Febreze',
    category: categories.household,
  },
  {
    name: 'Floor Cleaner',
    category: categories.household,
  },
  {
    name: 'Garbage Bags',
    category: categories.household,
  },
  {
    name: 'Glass Cleaner',
    category: categories.household,
  },
  {
    name: 'Kitchen Sponges',
    category: categories.household,
  },
  {
    name: 'Laundry Detergent',
    category: categories.household,
  },
  {
    name: 'Light Bulbs',
    category: categories.household,
  },
  {
    name: 'Napkins',
    category: categories.household,
  },
  {
    name: 'Paper Plates',
    category: categories.household,
  },
  {
    name: 'Paper Towels',
    category: categories.household,
  },
  {
    name: 'Plastic Cups',
    category: categories.household,
  },
  {
    name: 'Plastic Utensils',
    category: categories.household,
  },
  {
    name: 'Swiffer Pads',
    category: categories.household,
  },
  {
    name: 'Toilet Bowl Cleaner',
    category: categories.household,
  },
  {
    name: 'Toilet Paper',
    category: categories.household,
  },
  {
    name: 'Trash Bags',
    category: categories.household,
  },
  {
    name: 'Vacuum Bags',
    category: categories.household,
  },
  {
    name: 'Windex',
    category: categories.household,
  },
  {
    name: 'Ziploc Bags',
    category: categories.household,
  },

  // OTHER
  {
    name: 'Aluminum Foil',
    category: categories.other,
  },
  {
    name: 'Batteries',
    category: categories.other,
  },
  {
    name: 'Charcoal',
    category: categories.other,
  },
  {
    name: 'Lighter Fluid',
    category: categories.other,
  },
  {
    name: 'Matches',
    category: categories.other,
  },
  {
    name: 'Parchment Paper',
    category: categories.other,
  },
  {
    name: 'Pet Food',
    category: categories.other,
  },
  {
    name: 'Plastic Wrap',
    category: categories.other,
  },
  {
    name: 'Wax Paper',
    category: categories.other,
  },
]);
