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
  DescriptionListTerm,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import type { KnowledgeSeedExample } from '@/types';
import { t_global_spacer_sm as SmSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_sm';
import { getSeedExampleTitle } from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeSeedExamples/utils';

interface Props {
  seedExamples: KnowledgeSeedExample[];
}

const KnowledgeSeedExamplesReviewSection: React.FC<Props> = ({ seedExamples }) => {
  const [expanded, setExpanded] = React.useState<{ [key: string]: boolean }>({});

  const onToggle = (id: number) => {
    setExpanded((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      {seedExamples?.map((seedExample, index) => (
        <FlexItem key={`seed-${index}`}>
          <Accordion asDefinitionList={false}>
            <AccordionItem isExpanded={expanded[index]} key={`accordion-item-${index}`}>
              <AccordionToggle onClick={() => onToggle(index)} id={`seed-example-toggle-${index}`}>
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
        </FlexItem>
      ))}
    </Flex>
  );
};

export default KnowledgeSeedExamplesReviewSection;
