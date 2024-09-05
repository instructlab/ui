import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';

const SkillsDescriptionContent: React.FunctionComponent = () => {
  return (
    <div>
      <b>
        <br />
        <p>
          Skills are performative. When you create a skill for the model, you are teaching it how to do something: &quot;write me a song,&quot;
          &quot;rearrange words in a sentence&quot; or &quot;summarize an email.&quot;
          <a href="https://docs.instructlab.ai/taxonomy/skills/skills_guide/#what-is-a-skill" target="_blank" rel="noopener noreferrer">
            <Button variant="link" aria-label="Learn more about what Skills are in InstructLab">
              Learn more about skills
              <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
            </Button>
          </a>
          <a href="https://docs.instructlab.ai/taxonomy/skills/" target="_blank" rel="noopener noreferrer">
            <Button variant="link" aria-label="Learn more about what Skills are in InstructLab">
              Getting started with skills contribution
              <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
            </Button>
          </a>
        </p>
      </b>
    </div>
  );
};

export default SkillsDescriptionContent;
