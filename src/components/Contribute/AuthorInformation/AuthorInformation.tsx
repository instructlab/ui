import React from 'react';
import { ValidatedOptions, FormGroup, TextInput, FormHelperText, HelperText, HelperTextItem, Form, Flex, FlexItem } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { isEmailValid } from '@/components/Contribute/Utils/validationUtils';
import PageHeader from '@/components/Contribute/PageHeader';

interface Props {
  email: string;
  setEmail: (val: string) => void;
  name: string;
  setName: (val: string) => void;
}
const AuthorInformation: React.FC<Props> = ({ email, setEmail, name, setName }) => {
  const [validEmail, setValidEmail] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validName, setValidName] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validEmailError, setValidEmailError] = React.useState('Required Field');
  const touchedRef = React.useRef<boolean>();

  const validateEmail = (emailStr: string) => {
    const email = emailStr.trim();
    if (isEmailValid(email)) {
      setValidEmail(ValidatedOptions.success);
      setValidEmailError('');
      return;
    }
    const errMsg = email ? 'Please enter a valid email address.' : 'Required field';
    setValidEmail(ValidatedOptions.error);
    setValidEmailError(errMsg);
  };

  const validateName = (nameStr: string) => {
    const name = nameStr.trim();
    setValidName(name.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <PageHeader title="Author Information" description="Provide your information required for a GitHub DCO sign-off." />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup isRequired key={'author-info-details-email'} label="Email address">
            <TextInput
              isRequired
              type="email"
              aria-label="email"
              placeholder="Enter your email address"
              value={email}
              validated={validEmail}
              onChange={(_event, value) => {
                touchedRef.current = true;
                setEmail(value);
              }}
              onBlur={() => validateEmail(email)}
            />
            {validEmail === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validEmail}>
                    {validEmailError}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup isRequired key={'author-info-details-name'} label="Full name">
            <TextInput
              isRequired
              type="text"
              aria-label="name"
              placeholder="Enter your full name"
              value={name}
              validated={validName}
              onChange={(_event, value) => setName(value)}
              onBlur={() => validateName(name)}
            />
            {validName === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validName}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default AuthorInformation;
