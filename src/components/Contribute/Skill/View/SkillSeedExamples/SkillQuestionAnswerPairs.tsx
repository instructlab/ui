// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React from 'react';
import { SkillSeedExample } from '@/types';
import { FormGroup, TextArea, Form, Flex, FlexItem } from '@patternfly/react-core';

interface Props {
  seedExample: SkillSeedExample;
}

const SkillQuestionAnswerPairs: React.FC<Props> = ({ seedExample }) => {
  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <Form>
          <FormGroup label="Question" fieldId="question">
            <TextArea readOnlyVariant="default" id="question" type="text" aria-label="Question" value={seedExample.questionAndAnswer.question} />
          </FormGroup>
          <FormGroup label="Answer" fieldId="answer">
            <TextArea readOnlyVariant="default" id="answer" type="text" aria-label="Answer" value={seedExample.questionAndAnswer.answer} />
          </FormGroup>
          <FormGroup id="" label="Context">
            <TextArea readOnlyVariant="default" type="text" aria-label="context" />
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default SkillQuestionAnswerPairs;
