import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Grid } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import { GridItem } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import GithubIcon from '@patternfly/react-icons/dist/dynamic/icons/github-icon';
import './githublogin.css';
import { signIn } from 'next-auth/react';

const CustomLogoIcon: React.FC = () => <img src="/updated-logo.png" alt="Sign up logo" style={{ width: '15px', height: '15px' }} />;

const GithubLogin: React.FC = () => {
  const handleGitHubLogin = () => {
    signIn('github', { callbackUrl: '/' }); // Redirect to home page after login
  };

  const handleSignUpClick = (event: React.MouseEvent) => {
    const signupUrl =
      'https://instructlab-inviter-instructlab-public-inviter.qa-ui-instructlab-ai-0e3e0ef4c9c6d831e8aa6fe01f33bfc4-0000.us-south.containers.appdomain.cloud/'; // Replace with the actual signup URL
    if (event.shiftKey || event.ctrlKey || event.metaKey) {
      // Open in a new tab if Shift, Ctrl, or Cmd is pressed
      window.open(signupUrl, '_blank');
    } else {
      // Otherwise, navigate in the current window
      window.location.href = signupUrl;
    }
  };

  return (
    <div className="login-page-background">
      <Grid hasGutter span={12}>
        <GridItem span={6} className="login-container">
          <div>
            <TextContent>
              <Text className="sign-in-text">Sign in to your account</Text>
            </TextContent>
            <TextContent>
              <Text className="description-text">
                Join the novel, community based movement to <br />
                create truly open source LLMs
              </Text>
            </TextContent>
            <div className="login-container">
              <Button
                variant="primary"
                icon={<GithubIcon />}
                iconPosition="left"
                size="lg"
                style={{ backgroundColor: 'black', marginRight: '20px' }}
                onClick={handleGitHubLogin}
              >
                Sign in with GitHub
              </Button>
              <Button
                variant="primary"
                icon={<CustomLogoIcon />}
                iconPosition="left"
                size="lg"
                style={{ backgroundColor: 'black' }}
                onClick={handleSignUpClick}
              >
                Sign up
              </Button>
            </div>
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
          </div>
        </GridItem>
      </Grid>
    </div>
  );
};

export default GithubLogin;
