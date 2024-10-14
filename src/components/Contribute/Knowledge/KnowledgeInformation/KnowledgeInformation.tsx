import React, { useEffect } from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
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
  submissionSummary: string;
  setSubmissionSummary: React.Dispatch<React.SetStateAction<string>>;
  domain: string;
  setDomain: React.Dispatch<React.SetStateAction<string>>;
  documentOutline: string;
  setDocumentOutline: React.Dispatch<React.SetStateAction<string>>;
}

const KnowledgeInformation: React.FC<Props> = ({
  reset,
  isEditForm,
  knowledgeFormData,
  setDisableAction,
  submissionSummary,
  setSubmissionSummary,
  domain,
  setDomain,
  documentOutline,
  setDocumentOutline
}) => {
  const [validDescription, setValidDescription] = React.useState<ValidatedOptions>();
  const [validDomain, setValidDomain] = React.useState<ValidatedOptions>();
  const [validOutline, setValidOutline] = React.useState<ValidatedOptions>();

  useEffect(() => {
    setValidDescription(ValidatedOptions.default);
    setValidDomain(ValidatedOptions.default);
    setValidOutline(ValidatedOptions.default);
  }, [reset]);

  useEffect(() => {
    if (isEditForm) {
      setValidDescription(ValidatedOptions.success);
      setValidDomain(ValidatedOptions.success);
      setValidOutline(ValidatedOptions.success);
    }
  }, [isEditForm]);

  const validateDescription = (description: string) => {
    if (description.length > 0 && description.length < 60) {
      setValidDescription(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidDescription(ValidatedOptions.error);
    return;
  };

  const validateDomain = (domain: string) => {
    if (domain.length > 0) {
      setValidDomain(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidDomain(ValidatedOptions.error);
    return;
  };

  const validateOutline = (outline: string) => {
    if (outline.length > 40) {
      setValidOutline(ValidatedOptions.success);
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return;
    }
    setDisableAction(true);
    setValidOutline(ValidatedOptions.error);
    return;
  };

  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                Knowledge Information <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'knowledge-info-id'
          }}
          titleDescription="Provide brief information about the knowledge."
        />
      }
    >
      <FormGroup key={'knowledge-info-details-submission_summary'} label="Submission summary">
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
              Required field
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>
      <FormGroup key={'knowledge-info-details-domain'} label="Domain">
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
      <FormGroup key={'knowledge-info-details-document_outline'} label="Document outline">
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
              Required field
            </HelperTextItem>
          </HelperText>
        )}
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default KnowledgeInformation;
