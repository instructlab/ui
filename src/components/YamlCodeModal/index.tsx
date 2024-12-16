// src/components/YamlCodeModal/index.tsx
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
    <Modal variant={ModalVariant.medium} title="Current YAML" isOpen={isModalOpen} onClose={handleModalToggle} aria-label="YAML Code Modal">
      <div style={{ padding: '40px' }}>
        <CodeBlock>
          <CodeBlockCode>{yamlContent}</CodeBlockCode>
        </CodeBlock>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 20px' }}>
        <Button variant="primary" onClick={handleModalToggle} style={{ marginRight: '10px' }}>
          Close
        </Button>
        <CopyToClipboardButton text={yamlContent} />
      </div>
    </Modal>
  );
};

export default YamlCodeModal;
