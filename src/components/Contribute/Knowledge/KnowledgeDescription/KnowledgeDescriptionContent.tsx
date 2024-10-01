import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

const KnowledgeDescriptionContent: React.FunctionComponent = () => {
  return (
    <div>
      <p>
        <b>
          <br />
          Knowledge in InstructLab is represented by question and answer pairs that involve facts, data, or references. This knowledge is represented
          in the taxonomy tree and each node of this tree contains a qna.yaml file.
        </b>
        <a href="https://docs.instructlab.ai/taxonomy/knowledge/guide/#what-is-knowledge" target="_blank" rel="noopener noreferrer">
          <Button variant="link" aria-label="Learn more about what Knowledge is in InstructLab">
            Learn more about knowledge
            <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
          </Button>
        </a>
        <a href="https://docs.instructlab.ai/taxonomy/knowledge/" target="_blank" rel="noopener noreferrer">
          <Button variant="link" aria-label="Getting started with InstructLab knowledge contribution">
            Getting started with knowledge contribution
            <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
          </Button>
        </a>
      </p>
    </div>
  );
};

export default KnowledgeDescriptionContent;
