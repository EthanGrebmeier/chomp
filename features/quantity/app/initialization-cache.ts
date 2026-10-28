type Storage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};

/** Cache migration completion, never workspace data or permission verification. */
export function initializationCache(storage: Storage) {
  const key = (listId: string, userId: string) =>
    `quantity-initialized-v1:${userId}:${listId}`;
  return {
    async has(listId: string, userId: string) {
      return storage.getItem(key(listId, userId)).then(
        value => value === '1',
        () => false
      );
    },
    async mark(listId: string, userId: string) {
      // Cache failure must not turn a successful migration into a failed launch.
      await storage.setItem(key(listId, userId), '1').catch(() => {});
    },
  };
}
