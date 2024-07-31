import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';

interface Props {
  submissionSummary: string | undefined;
  setSubmissionSummary: React.Dispatch<React.SetStateAction<string | undefined>>;
  domain: string | undefined;
  setDomain: React.Dispatch<React.SetStateAction<string | undefined>>;
  documentOutline: string | undefined;
  setDocumentOutline: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const KnowledgeInformation: React.FC<Props> = ({
  submissionSummary,
  setSubmissionSummary,
  domain,
  setDomain,
  documentOutline,
  setDocumentOutline
}) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{ text: 'Knowledge Info', id: 'knowledge-info-id' }}
          titleDescription="Provide brief information about the knowledge."
        />
      }
    >
      <FormGroup key={'knowledge-info-details-id'}>
        <TextInput
          isRequired
          type="text"
          aria-label="submission_summary"
          placeholder="Enter a brief description for a submission summary (60 character max)"
          value={submissionSummary}
          onChange={(_event, value) => setSubmissionSummary(value)}
          maxLength={60}
        />
        <TextInput
          isRequired
          type="text"
          aria-label="domain"
          placeholder="Enter domain information"
          value={domain}
          onChange={(_event, value) => setDomain(value)}
        />
        <TextArea
          isRequired
          type="text"
          aria-label="document_outline"
          placeholder="Enter a detailed document outline (min 40 characters)"
          value={documentOutline}
          onChange={(_event, value) => setDocumentOutline(value)}
          minLength={40}
        />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default KnowledgeInformation;
