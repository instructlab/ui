// src/context/ThemeContext.tsx
'use client';

import React from 'react';
import { devLog } from '@/utils/devlog';
import { EnvConfigType } from '@/types';
import { fetchEnvConfig } from '@/utils/envConfigService';

const DefaultEnvConfig = {
  graniteApi: '',
  graniteModelName: '',
  merliniteApi: '',
  merliniteModelName: '',
  upstreamRepoOwner: '',
  upstreamRepoName: '',
  taxonomyRootDir: '',
  taxonomyKnowledgeDocumentRepo: '',
  apiServer: '',
  isGithubMode: false,
  isDevMode: false
};

const EnvConfigContext = React.createContext<{ loaded: boolean; envConfig: EnvConfigType }>({ loaded: false, envConfig: DefaultEnvConfig });

export const EnvConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentState, setCurrentState] = React.useState<{ loaded: boolean; envConfig: EnvConfigType }>({
    loaded: false,
    envConfig: { ...DefaultEnvConfig }
  });

  React.useEffect(() => {
    fetchEnvConfig().then((newConfig) => {
      devLog(`======== Env Config ============`);
      devLog(`  isDevMode: `, newConfig.isDevMode);

      setCurrentState({ loaded: true, envConfig: newConfig });
    });
  }, []);

  return <EnvConfigContext.Provider value={{ ...currentState }}>{children}</EnvConfigContext.Provider>;
};

export const useEnvConfig = (): { loaded: boolean; envConfig: EnvConfigType } => {
  const context = React.useContext(EnvConfigContext);
  if (!context) {
    throw new Error('useEnvConfig must be used within a EnvConfigProvider');
  }
  return context;
};
