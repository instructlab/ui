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
import type { SkillSeedExample } from '@/types';
import { t_global_spacer_sm as SmSpacerSize } from '@patternfly/react-tokens/dist/esm/t_global_spacer_sm';

interface Props {
  seedExamples: SkillSeedExample[];
}

const SkillSeedExamplesReviewSection: React.FC<Props> = ({ seedExamples }) => {
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
        </FlexItem>
      ))}
    </Flex>
  );
};

export default SkillSeedExamplesReviewSection;
