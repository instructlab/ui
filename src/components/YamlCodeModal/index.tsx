// src/components/YamlCodeModal/index.tsx
'use client';
import { Modal, ModalVariant, Button, CodeBlock, CodeBlockCode, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import React from 'react';
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
      aria-labelledby="show-yaml-modal-title"
      aria-describedby="show-yaml-body-variant"
    >
      <ModalHeader title="Current YAML" labelId="show-yaml-modal-title" titleIconVariant="info" />
      <ModalBody id="show-yaml-body-variant">
        <CodeBlock>
          <CodeBlockCode>{yamlContent}</CodeBlockCode>
        </CodeBlock>
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={handleModalToggle}>
          Close
        </Button>
        <CopyToClipboardButton key="copy" text={yamlContent} />
      </ModalFooter>
    </Modal>
  );
};

export default YamlCodeModal;
