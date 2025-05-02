// src/components/Chat/ModelsContext.tsx
'use client';

import * as React from 'react';
import { Endpoint, Model } from '@/types';
import { useEnvConfig } from '@/context/EnvConfigContext';

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
  const { loaded, envConfig } = useEnvConfig();

  React.useEffect(() => {
    if (loaded) {
      const defaultModels: Model[] = [
        {
          isDefault: true,
          name: 'Granite-7b',
          apiURL: envConfig.graniteApi,
          modelName: envConfig.graniteModelName,
          enabled: true
        },
        {
          isDefault: true,
          name: 'Merlinite-7b',
          apiURL: envConfig.merliniteApi,
          modelName: envConfig.merliniteModelName,
          enabled: true
        }
      ];

      const storedEndpoints = localStorage.getItem('endpoints');
      const customModels = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            isDefault: false,
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName,
            enabled: endpoint.enabled,
            apiKey: endpoint.apiKey
          }))
        : [];

      setModels([...defaultModels.filter(isValidModel), ...customModels.filter(isValidModel)]);
    }
  }, [loaded, envConfig]);

  const contextValue = React.useMemo(
    () => ({
      availableModels: models
    }),
    [models]
  );

  return <ModelsContext.Provider value={contextValue}>{children}</ModelsContext.Provider>;
};

export default ModelsContextProvider;
