import React, { useEffect } from 'react';
import {
  Button,
  Content,
  Flex,
  FlexItem,
  Form,
  FormGroup,
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
import EditContributorModal from '@/components/Contribute/DetailsPage/EditContributorModal';

const MAX_SUMMARY_CHARS = 256;

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

  const isDescriptionInvalid = validSummary === ValidatedOptions.error && submissionSummary.trim().length > MAX_SUMMARY_CHARS;

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader title="Details" />
      </FlexItem>
      <FlexItem>
        <Flex gap={{ default: 'gapXl' }} direction={{ default: 'column' }}>
          <FlexItem>
            <WizardSectionHeader
              title="Contributor information"
              helpInfo="Use your GitHub account email address and full name. This will make sure that this contribution and the data with it is properly
                    signed off and credited to you."
              description="Information required for a GitHub Developer Certificate of Origin (DCO) sign-off."
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
              >
                <Content>{name}</Content>
                <Content>{email}</Content>
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
            <WizardSectionHeader title={infoSectionTitle} helpInfo={infoSectionHelp} description={infoSectionDescription} />
            <Form>
              <FormGroup fieldId="submission_summary" label="Submission summary" isRequired>
                <TextArea
                  id="submission_summary"
                  isRequired
                  resizeOrientation="vertical"
                  type="text"
                  aria-label="submission_summary"
                  placeholder="Example: Information about the Phoenix Constellation including the history, characteristics, and features of the stars in the constellation."
                  value={submissionSummary}
                  validated={isDescriptionInvalid ? ValidatedOptions.error : ValidatedOptions.default}
                  onChange={(_event, value) => setSubmissionSummary(value)}
                  onBlur={() => validateSummary(submissionSummary)}
                />
                <HelperText>
                  <HelperTextItem
                    icon={isDescriptionInvalid ? <ExclamationCircleIcon /> : undefined}
                    variant={isDescriptionInvalid ? ValidatedOptions.error : ValidatedOptions.default}
                  >
                    Must be {MAX_SUMMARY_CHARS} characters or less.{submissionSummary.trim().length ? ` ${MAX_SUMMARY_CHARS - submissionSummary.trim().length}/${MAX_SUMMARY_CHARS} characters` : ''}
                  </HelperTextItem>
                </HelperText>
              </FormGroup>
              <FormGroup fieldId="directory-path" label="Directory path" isRequired>
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
      </FlexItem>
    </Flex>
  );
};

export default DetailsPage;
