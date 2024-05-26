// src/app/playground/devchat/useModelSelector.ts
import { useState, useEffect } from 'react';

interface Model {
  name: string;
  apiURL: string;
  modelName: string;
}

interface Endpoint {
  modelName: string;
  url: string;
}

export const useModelSelector = () => {
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [customModels, setCustomModels] = useState<Model[]>([]);

  useEffect(() => {
    const fetchDefaultModels = async () => {
      // Get the ENVs exported to the client
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const defaultModels: Model[] = [
        { name: 'Granite-7b', apiURL: envConfig.GRANITE_API, modelName: envConfig.GRANITE_MODEL_NAME },
        { name: 'Merlinite-7b', apiURL: envConfig.MERLINITE_API, modelName: envConfig.MERLINITE_MODEL_NAME },
      ];

      console.log('Default Models:', defaultModels);

      const storedEndpoints = localStorage.getItem('endpoints');
      console.log('Stored Endpoints:', storedEndpoints);

      const customModels = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
          name: endpoint.modelName,
          apiURL: `${endpoint.url}`,
          modelName: endpoint.modelName,
        }))
        : [];
      console.log('Custom Models:', customModels);

      const allModels = [...defaultModels, ...customModels];
      console.log('All Models:', allModels);

      setCustomModels(allModels);
      setSelectedModel(allModels[0] || null);
    };

    fetchDefaultModels();
  }, []);

  const onToggleClick = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    const selected = customModels.find((model) => model.name === value) || null;
    console.log('Selected Model:', selected);
    setSelectedModel(selected);
    setIsSelectOpen(false);
  };

  return {
    isSelectOpen,
    selectedModel,
    customModels,
    setIsSelectOpen,
    setSelectedModel,
    onToggleClick,
    onSelect,
  };
};
