// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React, { useEffect, useState } from 'react';
import { KnowledgeSeedExample, QuestionAndAnswerPair } from '@/types';
import {
  FormGroup,
  Tooltip,
  Button,
  TextArea,
  FormHelperText,
  HelperText,
  HelperTextItem,
  ValidatedOptions,
  Form,
  Flex,
  FlexItem,
  Alert
} from '@patternfly/react-core';
import { CatalogIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import { t_global_spacer_md as MdSpacerSize } from '@patternfly/react-tokens';

interface Props {
  seedExample: KnowledgeSeedExample;
  seedExampleIndex: number;
  onSelectContext?: (seedExampleIndex: number) => void;
  handleContextInputChange: (seedExampleIndex: number, contextValue: string, validate?: boolean) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
}

const KnowledgeQuestionAnswerPairs: React.FC<Props> = ({
  seedExample,
  seedExampleIndex,
  onSelectContext,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur
}) => {
  const [contextWordCount, setContextWordCount] = useState(0);
  const [allQnAWordCount, setAllQnAWordCount] = useState(0);
  const MAX_WORDS = 500;
  const MAX_QnA_WORDS = 250;

  // TODO: replace with a tokenizer library
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const countQnAWords = (QnAs: QuestionAndAnswerPair[]) => {
    let count = 0;
    QnAs.map((qna) => {
      count += countWords(qna.question) + countWords(qna.answer);
    });
    return count;
  };

  // Update word count whenever context changes
  useEffect(() => {
    setContextWordCount(seedExample.context ? countWords(seedExample.context) : 0);
    setAllQnAWordCount(countQnAWords(seedExample.questionAndAnswers));
  }, [seedExample.context, seedExample.questionAndAnswers]);

  // Handle context input change with word count validation
  const onContextChange = (_event: React.FormEvent<HTMLTextAreaElement>, contextValue: string) => {
    handleContextInputChange(seedExampleIndex, contextValue);
  };

  return (
    <Flex style={{ padding: MdSpacerSize.var }} direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      {onSelectContext ? (
        <FlexItem>
          <Tooltip content={<div>Select context from your knowledge files</div>} position="top">
            <Button variant="secondary" onClick={() => onSelectContext(seedExampleIndex)} style={{ marginBottom: '10px' }}>
              <CatalogIcon /> Select Context from Files
            </Button>
          </Tooltip>
        </FlexItem>
      ) : null}
      <FlexItem>
        <Form>
          <FormGroup id="" label="Context" isRequired>
            <TextArea
              isRequired
              type="text"
              aria-label={`Context ${seedExampleIndex + 1}`}
              placeholder="Enter the context from which the Q&A pairs are derived. (500 words max)"
              value={seedExample.context}
              validated={seedExample.isContextValid}
              onChange={onContextChange}
              style={{ marginBottom: '20px' }}
              onBlur={() => handleContextBlur(seedExampleIndex)}
            />
            {/* Display word count */}
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {contextWordCount} / {MAX_WORDS} words
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
            {seedExample.isContextValid === ValidatedOptions.error ? (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isContextValid}>
                    {seedExample.validationError || 'Required field. It must be non-empty and less than 500 words.'}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            ) : null}
          </FormGroup>
          {allQnAWordCount > 250 && (
            <Alert
              variant="warning"
              title=<p>
                The combined total word count for all 3 question-and-answer pairs should be less than 250 words. Current word count :{' '}
                {allQnAWordCount}/{MAX_QnA_WORDS} words
              </p>
              ouiaId="InfoAlert"
            />
          )}
          {allQnAWordCount <= 250 && (
            <Alert
              variant="info"
              title=<p>
                The combined total word count for all 3 question-and-answer pairs should be less than 250 words. Current word count :{' '}
                {allQnAWordCount}/{MAX_QnA_WORDS} words
              </p>
              ouiaId="InfoAlert"
            />
          )}
          {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex: number) => (
            <FormGroup
              key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 0}
              label={`Q&A Pair ${questionAnswerIndex + 1}`}
              isRequired={questionAndAnswerPair.immutable}
            >
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <TextArea
                    isRequired
                    type="text"
                    aria-label={`Question ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
                    placeholder={`Enter question ${questionAnswerIndex + 1}`}
                    value={questionAndAnswerPair.question}
                    validated={questionAndAnswerPair.isQuestionValid}
                    onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionAnswerIndex, questionValue)}
                    onBlur={() => handleQuestionBlur(seedExampleIndex, questionAnswerIndex)}
                  />
                  {(questionAndAnswerPair.isQuestionValid === ValidatedOptions.warning ||
                    questionAndAnswerPair.isQuestionValid === ValidatedOptions.error) && (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem icon={<ExclamationCircleIcon />} variant={questionAndAnswerPair.isQuestionValid}>
                          {questionAndAnswerPair.questionValidationError ||
                            'Required field. Total length of all Q&A pairs should be less than 250 words.'}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  )}
                </FlexItem>
                <FlexItem>
                  <TextArea
                    isRequired
                    type="text"
                    aria-label={`Answer ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
                    placeholder={`Enter answer ${questionAnswerIndex + 1}`}
                    value={questionAndAnswerPair.answer}
                    validated={questionAndAnswerPair.isAnswerValid}
                    onChange={(_event, answerValue) => handleAnswerInputChange(seedExampleIndex, questionAnswerIndex, answerValue)}
                    onBlur={() => handleAnswerBlur(seedExampleIndex, questionAnswerIndex)}
                  />
                </FlexItem>
                {questionAndAnswerPair.isAnswerValid === ValidatedOptions.warning ||
                questionAndAnswerPair.isAnswerValid === ValidatedOptions.error ? (
                  <FlexItem>
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem icon={<ExclamationCircleIcon />} variant={questionAndAnswerPair.isAnswerValid}>
                          {questionAndAnswerPair.answerValidationError ||
                            'Required field. Total length of all Q&A pairs should be less than 250 words.'}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  </FlexItem>
                ) : null}
              </Flex>
            </FormGroup>
          ))}
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default KnowledgeQuestionAnswerPairs;
