import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';

interface Props {
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
}
const AuthorInformation: React.FC<Props> = ({ email, setEmail, name, setName }) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{ text: 'Author Info', id: 'author-info-id' }}
          titleDescription="Provide your information required for a GitHub DCO sign-off."
        />
      }
    >
      <FormGroup isRequired key={'author-info-details-id'}>
        <TextInput
          isRequired
          type="email"
          aria-label="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(_event, value) => setEmail(value)}
        />
        <TextInput
          isRequired
          type="text"
          aria-label="name"
          placeholder="Enter your full name"
          value={name}
          onChange={(_event, value) => setName(value)}
        />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default AuthorInformation;
