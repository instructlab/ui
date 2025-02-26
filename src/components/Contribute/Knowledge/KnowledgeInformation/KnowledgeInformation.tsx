import React, { useEffect } from 'react';
import { ValidatedOptions, Form, FormGroup, TextInput, HelperText, HelperTextItem, TextArea, FlexItem, Flex } from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import PageHeader from '@/components/Contribute/PageHeader';

interface Props {
  isEditForm?: boolean;
  submissionSummary: string;
  setSubmissionSummary: (val: string) => void;
  domain: string;
  setDomain: (val: string) => void;
  documentOutline: string;
  setDocumentOutline: (val: string) => void;
}

const KnowledgeInformation: React.FC<Props> = ({
  isEditForm,
  submissionSummary,
  setSubmissionSummary,
  domain,
  setDomain,
  documentOutline,
  setDocumentOutline
}) => {
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

  const validateDescription = (desc: string) => {
    const description = desc.trim();
    setValidDescription(description.length > 0 && description.length <= 60 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateDomain = (dom: string) => {
    const domain = dom.trim();
    setValidDomain(domain.length > 0 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  const validateOutline = (ol: string) => {
    const outline = ol.trim();
    setValidOutline(outline.length >= 40 ? ValidatedOptions.success : ValidatedOptions.error);
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <PageHeader title="Knowledge Information" description="Provide brief information about the knowledge." />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup key={'knowledge-info-details-submission_summary'} label="Submission summary" isRequired>
            <TextInput
              isRequired
              type="text"
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
                  Required field and must be less than 60 characters. {60 - submissionSummary.trim().length} characters remaining
                </HelperTextItem>
              </HelperText>
            )}
          </FormGroup>
          <FormGroup key={'knowledge-info-details-domain'} label="Domain" isRequired>
            <TextInput
              isRequired
              type="text"
              aria-label="domain"
              placeholder="Enter domain information"
              value={domain}
              validated={validDomain}
              onChange={(_event, value) => setDomain(value)}
              onBlur={() => validateDomain(domain)}
            />
            {validDomain === ValidatedOptions.error && (
              <HelperText>
                <HelperTextItem icon={<ExclamationCircleIcon />} variant={validDomain}>
                  Required field
                </HelperTextItem>
              </HelperText>
            )}
          </FormGroup>
          <FormGroup key={'knowledge-info-details-document_outline'} label="Document outline" isRequired>
            <TextArea
              isRequired
              type="text"
              aria-label="document_outline"
              placeholder="Enter a detailed document outline (min 40 characters)"
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

export default KnowledgeInformation;
