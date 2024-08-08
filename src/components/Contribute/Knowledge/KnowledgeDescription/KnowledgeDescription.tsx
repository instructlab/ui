import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import KnowledgeDescriptionContent from './KnowledgeDescriptionContent';

const KnowledgeDescription: React.FC = () => {
  return (
    <FormFieldGroupExpandable
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{ text: 'Knowledge Description', id: 'knowledge-description' }}
          titleDescription="What is InstructLab Knowledge?"
        />
      }
    >
      <KnowledgeDescriptionContent />
    </FormFieldGroupExpandable>
  );
};

export default KnowledgeDescription;
