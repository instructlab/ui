import React, { useEffect } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { KnowledgeFormData } from '..';
import { checkKnowledgeFormCompletion } from '../validation';

interface Props {
  reset: boolean;
  isEditForm?: boolean;
  knowledgeFormData: KnowledgeFormData;
  setDisableAction: React.Dispatch<React.SetStateAction<boolean>>;
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
  reset,
  isEditForm,
  knowledgeFormData,
  setDisableAction,
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
  const [validTitle, setValidTitle] = React.useState<ValidatedOptions>();
  const [validLink, setValidLink] = React.useState<ValidatedOptions>();
  const [validRevision, setValidRevision] = React.useState<ValidatedOptions>();
  const [validLicense, setValidLicense] = React.useState<ValidatedOptions>();
  const [validCreators, setValidCreators] = React.useState<ValidatedOptions>();

  useEffect(() => {
    setValidTitle(ValidatedOptions.default);
    setValidLink(ValidatedOptions.default);
    setValidRevision(ValidatedOptions.default);
    setValidLicense(ValidatedOptions.default);
    setValidCreators(ValidatedOptions.default);
  }, [reset]);

  useEffect(() => {
    if (!isEditForm) {
      return;
    }
    setValidTitle(ValidatedOptions.success);
    setValidLink(ValidatedOptions.success);
    setValidRevision(ValidatedOptions.success);
    setValidLicense(ValidatedOptions.success);
    setValidCreators(ValidatedOptions.success);
  }, [isEditForm]);

  const validateTitle = (title: string) => {
    if (title.length > 0) {
      setValidTitle(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidTitle(ValidatedOptions.error);
    return;
  };

  const validateLink = (link: string) => {
    if (link.length === 0) {
      setDisableAction(true);
      setValidLink(ValidatedOptions.error);
      return;
    }
    try {
      new URL(link);
      setValidLink(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    } catch (e) {
      setDisableAction(true);
      setValidLink(ValidatedOptions.warning);
      return;
    }
  };

  const validateRevision = (revision: string) => {
    if (revision.length > 0) {
      setValidRevision(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidRevision(ValidatedOptions.error);
    return;
  };

  const validateLicense = (license: string) => {
    if (license.length > 0) {
      setValidLicense(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidLicense(ValidatedOptions.error);
    return;
  };

  const validateCreators = (creators: string) => {
    if (creators.length > 0) {
      setValidCreators(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidCreators(ValidatedOptions.error);
    return;
  };

  return (
    <FormFieldGroupExpandable
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                Attribution Information <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'attribution-info-id'
          }}
          titleDescription="Provide attribution information."
        />
      }
    >
      <FormGroup isRequired key={'attribution-info-details-id'}>
        <TextInput
          isRequired
          type="url"
          aria-label="link_work"
          placeholder="Enter link to work"
          validated={validLink}
          value={linkWork}
          onChange={(_event, value) => setLinkWork(value)}
          onBlur={() => validateLink(linkWork)}
        />
        {validLink === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLink}>
                Link to title is required.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
        {validLink === ValidatedOptions.warning && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLink}>
                Please enter a valid URL.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
        <TextInput
          isRequired
          type="text"
          aria-label="title_work"
          placeholder="Enter title of work"
          validated={validTitle}
          value={titleWork}
          onChange={(_event, value) => setTitleWork(value)}
          onBlur={() => validateTitle(titleWork)}
        />
        {validTitle === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validTitle}>
                Title is required.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
        <TextInput
          isRequired
          type="text"
          aria-label="revision"
          placeholder="Enter document revision information"
          validated={validRevision}
          value={revision}
          onChange={(_event, value) => setRevision(value)}
          onBlur={() => validateRevision(revision)}
        />
        {validRevision === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validRevision}>
                Revision is required.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
        <TextInput
          isRequired
          type="text"
          aria-label="license_work"
          placeholder="Enter license of the work"
          validated={validLicense}
          value={licenseWork}
          onChange={(_event, value) => setLicenseWork(value)}
          onBlur={() => validateLicense(licenseWork)}
        />
        {validLicense === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLicense}>
                License is required.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
        <TextInput
          isRequired
          type="text"
          aria-label="creators"
          placeholder="Enter creators Name"
          validated={validCreators}
          value={creators}
          onChange={(_event, value) => setCreators(value)}
          onBlur={() => validateCreators(creators)}
        />
        {validCreators === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={validCreators}>
                Creators is required.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default AttributionInformation;
