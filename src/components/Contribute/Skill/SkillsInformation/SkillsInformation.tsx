import React, { useEffect } from 'react';
import { ValidatedOptions, Form, FormGroup, TextInput, HelperText, HelperTextItem, TextArea, Flex, FlexItem } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import PageHeader from '@/components/Contribute/PageHeader';

interface Props {
  isEditForm?: boolean;
  submissionSummary: string;
  setSubmissionSummary: (val: string) => void;
  documentOutline: string;
  setDocumentOutline: (val: string) => void;
}

const SkillsInformation: React.FC<Props> = ({ isEditForm, submissionSummary, setSubmissionSummary, documentOutline, setDocumentOutline }) => {
  const [validDescription, setValidDescription] = React.useState<ValidatedOptions>();
  const [validOutline, setValidOutline] = React.useState<ValidatedOptions>();

  useEffect(() => {
    if (isEditForm) {
      setValidDescription(ValidatedOptions.success);
      setValidOutline(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateDescription = (desc: string) => {
    const description = desc.trim();
    setValidDescription(description.length > 0 && description.length <= 60 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateOutline = (ol: string) => {
    const outline = ol.trim();
    setValidOutline(outline.length >= 40 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <PageHeader title="Skill Information" description="Provide brief information about the Skills." />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup isRequired fieldId="skills-info-details-submission_summary" label="Submission summary">
            <TextInput
              isRequired
              type="text"
              id="skills-info-details-submission_summary"
              aria-label="submission_summary"
              placeholder="Enter a brief description for a submission summary (60 character max)"
              value={submissionSummary}
              validated={validDescription}
              onChange={(_event, value) => setSubmissionSummary(value)}
              onBlur={() => validateDescription(submissionSummary)}
              maxLength={60}
            />
            {validDescription === ValidatedOptions.error && (
              <HelperText>
                <HelperTextItem icon={<ExclamationCircleIcon />} variant={validDescription}>
                  Required field. Must be less than 60 characters. {60 - submissionSummary.trim().length} characters remaining
                </HelperTextItem>
              </HelperText>
            )}
          </FormGroup>
          <FormGroup isRequired fieldId="skills-info-details-document_outline" label="Document Outline">
            <TextArea
              id="skills-info-details-document_outline"
              isRequired
              type="text"
              aria-label="document_outline"
              placeholder="Enter a detailed description to improve the teacher model's responses (min 40 characters)"
              value={documentOutline}
              validated={validOutline}
              onChange={(_event, value) => setDocumentOutline(value)}
              minLength={40}
              onBlur={() => validateOutline(documentOutline)}
            />
            {validOutline === ValidatedOptions.error && (
              <HelperText>
                <HelperTextItem icon={<ExclamationCircleIcon />} variant={validOutline}>
                  Required field and must be at least 40 characters.{' '}
                  {40 - documentOutline.trim().length > 0 ? 40 - documentOutline.trim().length + 'more to go.' : ''}
                </HelperTextItem>
              </HelperText>
            )}
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default SkillsInformation;
