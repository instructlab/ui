'use client';

import React from 'react';
import { Button, Content, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, TextInput } from '@patternfly/react-core';
import { ContributionInfo } from '@/types';

interface Props {
  contribution: ContributionInfo;
  onClose: (deleteContribution: boolean) => void;
}

const DeleteContributionModal: React.FC<Props> = ({ contribution, onClose }) => {
  const [deleteContributionConfirm, setDeleteContributionConfirm] = React.useState<string>('');

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => onClose(false)}
      aria-labelledby="confirm-delete-contribution-title"
      aria-describedby="confirm-delete-contribution-description"
    >
      <ModalHeader
        titleIconVariant="warning"
        title={`Permanently delete this${contribution.isDraft ? ' draft' : ''} contribution?`}
        labelId="confirm-delete-contribution-title"
        descriptorId="confirm-delete-contribution-description"
        description={
          <>
            Are you sure you want to delete{contribution.isDraft ? ' the draft changes you made to' : ''} <strong>{contribution.title}</strong>?
          </>
        }
      />
      <ModalBody id="delete-custom-model-endpoint">
        <Content component="p">
          Type <strong>DELETE</strong> to confirm deletion:
          <span style={{ color: 'var(--pf-t--global--color--status--danger--default' }}> *</span>
        </Content>
        <TextInput
          isRequired
          type="text"
          id="deleteContributionConfirm"
          name="deleteContributionConfirm"
          value={deleteContributionConfirm}
          onChange={(_, value) => setDeleteContributionConfirm(value)}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          key="confirm"
          variant="danger"
          isDisabled={deleteContributionConfirm !== 'DELETE'}
          onClick={() => {
            if (deleteContributionConfirm === 'DELETE') {
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

export default DeleteContributionModal;
