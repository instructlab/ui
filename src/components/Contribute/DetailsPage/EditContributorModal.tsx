// src/components/Contribute/DetailsPage/EditContributorModal.tsx
'use client';
import React, { useEffect } from 'react';
import {
  Button,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
  ValidatedOptions
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

const validateName = (newName: string): ValidatedOptions => {
  return newName.trim().length > 0 ? ValidatedOptions.success : ValidatedOptions.error;
};

const validateEmail = (newEmail: string): { validation: ValidatedOptions; errorMsg: string } => {
  const emailStr = newEmail.trim();
  const re = /\S+@\S+\.\S+/;
  if (re.test(emailStr)) {
    return { validation: ValidatedOptions.success, errorMsg: '' };
  }
  return { validation: ValidatedOptions.error, errorMsg: emailStr ? 'Please enter a valid email address.' : 'Required field' };
};

interface Props {
  name?: string;
  email?: string;
  onSave: (newName: string, newEmail: string) => void;
  onClose: () => void;
}

export const EditContributorModal: React.FunctionComponent<Props> = ({ name = '', email = '', onSave, onClose }) => {
  const [updatedEmail, setUpdatedEmail] = React.useState<string>(email);
  const [updatedName, setUpdatedName] = React.useState<string>(name);
  const [validEmail, setValidEmail] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validName, setValidName] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validEmailError, setValidEmailError] = React.useState('Required Field');

  useEffect(() => {
    setUpdatedName(name);
    setValidName(validateName(name));
  }, [name]);

  useEffect(() => {
    setUpdatedEmail(email);
    const { validation, errorMsg } = validateEmail(email);
    setValidEmail(validation);
    setValidEmailError(errorMsg);
  }, [email]);

  return (
    <Modal
      variant="medium"
      isOpen
      aria-label="Edit contributor information"
      aria-describedby="edit-contributor-description"
      aria-labelledby="edit-contributor-title"
      onClose={() => onClose()}
    >
      <ModalHeader title="Edit contributor information" titleIconVariant="warning" labelId="edit-contributor-title" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Content id="edit-contributor-description">
              To ensure your contribution can be properly signed off and credited to you, use the name and email address associated with your GitHub
              account.{' '}
              <Button
                isInline
                variant="link"
                href="https://docs.instructlab.ai/community/CONTRIBUTING/#developer-certificate-of-origin-dco"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about GitHub Developer Certificate of Origin (DCO) sign-off.
              </Button>
            </Content>
          </FlexItem>
          <FlexItem>
            <Form>
              <FormGroup isRequired fieldId="contributor-name" label="Name">
                <TextInput
                  id="contributor-name"
                  isRequired
                  type="text"
                  aria-label="name"
                  validated={validEmail}
                  value={updatedName}
                  onChange={(_event, value) => setUpdatedName(value)}
                  onBlur={() => setValidName(validateName(updatedName))}
                />
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem>Please provide the full name associated with your GitHub account</HelperTextItem>
                  </HelperText>
                </FormHelperText>
              </FormGroup>
              <FormGroup isRequired fieldId="contributor-email" label="Email">
                <TextInput
                  id="contributor-emal"
                  isRequired
                  type="text"
                  aria-label="email"
                  value={updatedEmail}
                  validated={validEmail}
                  onChange={(_event, value) => setUpdatedEmail(value)}
                  onBlur={() => {
                    const { validation, errorMsg } = validateEmail(updatedEmail);
                    setValidEmail(validation);
                    setValidEmailError(errorMsg);
                  }}
                />
                <FormHelperText>
                  <HelperText>
                    {validEmail === ValidatedOptions.error && validEmailError ? (
                      <HelperTextItem variant={validEmail}>{validEmailError}</HelperTextItem>
                    ) : (
                      <HelperTextItem>Please provide the email address associated with your GitHub account</HelperTextItem>
                    )}
                  </HelperText>
                </FormHelperText>
              </FormGroup>
            </Form>
          </FlexItem>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button
          key="save"
          variant="primary"
          isDisabled={validName === ValidatedOptions.error || validEmail === ValidatedOptions.error}
          onClick={() => onSave(updatedName, updatedEmail)}
        >
          Save
        </Button>
        <Button key="close" variant="secondary" onClick={() => onClose()}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default EditContributorModal;
