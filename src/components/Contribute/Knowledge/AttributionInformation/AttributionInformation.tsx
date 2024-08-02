import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';

interface Props {
  titleWork: string | undefined;
  setTitleWork: React.Dispatch<React.SetStateAction<string | undefined>>;
  linkWork: string | undefined;
  setLinkWork: React.Dispatch<React.SetStateAction<string | undefined>>;
  revision: string | undefined;
  setRevision: React.Dispatch<React.SetStateAction<string | undefined>>;
  licenseWork: string | undefined;
  setLicenseWork: React.Dispatch<React.SetStateAction<string | undefined>>;
  creators: string | undefined;
  setCreators: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const AttributionInformation: React.FC<Props> = ({
  titleWork,
  setTitleWork,
  linkWork,
  setLinkWork,
  revision,
  setRevision,
  licenseWork,
  setLicenseWork,
  creators,
  setCreators
}) => {
  return (
    <FormFieldGroupExpandable
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{ text: 'Attribution Info', id: 'attribution-info-id' }}
          titleDescription="Provide attribution information."
        />
      }
    >
      <FormGroup isRequired key={'attribution-info-details-id'}>
        <TextInput
          isRequired
          type="text"
          aria-label="title_work"
          placeholder="Enter title of work"
          value={titleWork}
          onChange={(_event, value) => setTitleWork(value)}
        />
        <TextInput
          isRequired
          type="url"
          aria-label="link_work"
          placeholder="Enter link to work"
          value={linkWork}
          onChange={(_event, value) => setLinkWork(value)}
        />
        <TextInput
          isRequired
          type="text"
          aria-label="revision"
          placeholder="Enter document revision information"
          value={revision}
          onChange={(_event, value) => setRevision(value)}
        />
        <TextInput
          isRequired
          type="text"
          aria-label="license_work"
          placeholder="Enter license of the work"
          value={licenseWork}
          onChange={(_event, value) => setLicenseWork(value)}
        />
        <TextInput
          isRequired
          type="text"
          aria-label="creators"
          placeholder="Enter creators Name"
          value={creators}
          onChange={(_event, value) => setCreators(value)}
        />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default AttributionInformation;
