import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';

export const sqlite = SQLite.openDatabaseSync('db.db', {
  enableChangeListener: true,
});

export const db = drizzle(sqlite);
