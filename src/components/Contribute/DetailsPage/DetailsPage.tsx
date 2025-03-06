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
  TextArea,
  TextInput,
  ValidatedOptions
} from '@patternfly/react-core';
import { CheckIcon, ExclamationCircleIcon, PencilAltIcon, TimesIcon } from '@patternfly/react-icons';
import { t_global_icon_color_status_success_default as SuccessColor, t_global_spacer_sm as SmallSpacerSize } from '@patternfly/react-tokens';
import PathService from '@/components/PathService/PathService';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import WizardSectionHeader from '@/components/Common/WizardSectionHeader';

interface Props {
  isGithubMode: boolean;
  infoSectionTitle: string;
  infoSectionHelp?: React.ReactNode;
  infoSectionDescription?: string;
  isEditForm?: boolean;
  email: string;
  setEmail: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  submissionSummary: string;
  setSubmissionSummary: (val: string) => void;
  domain?: string;
  setDomain?: (val: string) => void;
  documentOutline: string;
  setDocumentOutline: (val: string) => void;
  rootPath: string;
  filePath: string;
  setFilePath: (val: string) => void;
}
const DetailsPage: React.FC<Props> = ({
  isGithubMode,
  infoSectionTitle,
  infoSectionHelp,
  infoSectionDescription,
  isEditForm,
  email,
  setEmail,
  name,
  setName,
  submissionSummary,
  setSubmissionSummary,
  domain,
  setDomain,
  documentOutline,
  setDocumentOutline,
  rootPath,
  filePath,
  setFilePath
}) => {
  const [editContributorOpen, setEditContributorOpen] = React.useState<boolean>();
  const [updatedEmail, setUpdatedEmail] = React.useState<string>(email);
  const [updatedName, setUpdatedName] = React.useState<string>(name);
  const [validEmail, setValidEmail] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validName, setValidName] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validEmailError, setValidEmailError] = React.useState('Required Field');
  const [validDescription, setValidDescription] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validDomain, setValidDomain] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [validOutline, setValidOutline] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  useEffect(() => {
    if (isEditForm) {
      setValidDescription(ValidatedOptions.success);
      setValidDomain(ValidatedOptions.success);
      setValidOutline(ValidatedOptions.success);
    }
  }, [isEditForm]);

  useEffect(() => {
    setUpdatedEmail(email);
  }, [email]);

  const validateEmail = () => {
    const emailStr = updatedEmail.trim();
    const re = /\S+@\S+\.\S+/;
    if (re.test(emailStr)) {
      setValidEmail(ValidatedOptions.success);
      setValidEmailError('');
      return;
    }
    setValidEmail(ValidatedOptions.error);
    setValidEmailError(emailStr ? 'Please enter a valid email address.' : 'Required field');
  };

  useEffect(() => {
    setUpdatedName(name);
  }, [name]);

  const validateName = () => {
    setValidName(updatedName.trim().length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateDescription = (desc: string) => {
    const description = desc.trim();
    setValidDescription(description.length > 0 && description.length <= 60 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const isDescriptionInvalid = validDescription === ValidatedOptions.error && submissionSummary.length > 60;

  const validateDomain = (dom: string) => {
    const domain = dom.trim();
    setValidDomain(domain.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateOutline = (ol: string) => {
    const outline = ol.trim();
    setValidOutline(outline.length >= 40 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const isOutlineInvalid = validOutline === ValidatedOptions.error && documentOutline.length < 40;

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader title="Details" />
      </FlexItem>
      <FlexItem>
        <WizardSectionHeader
          title="Contributor information"
          helpInfo="Use your GitHub account email address and full name. This will make sure that this contribution and the data with it is properly
                signed off and credited to you."
          description="Information required for a GitHub Developer Certificate of Origin (DCO) sign-off."
        />
        {editContributorOpen ? (
          <Flex gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem flex={{ default: 'flex_1' }}>
              <Form>
                <Flex gap={{ default: 'gapLg' }}>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup isRequired key={'author-info-details-name'} label="Contributor name">
                      <TextInput
                        isRequired
                        type="text"
                        aria-label="name"
                        value={updatedName}
                        validated={validName}
                        onChange={(_event, value) => setName(value)}
                        onBlur={validateName}
                      />
                      {validName === ValidatedOptions.error ? (
                        <FormHelperText>
                          <HelperText>
                            <HelperTextItem icon={<ExclamationCircleIcon />} variant={validName}>
                              Required field
                            </HelperTextItem>
                          </HelperText>
                        </FormHelperText>
                      ) : (
                        <FormHelperText>
                          <HelperText>
                            <HelperTextItem variant="default">Please provide your full name.</HelperTextItem>
                          </HelperText>
                        </FormHelperText>
                      )}
                    </FormGroup>
                  </FlexItem>
                  <FlexItem flex={{ default: 'flex_1' }}>
                    <FormGroup isRequired key={'author-info-details-email'} label="Email">
                      <TextInput
                        isRequired
                        type="email"
                        aria-label="email"
                        placeholder="name@example.com"
                        value={updatedEmail}
                        validated={validEmail}
                        onChange={(_event, value) => {
                          setEmail(value);
                        }}
                        onBlur={validateEmail}
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
                  </FlexItem>
                </Flex>
              </Form>
            </FlexItem>
            <FlexItem>
              <Button
                aria-label="Accept"
                isInline
                variant="link"
                icon={<CheckIcon style={{ color: SuccessColor.var }} />}
                isDisabled={validName === ValidatedOptions.error || validEmail === ValidatedOptions.error}
                onClick={() => {
                  setEmail(updatedEmail);
                  setName(updatedName);
                  setEditContributorOpen(false);
                }}
              />
            </FlexItem>
            <FlexItem>
              <Button
                aria-label="Cancel"
                isInline
                variant="link"
                icon={<TimesIcon />}
                onClick={() => {
                  setUpdatedEmail(email);
                  setUpdatedName(name);
                  setEditContributorOpen(false);
                }}
              />
            </FlexItem>
          </Flex>
        ) : (
          <Form>
            <FormGroup
              key="author-info-details-name"
              label={
                <>
                  <span style={{ marginRight: SmallSpacerSize.var }}>Contributor</span>
                  <Button isInline variant="link" icon={<PencilAltIcon />} onClick={() => setEditContributorOpen(true)} />
                </>
              }
            >
              <Content>{name}</Content>
              <Content>{email}</Content>
            </FormGroup>
          </Form>
        )}
      </FlexItem>
      <FlexItem>
        <WizardSectionHeader title={infoSectionTitle} helpInfo={infoSectionHelp} description={infoSectionDescription} />
        <Form>
          <FormGroup fieldId="submission_summary" label="Submission summary" isRequired>
            <TextInput
              id="submission_summary"
              isRequired
              type="text"
              aria-label="submission_summary"
              placeholder="Enter a brief description for a submission summary (60 character max)"
              value={submissionSummary}
              validated={isDescriptionInvalid ? ValidatedOptions.error : ValidatedOptions.default}
              onChange={(_event, value) => setSubmissionSummary(value)}
              onBlur={() => validateDescription(submissionSummary)}
            />
            <HelperText>
              <HelperTextItem
                icon={isDescriptionInvalid ? <ExclamationCircleIcon /> : undefined}
                variant={isDescriptionInvalid ? ValidatedOptions.error : ValidatedOptions.default}
              >
                Must be less than 60 characters. {60 - submissionSummary.trim().length} characters remaining
              </HelperTextItem>
            </HelperText>
          </FormGroup>
          {setDomain ? (
            <FormGroup key={'knowledge-info-details-domain'} label="Domain" isRequired>
              <TextInput
                isRequired
                type="text"
                aria-label="domain"
                placeholder="Enter domain information"
                value={domain}
                validated={validDomain}
                onChange={(_event, value) => setDomain(value)}
                onBlur={() => validateDomain(domain || '')}
              />
              {validDomain === ValidatedOptions.error && (
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={validDomain}>
                    Required field
                  </HelperTextItem>
                </HelperText>
              )}
            </FormGroup>
          ) : null}
          <FormGroup key={'knowledge-info-details-document_outline'} label="Document outline" isRequired>
            <TextArea
              isRequired
              type="text"
              aria-label="document_outline"
              placeholder="Enter a detailed document outline (min 40 characters)"
              value={documentOutline}
              validated={isOutlineInvalid ? ValidatedOptions.error : ValidatedOptions.default}
              onChange={(_event, value) => setDocumentOutline(value)}
              minLength={40}
              onBlur={() => validateOutline(documentOutline)}
            />
            <HelperText>
              <HelperTextItem
                icon={isOutlineInvalid ? <ExclamationCircleIcon /> : undefined}
                variant={isOutlineInvalid ? ValidatedOptions.error : ValidatedOptions.default}
              >
                Required field and must be at least 40 characters.{' '}
                {40 - documentOutline.trim().length > 0 ? 40 - documentOutline.trim().length + ' more to go.' : ''}
              </HelperTextItem>
            </HelperText>
          </FormGroup>
          <FormGroup fieldId="directory-path" label="Directory Path" isRequired>
            <PathService
              rootPath={rootPath}
              path={filePath}
              handlePathChange={setFilePath}
              helperText={`Specify the file path for the QnA${isGithubMode ? ' and Attribution' : ''} files.`}
            />
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default DetailsPage;
