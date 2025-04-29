// src/app/login/page.tsx
'use client';

import React from 'react';
import { Spinner } from '@patternfly/react-core';
import NativeLogin from '@/app/login/nativelogin';
import GithubLogin from '@/app/login/githublogin';
import './login-page.css';
import { useEnvConfig } from '@/context/EnvConfigContext';

const Login: React.FunctionComponent = () => {
  const {
    loaded,
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <div className="login-page-background">
      {!loaded ? (
        <div className="loading-container">
          <Spinner size="lg" />
          Loading...
        </div>
      ) : (
        <div className="login-page-container">{!isGithubMode ? <NativeLogin /> : <GithubLogin />}</div>
      )}
    </div>
  );
};

export default Login;
