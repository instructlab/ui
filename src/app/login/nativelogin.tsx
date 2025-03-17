// src/app/login/NativeLogin.tsx
import React, { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Alert, Content, LoginForm } from '@patternfly/react-core';
import LoginLinks from '@/app/login/LoginLinks';

const NativeLogin: React.FunctionComponent = () => {
  const [, setShowHelperText] = useState(false);
  const [username, setUsername] = useState('');
  const [invalidLogin, setInvalidLogin] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setInvalidLogin(false);
    setInProgress(true);
    const result = await signIn('credentials', { redirect: false, username, password });
    if (result?.error) {
      setShowHelperText(true);
      setInvalidLogin(true);
      setInProgress(false);
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
    <div className="native-login-container">
      <div>
        <Content component="p" className="sign-in-text">
          Log in to your account
        </Content>
        <Content component="p" className="description-text">
          Join the novel, community-based movement to create truly open-source LLMs
        </Content>
        {invalidLogin ? <Alert className="login-alert" variant="danger" isInline title="Invalid login credentials" /> : null}
        <LoginForm
          className="login-form"
          usernameLabel="Username"
          usernameValue={username}
          onChangeUsername={handleUsernameChange}
          passwordLabel="Password"
          passwordValue={password}
          onChangePassword={handlePasswordChange}
          onLoginButtonClick={handleLogin}
          loginButtonLabel="Log in"
          isLoginButtonDisabled={inProgress}
        />
        <LoginLinks />
      </div>
    </div>
  );
};

export default NativeLogin;
