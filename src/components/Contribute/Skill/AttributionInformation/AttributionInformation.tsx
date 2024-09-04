import React, { useEffect } from 'react';
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
  isEditForm?: boolean;
  skillFormData: SkillFormData;
  setDisableAction: React.Dispatch<React.SetStateAction<boolean>>;
  titleWork: string;
  setTitleWork: React.Dispatch<React.SetStateAction<string>>;
  licenseWork: string;
  setLicenseWork: React.Dispatch<React.SetStateAction<string>>;
  creators: string;
  setCreators: React.Dispatch<React.SetStateAction<string>>;
}

const AttributionInformation: React.FC<Props> = ({
  reset,
  isEditForm,
  skillFormData,
  setDisableAction,
  titleWork,
  setTitleWork,
  licenseWork,
  setLicenseWork,
  creators,
  setCreators
}) => {
  const [validTitle, setValidTitle] = React.useState<ValidatedOptions>();
  const [validLicense, setValidLicense] = React.useState<ValidatedOptions>();
  const [validCreators, setValidCreators] = React.useState<ValidatedOptions>();

  useEffect(() => {
    setValidTitle(ValidatedOptions.default);
    setValidLicense(ValidatedOptions.default);
    setValidCreators(ValidatedOptions.default);
  }, [reset]);

  useEffect(() => {
    if (isEditForm) {
      setValidTitle(ValidatedOptions.success);
      setValidLicense(ValidatedOptions.success);
      setValidCreators(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateTitle = (title: string) => {
    if (title.length > 0) {
      setValidTitle(ValidatedOptions.success);
      setDisableAction(!checkSkillFormCompletion(skillFormData));
      return;
    }
    setDisableAction(true);
    setValidTitle(ValidatedOptions.error);
    return;
  };

  const validateLicense = (license: string) => {
    if (license.length > 0) {
      setValidLicense(ValidatedOptions.success);
      setDisableAction(!checkSkillFormCompletion(skillFormData));
      return;
    }
    setDisableAction(true);
    setValidLicense(ValidatedOptions.error);
    return;
  };

  const validateCreators = (creators: string) => {
    if (creators.length > 0) {
      setValidCreators(ValidatedOptions.success);
      setDisableAction(!checkSkillFormCompletion(skillFormData));
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
                Attribution Info <span style={{ color: 'red' }}>*</span>
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
