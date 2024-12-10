// src/app/page.tsx
'use client';

import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import { DashboardGithub } from '@/components/Dashboard/Github/dashboard';
import { DashboardNative } from '@/components/Dashboard/Native/dashboard';
const Home: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = React.useState<string | undefined>();

  React.useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDeploymentType(envConfig.DEPLOYMENT_TYPE);
    };
    getEnvVariables();
  }, []);

  return <AppLayout>{deploymentType === 'native' ? <DashboardNative /> : <DashboardGithub />}</AppLayout>;
};

export default Home;
