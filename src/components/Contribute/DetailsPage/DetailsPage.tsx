import React, { useEffect } from 'react';
import { Flex, FlexItem, Form, FormGroup, HelperText, HelperTextItem, TextArea, ValidatedOptions } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import PathService from '@/components/PathService/PathService';
import FormSectionHeader from '@/components/Common/FormSectionHeader';
import { MAX_SUMMARY_CHARS } from '@/components/Contribute/Utils/validationUtils';

interface Props {
  infoSectionHelp?: React.ReactNode;
  isEditForm?: boolean;
  email: string;
  setEmail: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  submissionSummary: string;
  setSubmissionSummary: (val: string) => void;
  submissionSummaryPlaceholder: string;
  rootPath: string;
  filePath: string;
  setFilePath: (val: string) => void;
}
const DetailsPage: React.FC<Props> = ({
  infoSectionHelp,
  isEditForm,
  submissionSummary,
  setSubmissionSummary,
  submissionSummaryPlaceholder,
  rootPath,
  filePath,
  setFilePath
}) => {
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
        <FormSectionHeader
          title="Contribution information"
          description="Provide a brief summary of your contribution, and the directory path for your reference documents."
          helpInfo={infoSectionHelp}
        />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup fieldId="submission_summary" label="Contribution summary" isRequired>
            <TextArea
              id="submission_summary"
              isRequired
              maxLength={MAX_SUMMARY_CHARS}
              resizeOrientation="vertical"
              type="text"
              aria-label="submission_summary"
              placeholder={submissionSummaryPlaceholder}
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
                {!isSummaryInvalid || submissionSummary.trim().length ? (
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
              helperText={`Specify the file path for the question-and-answer (Q and A) files. `}
            />
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default DetailsPage;
