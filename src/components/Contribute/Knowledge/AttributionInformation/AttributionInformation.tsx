import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';

interface Props {
  titleWork: string;
  setTitleWork: React.Dispatch<React.SetStateAction<string>>;
  linkWork: string;
  setLinkWork: React.Dispatch<React.SetStateAction<string>>;
  revision: string;
  setRevision: React.Dispatch<React.SetStateAction<string>>;
  licenseWork: string;
  setLicenseWork: React.Dispatch<React.SetStateAction<string>>;
  creators: string;
  setCreators: React.Dispatch<React.SetStateAction<string>>;
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
