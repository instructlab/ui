import React from 'react';
import './login-page.css';
import { Content } from '@patternfly/react-core';

const LoginLinks: React.FC = () => (
  <div className="login-container urls-text">
    <Content>
      <a href="https://github.com/instructlab/" target="_blank">
        GitHub
      </a>{' '}
      |{' '}
      <a href="https://github.com/instructlab/community/blob/main/Collaboration.md" target="_blank">
        Collaborate
      </a>{' '}
      |{' '}
      <a href="https://github.com/instructlab/community/blob/main/CODE_OF_CONDUCT.md" target="_blank">
        Code Of Conduct
      </a>
    </Content>
    <Content>
      <a href="https://www.redhat.com/en/about/terms-use" target="_blank">
        Terms of use
      </a>{' '}
      |{' '}
      <a href="https://www.redhat.com/en/about/privacy-policy" target="_blank">
        Privacy Policy
      </a>
    </Content>
  </div>
);

export default LoginLinks;
