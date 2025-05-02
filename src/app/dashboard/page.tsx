// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import { Flex, Spinner } from '@patternfly/react-core';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_xl';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import { DashboardGithub } from '@/components/Dashboard/Github/dashboard';
import { DashboardNative } from '@/components/Dashboard/Native/dashboard';
import { useEnvConfig } from '@/context/EnvConfigContext';

const Home: React.FunctionComponent = () => {
  const {
    loaded,
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <AppLayout>
      {loaded ? (
        !isGithubMode ? (
          <DashboardNative />
        ) : (
          <DashboardGithub />
        )
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default Home;
