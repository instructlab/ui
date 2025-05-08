// src/components/Contribute/Skill/View/ViewSkillSeedExample.tsx
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionToggle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm
} from '@patternfly/react-core';
import { t_global_spacer_sm as SmSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_sm';
import { SkillSeedExample } from '@/types';

interface Props {
  seedExample: SkillSeedExample;
  index: number;
}

const ViewSkillSeedExample: React.FC<Props> = ({ seedExample, index }) => {
  const [expanded, setExpanded] = React.useState<boolean>(false);

  return (
    <Accordion asDefinitionList={false}>
      <AccordionItem isExpanded={expanded} key={`accordion-item-${index}`}>
        <AccordionToggle onClick={() => setExpanded((prev) => !prev)} id={`seed-example-toggle-${index}`}>
          Sample {index + 1}
        </AccordionToggle>
        <AccordionContent id={`seed-example-content-${index}`} style={{ padding: SmSpacerSize.var }}>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Question</DescriptionListTerm>
              <DescriptionListDescription>{seedExample.questionAndAnswer.question}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Answer</DescriptionListTerm>
              <DescriptionListDescription>{seedExample.questionAndAnswer.answer}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Context</DescriptionListTerm>
              <DescriptionListDescription>{seedExample.context}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ViewSkillSeedExample;
