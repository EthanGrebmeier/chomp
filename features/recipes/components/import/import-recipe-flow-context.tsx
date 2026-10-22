import { createContext, ReactNode, useContext } from 'react';

import {
  useImportRecipeFlow,
  UseImportRecipeFlowReturn,
} from '../../hooks/useImportRecipeFlow';

const ImportRecipeFlowContext = createContext<UseImportRecipeFlowReturn | null>(
  null
);

type ImportRecipeFlowProviderProps = {
  onImportSuccess?: (recipeId: string) => void;
  children: ReactNode;
};

/**
 * Hosts the import state machine above the route stack so the URL screen
 * and the pushed "Edit Ingredients" screen share one flow instance.
 */
export const ImportRecipeFlowProvider = ({
  onImportSuccess,
  children,
}: ImportRecipeFlowProviderProps) => {
  const flow = useImportRecipeFlow({ onImportSuccess });
  return (
    <ImportRecipeFlowContext.Provider value={flow}>
      {children}
    </ImportRecipeFlowContext.Provider>
  );
};

export const useImportRecipeFlowContext = (): UseImportRecipeFlowReturn => {
  const flow = useContext(ImportRecipeFlowContext);
  if (!flow) {
    throw new Error(
      'useImportRecipeFlowContext must be used within ImportRecipeFlowProvider'
    );
  }
  return flow;
};
