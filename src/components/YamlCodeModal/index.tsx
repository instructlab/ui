// src/components/YamlCodeModal/index.tsx
'use client';
import {
  Modal,
  ModalVariant,
  Button,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ButtonVariant,
  Alert
} from '@patternfly/react-core';
import React from 'react';
import CopyToClipboardButton from '../../components/CopyToClipboardButton';
import { DownloadIcon } from '@patternfly/react-icons';

interface YamlCodeModalProps {
  isModalOpen: boolean;
  handleModalToggle: () => void;
  yamlContent: string;
  onSave?: () => void;
}

export const YamlCodeModal: React.FC<YamlCodeModalProps> = ({ isModalOpen, handleModalToggle, yamlContent, onSave }) => {
  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen={isModalOpen}
      onClose={handleModalToggle}
      aria-labelledby="show-yaml-modal-title"
      aria-describedby="show-yaml-body-variant"
    >
      <ModalHeader title="Current YAML" labelId="show-yaml-modal-title" titleIconVariant="info" />
      <ModalBody id="show-yaml-body-variant">
        <Alert isInline variant="warning" title={` Document section in the below yaml will be updated once you submit the knowledge contribution.`} />
        <CodeBlock
          actions={
            <CodeBlockAction>
              <CopyToClipboardButton key="copy" text={yamlContent} />
            </CodeBlockAction>
          }
        >
          <CodeBlockCode>{yamlContent}</CodeBlockCode>
        </CodeBlock>
      </ModalBody>
      <ModalFooter>
        {onSave ? (
          <>
            <Button variant={ButtonVariant.primary} onClick={onSave} icon={<DownloadIcon />}>
              Download
            </Button>
            <Button key="close" variant="link" onClick={handleModalToggle}>
              Cancel
            </Button>
          </>
        ) : (
          <Button key="close" variant="primary" onClick={handleModalToggle}>
            Close
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default YamlCodeModal;
