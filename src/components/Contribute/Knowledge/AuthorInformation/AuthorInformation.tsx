import React, { useEffect, useState } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';

interface Props {}

const AuthorInformation: React.FC<Props> = () => {
  const [email, setEmail] = useState<string | undefined>();
  const [name, setName] = useState<string | undefined>();

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
