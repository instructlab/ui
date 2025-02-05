// src/components/Chat/ModelsContext.tsx
'use client';

import * as React from 'react';
import { Endpoint, Model } from '@/types';

const isValidModel = (model: Model) => model.name && model.apiURL && model.modelName;

type ModelsContextType = {
  availableModels: Model[];
};

export const ModelsContext = React.createContext<ModelsContextType>({
  availableModels: []
});

type ModelsProviderProps = {
  children: React.ReactNode;
};

const ModelsContextProvider: React.FC<ModelsProviderProps> = ({ children }) => {
  const [models, setModels] = React.useState<Model[]>([]);

  React.useEffect(() => {
    let canceled = false;

    const fetchModels = async (): Promise<Model[]> => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const defaultModels: Model[] = [
        { isDefault: true, name: 'Granite-7b', apiURL: envConfig.GRANITE_API, modelName: envConfig.GRANITE_MODEL_NAME },
        { isDefault: true, name: 'Merlinite-7b', apiURL: envConfig.MERLINITE_API, modelName: envConfig.MERLINITE_MODEL_NAME }
      ];

      const storedEndpoints = localStorage.getItem('endpoints');

      const customModels = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            isDefault: false,
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName
          }))
        : [];

      return [...defaultModels.filter(isValidModel), ...customModels.filter(isValidModel)];
    };

    fetchModels().then((models) => {
      if (!canceled) {
        setModels(models);
      }
    });

    return () => {
      canceled = true;
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({
      availableModels: models
    }),
    [models]
  );

  return <ModelsContext.Provider value={contextValue}>{children}</ModelsContext.Provider>;
};

export default ModelsContextProvider;
