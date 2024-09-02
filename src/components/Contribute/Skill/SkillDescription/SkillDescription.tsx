import React from 'react';
import SkillDescriptionContent from './SkillDescriptionContent';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';

const SkillDescription: React.FC = () => {
  return (
    <FormFieldGroupExpandable
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader titleText={{ text: 'Skills Description', id: 'skills-description' }} titleDescription="What are InstructLab Skills?" />
      }
    >
      <SkillDescriptionContent />
    </FormFieldGroupExpandable>
  );
};

export default SkillDescription;
