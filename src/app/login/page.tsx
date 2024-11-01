// src/app/login/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import GithubLogin from './githublogin';
import { Grid, GridItem } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Form, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { HelperText, HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import './githublogin.css';

const Login: React.FunctionComponent = () => {
  const [, setShowHelperText] = useState(false);
  const [username, setUsername] = useState('');
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [password, setPassword] = useState('');
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isProd, setIsProd] = useState<boolean | null>(null); // Use null for initial load state


  useEffect(() => {
    const chooseLoginPage = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setIsProd(envConfig.DEPLOYMENT_TYPE !== 'dev');
    };
    chooseLoginPage();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', { redirect: false, username, password });
    if (result?.error) {
      setShowHelperText(true);
      setIsValidUsername(false);
      setIsValidPassword(false);
    } else {
      window.location.href = '/';
    }
  };

  const handleUsernameChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUsername(value);
  };

  const handlePasswordChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setPassword(value);
  };

  const loginForm = (
    <Form onSubmit={handleLogin}>
      <FormGroup label="Username" fieldId="username" className="login-label">
        <TextInput value={username} onChange={handleUsernameChange} id="username" isRequired validated={isValidUsername ? 'default' : 'error'} />
        {!isValidUsername && (
          <HelperText>
            <HelperTextItem variant="error">Invalid Username</HelperTextItem>
          </HelperText>
        )}
      </FormGroup>
      <FormGroup label="Password" fieldId="password" className="login-label">
        <TextInput
          value={password}
          onChange={handlePasswordChange}
          id="password"
          type="password"
          isRequired
          validated={isValidPassword ? 'default' : 'error'}
        />
        {!isValidPassword && (
          <HelperText>
            <HelperTextItem variant="error">Invalid password</HelperTextItem>
          </HelperText>
        )}
      </FormGroup>
      <Button type="submit" style={{ backgroundColor: 'black', color: 'white' }}>
        Login
      </Button>
    </Form>
  );

  const devModeContent = (
    <div className="login-page-background">
      <Grid hasGutter span={12}>
        <GridItem span={6} className="login-container">
          <TextContent>
            <Text className="sign-in-text">Login locally with admin username and password</Text>
          </TextContent>
          <TextContent>
            <Text className="description-text">Join the novel, community-based movement to create truly open-source LLMs</Text>
          </TextContent>
          <div className="login-container">{loginForm}</div>
          <TextContent>
            <Text className="urls-text">
              <a href="https://github.com/instructlab/" style={{ color: 'white', textDecoration: 'underline' }} target="_blank">
                GitHub
              </a>{' '}
              |{' '}
              <a
                href="https://github.com/instructlab/community/blob/main/Collaboration.md"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
              >
                Collaborate
              </a>{' '}
              |{' '}
              <a
                href="https://github.com/instructlab/community/blob/main/CODE_OF_CONDUCT.md"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
              >
                Code Of Conduct
              </a>
            </Text>
            <Text className="urls-text-medium">
              <a href="https://www.redhat.com/en/about/terms-use" style={{ color: 'white', textDecoration: 'underline' }} target="_blank">
                Terms of use
              </a>{' '}
              |{' '}
              <a href="https://www.redhat.com/en/about/privacy-policy" style={{ color: 'white', textDecoration: 'underline' }} target="_blank">
                Privacy Policy
              </a>
            </Text>
          </TextContent>
        </GridItem>
      </Grid>
    </div>
  );

  return isProd ? <GithubLogin /> : devModeContent;
};

export default Login;
