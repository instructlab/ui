// src/app/login/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import './githublogin.css';
import NativeLogin from '@/app/login/nativelogin';
import GithubLogin from '@/app/login/githublogin';
import DevModeLogin from './devmodelogin';

const Login: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | 'github'>();
  const [isDevModeEnabled, setIsDevModeEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const chooseLoginPage = async () => {
      try {
        const res = await fetch('/api/envConfig');
        const envConfig = await res.json();
        setDeploymentType(envConfig.DEPLOYMENT_TYPE);
        setIsDevModeEnabled(envConfig.ENABLE_DEV_MODE === 'true');
      } catch (error) {
        console.error('Error fetching environment config:', error);
        setDeploymentType('github');
      } finally {
        setIsLoading(false);
      }
    };
    chooseLoginPage();
  }, []);

  // Don't render the page until the useEffect finishes fetching environment data
  if (isLoading || deploymentType === null) {
    return <div style={{ color: 'white', padding: '1rem' }}>Loading...</div>;
  }

  if (isDevModeEnabled) {
    return <DevModeLogin />;
  }
  if (deploymentType === 'native') {
    return <NativeLogin />;
  }
  return (
    <Suspense>
      <GithubLogin />
    </Suspense>
  );
};

export default Login;
