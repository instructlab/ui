import React, { useEffect, useState } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { SkillFormData } from '..';
import { checkSkillFormCompletion } from '../validation';

interface Props {
  reset: boolean;
  skillFormData: SkillFormData;
  setDisableAction: React.Dispatch<React.SetStateAction<boolean>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
}
const AuthorInformation: React.FC<Props> = ({ reset, skillFormData, setDisableAction, email, setEmail, name, setName }) => {
  const [validEmail, setValidEmail] = useState<ValidatedOptions>();
  const [validName, setValidName] = useState<ValidatedOptions>();
  const [validEmailError, setValidEmailError] = useState("Required Field");
  

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    if (re.test(email)) {
      setValidEmail(ValidatedOptions.success);
      setDisableAction(!checkSkillFormCompletion(skillFormData));
      setValidEmailError("");
      return;
    }
    const errMsg = email ? "Please enter a valid email address." : "Required field";
    setDisableAction(true);
    setValidEmail(ValidatedOptions.error);
    setValidEmailError(errMsg);
    return;
  };

  const validateName = (name: string) => {
    if (name.length > 0) {
      setValidName(ValidatedOptions.success);
      setDisableAction(!checkSkillFormCompletion(skillFormData));
      return;
    }
    setDisableAction(true);
    setValidName(ValidatedOptions.error);
    return;
  };

  useEffect(() => {
    setValidEmail(ValidatedOptions.default);
    setValidName(ValidatedOptions.default);
  }, [reset]);

  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                Author Information <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'author-info-id'
          }}
          titleDescription="Provide your information required for a GitHub DCO sign-off."
        />
      }
    >
      <FormGroup isRequired key={'author-info-details-email'} label="Email">
        <TextInput
          isRequired
          type="email"
          aria-label="email"
          placeholder="Enter your email address"
          value={email}
          validated={validEmail}
          onChange={(_event, value) => setEmail(value)}
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
    </FormFieldGroupExpandable>
  );
};

export default AuthorInformation;
