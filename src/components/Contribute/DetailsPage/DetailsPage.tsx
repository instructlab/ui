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
  ValidatedOptions
} from '@patternfly/react-core';
import { ExclamationCircleIcon, PencilAltIcon } from '@patternfly/react-icons';
import {
  t_global_spacer_sm as SmallSpacerSize,
  t_global_font_size_xs as XsFontSize,
  t_global_icon_color_subtle as SubtleIconColor
} from '@patternfly/react-tokens';
import PathService from '@/components/PathService/PathService';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import WizardSectionHeader from '@/components/Common/WizardSectionHeader';
import { MAX_SUMMARY_CHARS } from '@/components/Contribute/Utils/validationUtils';
import EditContributorModal from '@/components/Contribute/DetailsPage/EditContributorModal';

interface Props {
  isGithubMode: boolean;
  infoSectionHelp?: React.ReactNode;
  isEditForm?: boolean;
  email: string;
  setEmail: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  submissionSummary: string;
  setSubmissionSummary: (val: string) => void;
  rootPath: string;
  filePath: string;
  setFilePath: (val: string) => void;
}
const DetailsPage: React.FC<Props> = ({
  isGithubMode,
  infoSectionHelp,
  isEditForm,
  email,
  setEmail,
  name,
  setName,
  submissionSummary,
  setSubmissionSummary,
  rootPath,
  filePath,
  setFilePath
}) => {
  const [editContributorOpen, setEditContributorOpen] = React.useState<boolean>();
  const [validSummary, setValidSummary] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  useEffect(() => {
    if (isEditForm) {
      setValidSummary(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateSummary = (summaryStr: string) => {
    const summary = summaryStr.trim();
    setValidSummary(summary.length > 0 && summary.length <= MAX_SUMMARY_CHARS ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const isSummaryInvalid =
    validSummary === ValidatedOptions.error && (submissionSummary.trim().length > MAX_SUMMARY_CHARS || submissionSummary.trim().length === 0);

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader title="Details" />
      </FlexItem>
      <FlexItem>
        <Flex gap={{ default: 'gapXl' }} direction={{ default: 'column' }}>
          <FlexItem>
            <WizardSectionHeader
              title="Contributor details"
              description="Provide the name and email associated with your GitHub account. This information required for a GitHub Developer Certificate of Origin (DCO) sign-off."
            />
            <Form>
              <FormGroup
                key="author-info-details-name"
                label={
                  <>
                    <span style={{ marginRight: SmallSpacerSize.var }}>Contributor</span>
                    <Button isInline variant="link" onClick={() => setEditContributorOpen(true)}>
                      <PencilAltIcon style={{ fontSize: XsFontSize.var, color: SubtleIconColor.var }} />
                    </Button>
                  </>
                }
                isRequired
              >
                <Content>{name}</Content>
                <Content>{email}</Content>
                {!name || !email ? (
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem variant={ValidatedOptions.error}>Name and email are required</HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                ) : null}
              </FormGroup>
              {editContributorOpen ? (
                <EditContributorModal
                  name={name}
                  email={email}
                  onSave={(name, email) => {
                    setName(name);
                    setEmail(email);
                    setEditContributorOpen(false);
                  }}
                  onClose={() => setEditContributorOpen(false)}
                />
              ) : null}
            </Form>
          </FlexItem>
          <FlexItem>
            <WizardSectionHeader
              title="Contribution information"
              helpInfo={infoSectionHelp}
              description="Provide a brief summary of your contribution, and the directory path for your reference documents."
            />
            <Form>
              <FormGroup fieldId="submission_summary" label="Contribution summary" isRequired>
                <TextArea
                  id="submission_summary"
                  isRequired
                  maxLength={MAX_SUMMARY_CHARS}
                  resizeOrientation="vertical"
                  type="text"
                  aria-label="submission_summary"
                  placeholder="Example: Information about the Phoenix Constellation including the history, characteristics, and features of the stars in the constellation."
                  value={submissionSummary}
                  validated={isSummaryInvalid ? ValidatedOptions.error : ValidatedOptions.default}
                  onChange={(_event, value) => setSubmissionSummary(value)}
                  onBlur={() => validateSummary(submissionSummary)}
                />
                <HelperText>
                  <HelperTextItem
                    icon={isSummaryInvalid ? <ExclamationCircleIcon /> : undefined}
                    variant={isSummaryInvalid ? ValidatedOptions.error : ValidatedOptions.default}
                  >
                    {submissionSummary.trim().length ? (
                      <>
                        Must be {MAX_SUMMARY_CHARS} characters or less.
                        {validSummary === ValidatedOptions.error && isSummaryInvalid
                          ? ` ${submissionSummary.trim().length}/${MAX_SUMMARY_CHARS} characters`
                          : ''}
                      </>
                    ) : (
                      'Required field'
                    )}
                  </HelperTextItem>
                </HelperText>
              </FormGroup>
              <FormGroup fieldId="directory-path" label="Directory path" isRequired>
                <PathService
                  rootPath={rootPath}
                  path={filePath}
                  handlePathChange={setFilePath}
                  helperText={`Specify the file path for the question-and-answer (Q and A)${isGithubMode ? ' and attribution' : ''} files. `}
                  isGithubMode={isGithubMode}
                />
              </FormGroup>
            </Form>
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default DetailsPage;
