'use client';

import React from 'react';
import { Button, Content, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, TextInput } from '@patternfly/react-core';
import { KnowledgeFile } from '@/types';

interface Props {
  document: KnowledgeFile;
  onClose: (deleteDocument: boolean) => void;
}

const DeleteDocumentModal: React.FC<Props> = ({ document, onClose }) => {
  const [deleteDocumentConfirm, setDeleteDocumentConfirm] = React.useState<string>('');

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => onClose(false)}
      aria-labelledby="confirm-delete-document-title"
      aria-describedby="confirm-delete-document-description"
    >
      <ModalHeader
        titleIconVariant="warning"
        title={`Permanently delete this document?`}
        labelId="confirm-delete-document-title"
        descriptorId="confirm-delete-document-description"
        description={
          <>
            Are you sure you want to delete the file <strong>{document.filename}</strong>?
          </>
        }
      />
      <ModalBody>
        <Content component="p">
          Type <strong>DELETE</strong> to confirm deletion:
          <span style={{ color: 'var(--pf-t--global--color--status--danger--default' }}> *</span>
        </Content>
        <TextInput
          isRequired
          type="text"
          id="deleteDocumentConfirm"
          name="deleteDocumentConfirm"
          value={deleteDocumentConfirm}
          onChange={(_, value) => setDeleteDocumentConfirm(value)}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          key="confirm"
          variant="danger"
          isDisabled={deleteDocumentConfirm !== 'DELETE'}
          onClick={() => {
            if (deleteDocumentConfirm === 'DELETE') {
              onClose(true);
            }
          }}
        >
          Delete
        </Button>
        <Button key="cancel" variant="secondary" onClick={() => onClose(false)}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteDocumentModal;
