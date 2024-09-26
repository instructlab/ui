import React from 'react';
import { Page } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Grid } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import { GridItem } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import GithubIcon from '@patternfly/react-icons/dist/dynamic/icons/github-icon';
import './githublogin.css';
import { signIn } from 'next-auth/react';

const GithubLogin: React.FC = () => {
  const handleGitHubLogin = () => {
    signIn('github', { callbackUrl: '/' }); // Redirect to home page after login
  };

  return (
    <Page>
      <PageSection isFilled className="login-page-background">
        <Grid hasGutter span={12}>
          <GridItem span={6} className="login-container">
            <div>
              <TextContent>
                <Text className="sign-in-text">Sign in to your account</Text>
              </TextContent>
              <TextContent>
                <Text className="description-text">
                  Join the novel, community based movement to <br></br>create truly open source LLMs
                </Text>
              </TextContent>
              <div className="login-container">
                <Button
                  variant="primary"
                  icon={<GithubIcon />}
                  iconPosition="left"
                  size="lg"
                  style={{ backgroundColor: 'black' }}
                  onClick={handleGitHubLogin}
                >
                  Sign in with GitHub
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
      </PageSection>
    </Page>
  );
};

export default GithubLogin;
