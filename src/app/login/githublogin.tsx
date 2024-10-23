import React, { useEffect, useState } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Grid } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import { GridItem } from '@patternfly/react-core/dist/dynamic/layouts/Grid';
import GithubIcon from '@patternfly/react-icons/dist/dynamic/icons/github-icon';
import './githublogin.css';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/esm/components/Modal';

const GithubLogin: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Something went wrong.');
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

  useEffect(() => {
    const githubUsername = searchParams.get('user');
    setGithubUsername(githubUsername);
    const error = searchParams.get('error');
    if (error === 'NotOrgMember') {
      const errorMessage =
        'Join InstructLab on GitHub \
        To access the InstructLab UI, you need to become a member of the InstructLab public GitHub organization.\
         First, send yourself an invite on GitHub. Then, accept the invite and try accessing the InstructLab UI again.';
      setErrorMsg(errorMessage);
      setShowError(true);
    }
  }, []);

  const handleGitHubLogin = () => {
    signIn('github', { callbackUrl: '/' }); // Redirect to home page after login
  };

  const handleOnClose = () => {
    setShowError(false);
    router.push('/');
  };

  const sendInvite = async () => {
    console.log('Sending invitation to:', githubUsername); // Log the GitHub username
    try {
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ githubUsername })
      });

      const responseBody = await response.text();
      console.log('API response body:', responseBody);

      if (response.ok) {
        alert('You have been invited to the GitHub organization!');
        setShowError(false);
        router.push('/');
      } else {
        console.log('Failed to send invitation:', responseBody);
        alert(`Failed to send invitation: ${responseBody}`);
        router.push('/');
      }
    } catch (error) {
      console.error('Error while sending the invitation:', error);
      alert('An error occurred while sending the invitation.');
      router.push('/');
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
      {showError && (
        <div>
          <Modal
            variant={ModalVariant.medium}
            title="Please Join The InstructLab Public Organization On GitHub"
            titleIconVariant="warning"
            isOpen={showError}
            onClose={() => handleOnClose()}
            actions={[
              <Button key="confirm" variant="primary" onClick={() => sendInvite()}>
                Send Invite to {githubUsername}
              </Button>,
              <Button key="cancel" variant="secondary" onClick={() => handleOnClose()}>
                No, Thanks
              </Button>
            ]}
          >
            <p>{errorMsg}</p>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default GithubLogin;
