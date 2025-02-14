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
  FlexItem
} from '@patternfly/react-core';
import { CatalogIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import KnowledgeFileSelectModal from '@/components/Contribute/Knowledge/Native/KnowledgeQuestionAnswerPairsNative/KnowledgeFileSelectModal';

interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate?: string;
}

interface Props {
  seedExample: KnowledgeSeedExample;
  seedExampleIndex: number;
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  addDocumentInfo: (repositoryUrl: string, commitSha: string, docName: string) => void;
  repositoryUrl: string;
  commitSha: string;
}

const KnowledgeQuestionAnswerPairsNative: React.FC<Props> = ({
  seedExample,
  seedExampleIndex,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  addDocumentInfo,
  repositoryUrl,
  commitSha
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [contextWordCount, setContextWordCount] = useState(0);
  const MAX_WORDS = 500;

  const fetchKnowledgeFiles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/native/git/knowledge-files', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      if (response.ok) {
        setKnowledgeFiles(result.files);
        console.log('Fetched knowledge files:', result.files);
      } else {
        setError(result.error || 'Failed to fetch knowledge files.');
        console.error('Error fetching knowledge files:', result.error);
      }
    } catch (err) {
      setError('An error occurred while fetching knowledge files.');
      console.error('Error fetching knowledge files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    fetchKnowledgeFiles();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setKnowledgeFiles([]);
    setError('');
    window.getSelection()?.removeAllRanges();
  };

  // Extract commit dates for sorting
  const commitDateMap: Record<string, string> = {};
  knowledgeFiles.forEach((file) => {
    if (file.commitDate && !commitDateMap[file.commitSha]) {
      commitDateMap[file.commitSha] = file.commitDate;
    }
  });

  // TODO: replace with a tokenizer library
  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  // Update word count whenever context changes
  useEffect(() => {
    setContextWordCount(countWords(seedExample.context));
  }, [seedExample.context]);

  // Handle context input change with word count validation
  const onContextChange = (_event: React.FormEvent<HTMLTextAreaElement>, contextValue: string) => {
    handleContextInputChange(seedExampleIndex, contextValue);
  };

  return (
    <Form style={{ padding: '20px' }}>
      <FormGroup>
        <Tooltip content={<div>Select context from your knowledge files</div>} position="top">
          <Button variant="secondary" onClick={handleOpenModal} style={{ marginBottom: '10px' }}>
            <CatalogIcon /> Select Context from Files
          </Button>
        </Tooltip>

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
        {seedExample.isContextValid === ValidatedOptions.error && (
          <FormHelperText>
            <HelperText>
              <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isContextValid}>
                {seedExample.validationError || 'Required field. It must be non-empty and less than 500 words.'}
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
        )}
      </FormGroup>
      {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex) => (
        <FormGroup
          key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 0}
          label={`Q&A Pair ${questionAnswerIndex + 1}`}
          isRequired={questionAndAnswerPair.immutable}
          fieldId="nested-field-group1-titleText-id"
        >
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
            <FlexItem>
              <TextArea
                isRequired
                type="text"
                aria-label={`Question ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
                placeholder={`Enter question ${questionAnswerIndex + 1}`}
                value={questionAndAnswerPair.question}
                maxLength={250}
                validated={questionAndAnswerPair.isQuestionValid}
                onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionAnswerIndex, questionValue)}
                onBlur={() => handleQuestionBlur(seedExampleIndex, questionAnswerIndex)}
              />
              {questionAndAnswerPair.isQuestionValid === ValidatedOptions.error && (
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
                maxLength={250}
                validated={questionAndAnswerPair.isAnswerValid}
                onChange={(_event, answerValue) => handleAnswerInputChange(seedExampleIndex, questionAnswerIndex, answerValue)}
                onBlur={() => handleAnswerBlur(seedExampleIndex, questionAnswerIndex)}
              />
              {questionAndAnswerPair.isAnswerValid === ValidatedOptions.error && (
                <FormHelperText style={{ marginTop: '5px' }}>
                  <HelperText>
                    <HelperTextItem icon={<ExclamationCircleIcon />} variant={questionAndAnswerPair.isAnswerValid}>
                      {questionAndAnswerPair.answerValidationError || 'Required field. Total length of all Q&A pairs should be less than 250 words.'}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FlexItem>
          </Flex>
        </FormGroup>
      ))}

      {isModalOpen ? (
        <KnowledgeFileSelectModal
          knowledgeFiles={knowledgeFiles}
          isLoading={isLoading}
          error={error}
          seedExample={seedExample}
          seedExampleIndex={seedExampleIndex}
          handleContextInputChange={handleContextInputChange}
          handleContextBlur={handleContextBlur}
          handleQuestionInputChange={handleQuestionInputChange}
          handleQuestionBlur={handleQuestionBlur}
          handleAnswerInputChange={handleAnswerInputChange}
          handleAnswerBlur={handleAnswerBlur}
          addDocumentInfo={addDocumentInfo}
          repositoryUrl={repositoryUrl}
          commitSha={commitSha}
          handleCloseModal={handleCloseModal}
        />
      ) : null}
    </Form>
  );
};

export default KnowledgeQuestionAnswerPairsNative;
