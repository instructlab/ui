import React, { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Content, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Alert } from '@patternfly/react-core';
import { GithubIcon } from '@patternfly/react-icons';
import LoginLinks from '@/app/login/LoginLinks';

const GithubLogin: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('Something went wrong.');
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [invalidToken, setInvalidToken] = useState<boolean>(false);

  useEffect(() => {
    const githubUsername = searchParams.get('user');
    setGithubUsername(githubUsername);
    const error = searchParams.get('error');
    if (error === 'NotOrgMember') {
      const errorMessage =
        'To access the InstructLab UI, you need to become a member of the \
        InstructLab public GitHub organization. First, send yourself an invite on GitHub. \
         Then, accept the invite and try accessing the InstructLab UI again.';
      setErrorMsg(errorMessage);
      setShowError(true);
    }
    if (error === 'InvalidToken') {
      setInvalidToken(true);
    }
  }, [searchParams]);

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
    <div className="login-container">
      <Content>
        <Content component="p" className="sign-in-text">
          Sign in to your account
        </Content>
      </Content>
      <Content>
        <Content component="p" className="description-text">
          Join the novel, community based movement to <br></br>create truly open source LLMs
        </Content>
      </Content>
      {invalidToken && <Alert variant="danger" title="GitHub token invalid. Try again." />}
      <div className="login-container">
        <Button variant="primary" className="login-button" icon={<GithubIcon />} iconPosition="left" size="lg" onClick={handleGitHubLogin}>
          Sign in with GitHub
        </Button>
      </div>
      <Content component="p" className="account-create-text">
        New to GitHub?
        <a
          className="create-button"
          href="https://github.com/signup?return_to=https%3A%2F%2Fgithub.com%2Finstructlab%2F&source=login"
          target="_blank"
        >
          Create an account
        </a>
      </Content>
      <LoginLinks />
      {showError && (
        <div>
          <Modal
            variant={ModalVariant.medium}
            title="Join InstructLab on GitHub"
            isOpen={showError}
            onClose={() => handleOnClose()}
            aria-labelledby="join-ilab-modal-title"
            aria-describedby="join-ilab-body-variant"
          >
            <ModalHeader title="Join InstructLab on GitHub" labelId="join-ilab-modal-title" titleIconVariant="danger" />
            <ModalBody id="join-ilab-body-variant">
              <p>{errorMsg}</p>
            </ModalBody>
            <ModalFooter>
              <Button key="confirm" variant="primary" onClick={() => sendInvite()}>
                Send Invite to {githubUsername}
              </Button>
              ,
              <Button key="cancel" variant="secondary" onClick={() => handleOnClose()}>
                No, Thanks
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      )}
    </div>
  );
};

export default GithubLogin;
