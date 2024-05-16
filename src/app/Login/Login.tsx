// Login.tsx
import {ExclamationCircleIcon} from "@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon";
import React, { ChangeEvent, useState } from "react";
import { LoginForm } from '@patternfly/react-core/dist/dynamic/components/LoginPage'
import { LoginPage } from '@patternfly/react-core/dist/dynamic/components/LoginPage'
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List'
import { ListVariant } from '@patternfly/react-core/dist/dynamic/components/List'
import { LoginFooterItem } from '@patternfly/react-core/dist/dynamic/components/LoginPage'
import logo from '@app/bgimages/InstructLab-Logo.svg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../common/AuthContext";
import './login.css';

export const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showHelperText, setShowHelperText] = useState(false);
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const { login } = useAuth();

  const onLogin = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const adminUsername = process.env.IL_UI_ADMIN_USERNAME || "admin";
    const adminPassword = process.env.IL_UI_ADMIN_PASSWORD || "password";
    // Check if the credentials are correct, using environment variables if available
    if (username === adminUsername && password === adminPassword) {
      login();
      navigate('/');
    } else {
      setShowHelperText(true);
      setIsValidUsername(false);
      setIsValidPassword(false);
    }
  };

  const onChangeUsername = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
    if (showHelperText) {
      setShowHelperText(false);
      setIsValidUsername(true);
    }
  };

  const onChangePassword = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (showHelperText) {
      setShowHelperText(false);
      setIsValidPassword(true);
    }
  };

  const listItem = (
    <React.Fragment>
      <ListItem>
        <LoginFooterItem href="https://github.com/instructlab/instructlab-bot">Help</LoginFooterItem>
      </ListItem>
      <ListItem>
        <LoginFooterItem href="https://github.com/instructlab/instructlab-bot">Terms of Service</LoginFooterItem>
      </ListItem>
    </React.Fragment>
  );


  const loginForm = (
    <LoginForm
      showHelperText={showHelperText}
      helperText="Invalid login credentials."
      helperTextIcon={<ExclamationCircleIcon />}
      usernameLabel="Username"
      usernameValue={username}
      onChangeUsername={onChangeUsername}
      isValidUsername={isValidUsername}
      passwordLabel="Password"
      passwordValue={password}
      onChangePassword={onChangePassword}
      isValidPassword={isValidPassword}
      onLoginButtonClick={onLogin}
      loginButtonLabel="Log in"
    />
  );

  return (
    <div className="login-container">
      <LoginPage
        footerListVariants={ListVariant.inline}
        brandImgSrc={logo}
        brandImgAlt="Instruct Lab Logo"
        footerListItems={listItem}
        textContent="Instruct Lab Bot Infrastructure"
        loginTitle="Log in to your account"
        loginSubtitle="Instruct Lab Bot Infrastructure Login."
      >
        {loginForm}
      </LoginPage>
    </div>
  );
};

export default Login;
