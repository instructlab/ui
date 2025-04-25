'use client';

import React from 'react';
import { Button, Content, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, TextInput } from '@patternfly/react-core';
import { Endpoint } from '@/types';

interface Props {
  endpoint: Endpoint;
  onClose: (deleteEndpoint: boolean) => void;
}

const DeleteEndpointModal: React.FC<Props> = ({ endpoint, onClose }) => {
  const [deleteEndpointName, setDeleteEndpointName] = React.useState<string>('');

  return (
    <Modal
      variant={ModalVariant.medium}
      isOpen
      onClose={() => onClose(false)}
      aria-labelledby="confirm-delete-custom-model-endpoint"
      aria-describedby="show-yaml-body-variant"
    >
      <ModalHeader
        titleIconVariant="warning"
        title="Delete custom model endpoint?"
        labelId="confirm-delete-custom-model-endpoint-title"
        description={
          <>
            The <strong>{endpoint.name}</strong> custom model endpoint will be deleted.
          </>
        }
      />
      <ModalBody id="delete-custom-model-endpoint">
        <Content component="p">
          Type <strong>{endpoint.name}</strong> to confirm deletion:
          <span style={{ color: 'var(--pf-t--global--color--status--danger--default' }}> *</span>
        </Content>
        <TextInput
          isRequired
          type="text"
          id="deleteEndpointByName"
          name="deleteEndpointByName"
          title="type {endpoint.name} to confirm."
          value={deleteEndpointName}
          onChange={(_, value) => setDeleteEndpointName(value)}
        />
      </ModalBody>
      <ModalFooter>
        <Button
          key="confirm"
          variant="danger"
          isDisabled={deleteEndpointName !== endpoint.name}
          onClick={() => {
            if (deleteEndpointName === endpoint.name) {
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

export default DeleteEndpointModal;
