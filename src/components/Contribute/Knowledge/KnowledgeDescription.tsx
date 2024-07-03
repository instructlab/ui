import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

const KnowledgeDescription: React.FunctionComponent = () => {
  return (
    <div>
      <p>
        Knowledge in InstructLab is represented by question and answer pairs that involve facts, data, or references. This knowledge is represented in
        the taxonomy tree and each node of this tree contains a qna.yaml file.
      </p>
      <div>
        <a href="https://github.com/instructlab/taxonomy/blob/main/docs/KNOWLEDGE_GUIDE.md" target="_blank">
          <Button variant="plain" aria-label="Learn more about what InstructLab Knowledge is">
            Learn More
            <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
          </Button>
        </a>
      </div>
    </div>
  );
};

export default KnowledgeDescription;
