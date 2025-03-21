// src/components/Contribute/Knowledge/UploadFromGitModal.tsx
'use client';
import React, { FormEvent } from 'react';
import {
  Alert,
  Button,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  Truncate,
  ValidatedOptions
} from '@patternfly/react-core';

interface Props {
  isGithubMode: boolean;
  parentPath: string;
  onClose: (newDirectory?: string) => void;
}

export const AddDirectoryModal: React.FunctionComponent<Props> = ({ isGithubMode, parentPath, onClose }) => {
  const [directoryPath, setDirectoryPath] = React.useState<string>('');
  const [validDirectoryPath, setValidDirectoryPath] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [touched, setTouched] = React.useState<boolean>();

  const validateDirectoryPath = () => {
    if (touched) {
      const path = directoryPath.trim();
      setValidDirectoryPath(path.length === 0 ? ValidatedOptions.error : ValidatedOptions.default);
    }
  };

  const onInputRef = (element: HTMLElement | null) => {
    element?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      if (directoryPath) {
        onClose(directoryPath);
      }
    }
  };

  const onChange = (_event: FormEvent, value: string) => {
    setTouched(true);
    setDirectoryPath(value);
  };

  return (
    <Modal
      variant="small"
      isOpen
      aria-label="add directory"
      onClose={() => onClose()}
      aria-labelledby="add-directory-modal-title"
      aria-describedby="add-directory-modal-description"
    >
      <ModalHeader aria-label="directory-modal-title" title="Add directory" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content aria-label="add-directory-modal-description">This will create a new folder in the taxonomy.</Content>
          </FlexItem>
          {isGithubMode ? (
            <FlexItem>
              <Alert
                variant="info"
                isInline
                isPlain
                title="All new directories must be approved by the taxonomy administrator. If accepted, your new contribution will appear in this directory."
                ouiaId="new-directory-alert"
              />
            </FlexItem>
          ) : null}
          <FlexItem>
            <Form>
              <FormGroup isRequired fieldId="dir-name" label="Directory name">
                <Flex gap={{ default: 'gapSm' }}>
                  <FlexItem className="add-directory-parent">
                    <Truncate content={`${parentPath ?? ''}/`} position="start" />
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <TextInput
                      id="dir-name"
                      ref={onInputRef}
                      isRequired
                      type="text"
                      aria-label="directory name"
                      validated={validDirectoryPath}
                      value={directoryPath}
                      onKeyDown={handleKeyDown}
                      onChange={onChange}
                      onBlur={validateDirectoryPath}
                    />
                  </FlexItem>
                </Flex>
              </FormGroup>
            </Form>
          </FlexItem>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button key="save" variant="primary" onClick={() => onClose(directoryPath)}>
          Add
        </Button>
        <Button key="close" variant="secondary" onClick={() => onClose()}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddDirectoryModal;
