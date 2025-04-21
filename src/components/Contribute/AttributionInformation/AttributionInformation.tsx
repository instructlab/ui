import React, { useEffect } from 'react';
import { ContributionFormData } from '@/types';
import { ValidatedOptions, FormGroup, TextInput, FormHelperText, HelperText, HelperTextItem, FlexItem, Flex, Form } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import WizardFormGroupLabelHelp from '@/components/Common/WizardFormGroupLabelHelp';

interface Props {
  isEditForm?: boolean;
  contributionFormData: ContributionFormData;
  titleWork: string;
  setTitleWork: (val: string) => void;
  linkWork?: string;
  setLinkWork?: (val: string) => void;
  revision?: string;
  setRevision?: (val: string) => void;
  licenseWork: string;
  setLicenseWork: (val: string) => void;
  creators: string;
  setCreators: (val: string) => void;
}

const AttributionInformation: React.FC<Props> = ({
  isEditForm,
  titleWork,
  setTitleWork,
  linkWork = '',
  setLinkWork,
  revision = '',
  setRevision,
  licenseWork,
  setLicenseWork,
  creators,
  setCreators
}) => {
  const [validTitle, setValidTitle] = React.useState<ValidatedOptions>();
  const [validLink, setValidLink] = React.useState<ValidatedOptions>();
  const [validLicense, setValidLicense] = React.useState<ValidatedOptions>();
  const [validCreators, setValidCreators] = React.useState<ValidatedOptions>();

  useEffect(() => {
    if (!isEditForm) {
      return;
    }
    setValidTitle(ValidatedOptions.success);
    setValidLink(ValidatedOptions.success);
    setValidLicense(ValidatedOptions.success);
    setValidCreators(ValidatedOptions.success);
  }, [isEditForm]);

  const validateTitle = (titleStr: string) => {
    const title = titleStr.trim();
    if (title.length > 0) {
      setValidTitle(ValidatedOptions.success);
      return;
    }
    setValidTitle(ValidatedOptions.error);
    return;
  };

  const validateLink = (linkStr: string) => {
    const link = linkStr.trim();
    if (link.length === 0) {
      setValidLink(ValidatedOptions.error);
      return;
    }
    try {
      new URL(link);
      setValidLink(ValidatedOptions.success);
    } catch (e) {
      setValidLink(ValidatedOptions.warning);
    }
  };

  const validateLicense = (licenseStr: string) => {
    const license = licenseStr.trim();
    setValidLicense(license.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateCreators = (creatorsStr: string) => {
    const creators = creatorsStr.trim();
    setValidCreators(creators.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader
          title="Source attribution"
          description="Provide source details of the seed data to ensure its creators are properly credited."
        />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup
            isRequired
            key={'attribution-info-details-title_work'}
            label="Resource title"
            labelHelp={<WizardFormGroupLabelHelp bodyContent="The resource title is the title of the source document. " />}
          >
            <TextInput
              isRequired
              type="text"
              aria-label="title_work"
              validated={validTitle}
              value={titleWork}
              onChange={(_event, value) => setTitleWork(value)}
              onBlur={() => validateTitle(titleWork)}
            />
            {validTitle === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validTitle}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          {setLinkWork ? (
            <FormGroup
              isRequired
              key={'attribution-info-details-work_link'}
              label="Resource link"
              labelHelp={<WizardFormGroupLabelHelp bodyContent="The resource link is a direct link to the source document." />}
            >
              <TextInput
                isRequired
                type="url"
                aria-label="link_work"
                validated={validLink}
                value={linkWork}
                onChange={(_event, value) => setLinkWork(value)}
                onBlur={() => validateLink(linkWork)}
              />
              {validLink === ValidatedOptions.error && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLink}>
                      Required field
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
            </FormGroup>
          ) : null}
          {setRevision ? (
            <FormGroup key={'attribution-info-details-document_revision'} label="Revision">
              <TextInput type="text" aria-label="revision" value={revision} onChange={(_event, value) => setRevision(value)} />
            </FormGroup>
          ) : null}
          <FormGroup
            isRequired
            key={'attribution-info-details-license'}
            label="Resource license"
            labelHelp={
              <WizardFormGroupLabelHelp bodyContent="The resource license is the license type of the source document. This is usually a Creative Commons (CC) license, such as CC BY or CC BY-SA." />
            }
          >
            <TextInput
              isRequired
              type="text"
              aria-label="license_work"
              validated={validLicense}
              value={licenseWork}
              onChange={(_event, value) => setLicenseWork(value)}
              onBlur={() => validateLicense(licenseWork)}
            />
            {validLicense === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validLicense}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
          <FormGroup isRequired key={'attribution-info-details-creators'} label="Authors">
            <TextInput
              isRequired
              type="text"
              aria-label="author"
              validated={validCreators}
              value={creators}
              onChange={(_event, value) => setCreators(value)}
              onBlur={() => validateCreators(creators)}
            />
            <FormHelperText>
              <HelperText>
                {validCreators === ValidatedOptions.error ? (
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validCreators}>
                    Required field
                  </HelperTextItem>
                ) : (
                  <HelperTextItem>If listing more than 1 author, separate the names using commas.</HelperTextItem>
                )}
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default AttributionInformation;
