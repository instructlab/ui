// src/context/ThemeContext.tsx
'use client';

import React from 'react';
import { devLog } from '@/utils/devlog';
import { FeatureFlagsType } from '@/types';
import { fetchFeatureFlags } from '@/utils/featureFlagsService';

const DefaultFeatureFlags = {
  docConversionEnabled: false,
  skillFeaturesEnabled: false,
  playgroundFeaturesEnabled: false,
  experimentalFeaturesEnabled: false
};

const FeatureFlagsContext = React.createContext<{ loaded: boolean; featureFlags: FeatureFlagsType }>({
  loaded: false,
  featureFlags: DefaultFeatureFlags
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentState, setCurrentState] = React.useState<{ loaded: boolean; featureFlags: FeatureFlagsType }>({
    loaded: false,
    featureFlags: { ...DefaultFeatureFlags }
  });

  React.useEffect(() => {
    fetchFeatureFlags().then((newConfig) => {
      devLog(`======== Feature Flags ============`);
      devLog(`  docConversionEnabled: `, newConfig.docConversionEnabled);
      devLog(`  skillFeaturesEnabled: `, newConfig.skillFeaturesEnabled);
      devLog(`  playgroundFeaturesEnabled: `, newConfig.playgroundFeaturesEnabled);
      devLog(`  experimentalFeaturesEnabled: `, newConfig.experimentalFeaturesEnabled);
      setCurrentState({ loaded: true, featureFlags: newConfig });
    });
  }, []);

  return <FeatureFlagsContext.Provider value={{ ...currentState }}>{children}</FeatureFlagsContext.Provider>;
};

export const useFeatureFlags = (): { loaded: boolean; featureFlags: FeatureFlagsType } => {
  const context = React.useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useEnvConfig must be used within a EnvConfigProvider');
  }
  return context;
};
