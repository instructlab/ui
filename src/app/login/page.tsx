// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Spinner } from '@patternfly/react-core';
import NativeLogin from '@/app/login/nativelogin';
import GithubLogin from '@/app/login/githublogin';
import './login-page.css';

const Login: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | 'github'>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const chooseLoginPage = async () => {
      try {
        const res = await fetch('/api/envConfig');
        const envConfig = await res.json();
        setDeploymentType(envConfig.DEPLOYMENT_TYPE);
      } catch (error) {
        console.error('Error fetching environment config:', error);
        setDeploymentType('github');
      } finally {
        setIsLoading(false);
      }
    };
    chooseLoginPage();
  }, []);

  return (
    <div className="login-page-background">
      {isLoading ? (
        <div className="loading-container">
          <Spinner size="lg" />
          Loading...
        </div>
      ) : (
        <div className="login-page-container">{deploymentType === 'native' ? <NativeLogin /> : <GithubLogin />}</div>
      )}
    </div>
  );
};

export default Login;
