// src/app/login/NativeLogin.tsx
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import './githublogin.css';
import { Button, Content, Form, FormGroup, Grid, GridItem, HelperText, HelperTextItem, TextInput } from '@patternfly/react-core';

const NativeLogin: React.FunctionComponent = () => {
  const [, setShowHelperText] = useState(false);
  const [username, setUsername] = useState('');
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [password, setPassword] = useState('');
  const [isValidPassword, setIsValidPassword] = useState(true);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn('credentials', { redirect: false, username, password });
    if (result?.error) {
      setShowHelperText(true);
      setIsValidUsername(false);
      setIsValidPassword(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleUsernameChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setUsername(value);
  };

  const handlePasswordChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setPassword(value);
  };

  return (
    <div className="login-page-background">
      <Grid hasGutter span={12}>
        <GridItem span={6} className="login-container">
          <Content>
            <Content component="p" className="sign-in-text">
              Login locally with a username and password or via GitHub OAuth
            </Content>
          </Content>
          <Content>
            <Content component="p" className="description-text">
              Join the novel, community-based movement to create truly open-source LLMs
            </Content>
          </Content>
          <div className="login-container">
            <Form onSubmit={handleLogin}>
              <FormGroup label="Username" fieldId="username" className="login-label">
                <TextInput
                  value={username}
                  onChange={handleUsernameChange}
                  id="username"
                  isRequired
                  validated={isValidUsername ? 'default' : 'error'}
                />
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
          </div>
          <Content>
            <Content component="p" className="urls-text">
              <a
                href="https://github.com/instructlab/"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>{' '}
              |{' '}
              <a
                href="https://github.com/instructlab/community/blob/main/Collaboration.md"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Collaborate
              </a>{' '}
              |{' '}
              <a
                href="https://github.com/instructlab/community/blob/main/CODE_OF_CONDUCT.md"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Code Of Conduct
              </a>
            </Content>
            <Content component="p" className="urls-text-medium">
              <a
                href="https://www.redhat.com/en/about/terms-use"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of use
              </a>{' '}
              |{' '}
              <a
                href="https://www.redhat.com/en/about/privacy-policy"
                style={{ color: 'white', textDecoration: 'underline' }}
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
            </Content>
          </Content>
        </GridItem>
      </Grid>
    </div>
  );
};

export default NativeLogin;
