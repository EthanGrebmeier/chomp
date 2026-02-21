import { Slot } from 'expo-router';

import { useGroceryLists } from '@/features/grocery-lists/instant/useGroceryLists';
import { InstantAuthHandler } from '@/lib/instant/use-clerk-auth';

import { useRecipes } from '../../features/recipes/hooks';

export default function Layout() {
  // Preload all essential queries for instant availability
  useRecipes();
  useGroceryLists();

  return (
    <>
      <InstantAuthHandler />
      <Slot />
    </>
  );
}
