// src/components/YamlCodeModal.tsx
'use client';
import React from 'react';
import { Modal } from '@patternfly/react-core/components';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { CodeBlock, CodeBlockCode } from '@patternfly/react-core/dist/dynamic/components/CodeBlock';
import CopyToClipboardButton from '../../components/CopyToClipboardButton';

interface YamlCodeModalProps {
  isModalOpen: boolean;
  handleModalToggle: () => void;
  yamlContent: string;
}

export const YamlCodeModal: React.FC<YamlCodeModalProps> = ({ isModalOpen, handleModalToggle, yamlContent }) => {
  return (
    <Modal
      variant={ModalVariant.medium}
      title="Current YAML"
      isOpen={isModalOpen}
      onClose={handleModalToggle}
      aria-label="YAML Code Modal"
      // TODO: fix the typecheck error
      // @ts-expect-error: Property 'actions' does not exist on type 'ModalProps'
      actions={[
        <Button key="close" variant="primary" onClick={handleModalToggle}>
          Close
        </Button>,
        <CopyToClipboardButton key="copy" text={yamlContent} />
      ]}
    >
      <CodeBlock>
        <CodeBlockCode>{yamlContent}</CodeBlockCode>
      </CodeBlock>
    </Modal>
  );
};

export default YamlCodeModal;
