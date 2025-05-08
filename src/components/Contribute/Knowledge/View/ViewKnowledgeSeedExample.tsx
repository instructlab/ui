// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
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
import type { KnowledgeSeedExample } from '@/types';
import { t_global_spacer_sm as SmSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_sm';
import { getSeedExampleTitle } from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeSeedExamples/utils';

interface Props {
  seedExample: KnowledgeSeedExample;
  index: number;
}

const ViewKnowledgeSeedExample: React.FC<Props> = ({ seedExample, index }) => {
  const [expanded, setExpanded] = React.useState<boolean>(false);

  return (
    <Accordion asDefinitionList={false}>
      <AccordionItem isExpanded={expanded}>
        <AccordionToggle onClick={() => setExpanded((prev) => !prev)} id={`seed-example-toggle-${index}`}>
          {getSeedExampleTitle(seedExample, index)}
        </AccordionToggle>
        <AccordionContent id={`seed-example-content-${index}`} style={{ padding: SmSpacerSize.var }}>
          <DescriptionList isCompact>
            <DescriptionListGroup>
              <DescriptionListTerm>Context</DescriptionListTerm>
              <DescriptionListDescription>{seedExample.context}</DescriptionListDescription>
            </DescriptionListGroup>
            {seedExample.questionAndAnswers.map((qa, qaIndex) => (
              <React.Fragment key={`qa-${index}-${qaIndex}`}>
                <DescriptionListGroup>
                  <DescriptionListTerm>Question</DescriptionListTerm>
                  <DescriptionListDescription>{qa.question}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Answer</DescriptionListTerm>
                  <DescriptionListDescription>{qa.answer}</DescriptionListDescription>
                </DescriptionListGroup>
              </React.Fragment>
            ))}
          </DescriptionList>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

export default ViewKnowledgeSeedExample;
