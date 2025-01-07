// src/app/dashboard/page.tsx
'use client';

import * as React from 'react';
import { signOut } from 'next-auth/react';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

interface Props {
  onAccept: () => void;
}
const GithubAccessPopup: React.FunctionComponent<Props> = ({ onAccept }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const showPopupWarning = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      if (envConfig.DEPLOYMENT_TYPE === 'native' || envConfig.ENABLE_DEV_MODE === 'true') {
        setIsOpen(false);
        onAccept();
      } else {
        setIsOpen(true);
      }
    };
    showPopupWarning();
  }, [onAccept]);

  const setDecisionAndClose = () => {
    setIsOpen(false);
    onAccept();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title="GitHub Access Permissions"
      titleIconVariant="warning"
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      actions={[
        <Button key="confirm" variant="primary" onClick={() => setDecisionAndClose()}>
          Accept
        </Button>,
        <Button key="cancel" variant="secondary" onClick={() => signOut()}>
          Deny
        </Button>
      ]}
    >
      <p>
        To allow InstructLab UI to manage your taxonomy submissions, you must grant read and write permissions to your GitHub account. InstructLab UI
        will use your account to:
        <br />
        <br />
        <li>
          {' '}
          Pull PRs from the upstream{' '}
          <a href="https://github.com/instructlab/taxonomy" target={'_blank'}>
            InstructLab Taxonomy repo
          </a>{' '}
          that you’ve opened to contribute skills and &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;knowledge.
        </li>
        <li>
          {' '}
          Fork the InstructLab Taxonomy repo to your GitHub account and create PRs from this fork, which can merge
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;into the upstream Taxonomy repo.
        </li>
        <li>
          {' '}
          Fork the{' '}
          <a href="https://github.com/instructlab-public/taxonomy-knowledge-docs" target={'_blank'}>
            taxonomy-knowledge-docs repo
          </a>{' '}
          to your GitHub account and upload knowledge-related &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;documents from your account.
        </li>
        <br />
        These permissions <i>do not</i> enable InstructLab UI to access your GitHub password.
        <br />
        <br />
        To provide InstructLab UI with the permissions necessary for managing your taxonomy submissions, select <b>accept</b>. If you do not wish to
        grant these permissions, select <b>deny</b> to sign out of InstructLab UI.
        <br />
      </p>
    </Modal>
  );
};

export { GithubAccessPopup };
