import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { PlusIcon, MinusCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { QuestionAndAnswerPair, SeedExample } from '..';

interface Props {
  seedExamples: SeedExample[];
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => undefined;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => undefined;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => undefined;
  deleteQuestionAnswerPair: (seedExampleIndex: number, questionAnswerIndex: number) => undefined;
  addQuestionAnswerPair: (seedExampleIndex: number) => undefined;
  addSeedExample: () => undefined;
}

const KnowledgeQuestionAnswerPairs: React.FC<Props> = ({
  seedExamples,
  handleContextInputChange,
  handleQuestionInputChange,
  handleAnswerInputChange,
  deleteQuestionAnswerPair,
  addQuestionAnswerPair,
  addSeedExample
}) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{ text: 'Seed Examples', id: 'seed-examples-id' }}
          titleDescription="Add seed examples with context and Q&A pairs"
        />
      }
    >
      {seedExamples.map((seedExample: SeedExample, seedExampleIndex: number) => (
        <FormGroup key={seedExampleIndex}>
          <Text className="heading-k">Knowledge Seed Example {seedExampleIndex + 1}</Text>
          <TextArea
            isRequired
            type="text"
            aria-label={`Context ${seedExampleIndex + 1}`}
            placeholder="Enter the context"
            value={seedExample.context}
            onChange={(_event, contextValue: string) => handleContextInputChange(seedExampleIndex, contextValue)}
          />

          {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex) => (
            <React.Fragment key={questionAnswerIndex}>
              <TextArea
                isRequired
                type="text"
                aria-label={`Question ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
                placeholder={`Enter question ${questionAnswerIndex + 1}`}
                value={questionAndAnswerPair.question}
                onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionAnswerIndex, questionValue)}
              />
              <TextArea
                isRequired
                type="text"
                aria-label={`Answer ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
                placeholder={`Enter answer ${questionAnswerIndex + 1}`}
                value={questionAndAnswerPair.answer}
                onChange={(_event, answerValue) => handleAnswerInputChange(seedExampleIndex, questionAnswerIndex, answerValue)}
              />
              <Button variant="danger" onClick={() => deleteQuestionAnswerPair(seedExampleIndex, questionAnswerIndex)}>
                <MinusCircleIcon /> Delete Question and Answer
              </Button>
            </React.Fragment>
          ))}
          <div style={{ marginTop: '10px', marginBottom: '20px' }}>
            <Button variant="primary" onClick={() => addQuestionAnswerPair(seedExampleIndex)}>
              <PlusIcon /> Add Question and Answer
            </Button>
          </div>
        </FormGroup>
      ))}
      <Button variant="primary" onClick={addSeedExample}>
        <PlusIcon /> Add Knowledge Seed Example
      </Button>
    </FormFieldGroupExpandable>
  );
};

export default KnowledgeQuestionAnswerPairs;
