// src/context/ThemeContext.tsx
'use client';

import React from 'react';
import { FeatureFlagsType } from '@/types';
import { devLog } from '@/utils/devlog';
import { fetchFeatureFlags } from '@/utils/featureFlagsService';

const FEATURE_FLAGS_STORAGE_ITEM = 'IL_Feature_Flags';

const DefaultFeatureFlags = {
  docConversionEnabled: false,
  skillFeaturesEnabled: false,
  playgroundFeaturesEnabled: false,
  experimentalFeaturesEnabled: false
};

const AllFeatureFlags = {
  docConversionEnabled: true,
  skillFeaturesEnabled: true,
  playgroundFeaturesEnabled: true,
  experimentalFeaturesEnabled: true
};

interface FeatureFlagsContextType {
  loaded: boolean;
  featureFlags: FeatureFlagsType;
  devFeatureFlagsEnabled: boolean;
  setDevFeatureFlagsEnabled: (enabled: boolean) => void;
}

const FeatureFlagsContext = React.createContext<FeatureFlagsContextType>({
  loaded: false,
  featureFlags: DefaultFeatureFlags,
  devFeatureFlagsEnabled: false,
  setDevFeatureFlagsEnabled: () => {}
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [envState, setEnvState] = React.useState<FeatureFlagsType>(DefaultFeatureFlags);
  const [featureFlagsEnabled, setFeatureFlagsEnabled] = React.useState<boolean>(false);
  const [currentState, setCurrentState] = React.useState<{ loaded: boolean; featureFlags: FeatureFlagsType }>({
    loaded: false,
    featureFlags: { ...DefaultFeatureFlags }
  });

  React.useEffect(() => {
    fetchFeatureFlags().then((newConfig) => {
      devLog(`======== Env Feature Flags ============`);
      devLog(JSON.stringify(newConfig, null, 2));
      setEnvState(newConfig);

      try {
        const localStorageState = localStorage.getItem(FEATURE_FLAGS_STORAGE_ITEM);
        if (localStorageState === 'true') {
          setFeatureFlagsEnabled(true);
          devLog(`======== Enabled All Feature Flags ============`);
          devLog(JSON.stringify(AllFeatureFlags, null, 2));
          setCurrentState({ loaded: true, featureFlags: AllFeatureFlags });
          return;
        }
      } catch {
        console.error(`Error parsing local storage for feature flags.`);
      }
      setCurrentState({ loaded: true, featureFlags: newConfig });
    });
  }, []);

  const setDevFeatureFlagsEnabled = React.useCallback(
    (enabled: boolean) => {
      if (enabled) {
        const allFeatureFlags = {
          docConversionEnabled: true,
          skillFeaturesEnabled: true,
          playgroundFeaturesEnabled: true,
          experimentalFeaturesEnabled: true
        };
        localStorage.setItem(FEATURE_FLAGS_STORAGE_ITEM, 'true');
        setCurrentState({
          loaded: true,
          featureFlags: allFeatureFlags
        });
      } else {
        setFeatureFlagsEnabled(false);
        localStorage.removeItem(FEATURE_FLAGS_STORAGE_ITEM);
        setCurrentState({ loaded: true, featureFlags: envState });
      }
      setFeatureFlagsEnabled(enabled);
    },
    [envState]
  );

  return (
    <FeatureFlagsContext.Provider value={{ ...currentState, setDevFeatureFlagsEnabled, devFeatureFlagsEnabled: featureFlagsEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = React.useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useEnvConfig must be used within a EnvConfigProvider');
  }
  return context;
};
