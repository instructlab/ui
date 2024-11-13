// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import './githublogin.css';
import LocalLogin from '@/app/login/locallogin';
import GithubLogin from '@/app/login/githublogin';

const Login: React.FunctionComponent = () => {
  const [isProd, setIsProd] = useState<boolean | null>(null);

  useEffect(() => {
    const chooseLoginPage = async () => {
      try {
        const res = await fetch('/api/envConfig');
        const envConfig = await res.json();
        setIsProd(envConfig.DEPLOYMENT_TYPE !== 'dev');
      } catch (error) {
        console.error('Error fetching environment config:', error);
        setIsProd(true);
      }
    };
    chooseLoginPage();
  }, []);

  if (isProd === null) {
    // Render a loading indicator or null while determining the environment
    return null;
  }

  return isProd ? <GithubLogin /> : <LocalLogin />;
};

export default Login;
