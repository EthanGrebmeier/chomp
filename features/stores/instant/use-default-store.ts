import { Store } from '../types';

import { useStores } from './use-stores';

export const findDefaultStore = <T extends Pick<Store, 'isDefault'>>(
  stores: T[]
): T | null => stores.find(store => store.isDefault) ?? null;

export const useDefaultStore = () => {
  const result = useStores();

  return {
    ...result,
    data: findDefaultStore(result.data),
  };
};
