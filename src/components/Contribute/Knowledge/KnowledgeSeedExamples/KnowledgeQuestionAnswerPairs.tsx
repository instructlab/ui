// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React from 'react';
import { KnowledgeSeedExample, QuestionAndAnswerPair } from '@/types';
import { Form } from '@patternfly/react-core';
import { t_global_spacer_md as MdSpacerSize } from '@patternfly/react-tokens';
import KnowledgeQuestionAnswerPair from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeQuestionAnswerPair';

interface Props {
  seedExample: KnowledgeSeedExample;
  seedExampleIndex: number;
  handleContextInputChange: (contextValue: string, validate?: boolean) => void;
  handleQuestionInputChange: (questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (questionAndAnswerIndex: number) => void;
}

const KnowledgeQuestionAnswerPairs: React.FC<Props> = ({
  seedExample,
  seedExampleIndex,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur
}) => {
  return (
    <Form style={{ paddingRight: MdSpacerSize.var, paddingLeft: MdSpacerSize.var }}>
      {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex: number) => (
        <KnowledgeQuestionAnswerPair
          key={`q-n-a-pair-${questionAnswerIndex}`}
          questionAndAnswerPair={questionAndAnswerPair}
          index={questionAnswerIndex}
          seedExampleIndex={seedExampleIndex}
          handleQuestionInputChange={handleQuestionInputChange}
          handleQuestionBlur={handleQuestionBlur}
          handleAnswerInputChange={handleAnswerInputChange}
          handleAnswerBlur={handleAnswerBlur}
        />
      ))}
    </Form>
  );
};

export default KnowledgeQuestionAnswerPairs;
