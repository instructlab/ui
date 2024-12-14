// src/app/dashboard/page.tsx
'use client';

import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import { DashboardGithub } from '@/components/Dashboard/Github/dashboard';
import { DashboardNative } from '@/components/Dashboard/Native/dashboard';
import { useEffect, useState } from 'react';

const Home: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | undefined>();

  useEffect(() => {
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
