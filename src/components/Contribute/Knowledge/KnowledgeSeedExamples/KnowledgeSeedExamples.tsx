// src/components/Contribute/Knowledge/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React, { useState } from 'react';
import { Alert, Bullseye, Button, Flex, FlexItem, Spinner } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon } from '@patternfly/react-icons';
import type { KnowledgeFile, KnowledgeSeedExample } from '@/types';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import {
  createEmptyKnowledgeSeedExample,
  handleKnowledgeSeedExamplesAnswerBlur,
  handleKnowledgeSeedExamplesQuestionBlur
} from '@/components/Contribute/Utils/seedExampleUtils';
import KnowledgeSeedExampleCard from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExampleCard';

interface Props {
  isGithubMode: boolean;
  filesToUpload: File[];
  uploadedFiles: KnowledgeFile[];
  seedExamples: KnowledgeSeedExample[];
  onUpdateSeedExamples: (seedExamples: KnowledgeSeedExample[]) => void;
}

const KnowledgeSeedExamples: React.FC<Props> = ({ isGithubMode, filesToUpload, uploadedFiles, seedExamples, onUpdateSeedExamples }) => {
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bodyRef, setBodyRef] = React.useState<HTMLElement | null>();

  React.useEffect(() => {
    let canceled = false;

    const fetchKnowledgeFiles = async () => {
      setIsLoading(true);

      const fetchers = filesToUpload.map(
        (file) =>
          new Promise<KnowledgeFile>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve({ filename: file.name, content: e.target!.result as string });
            reader.onerror = reject;
            reader.readAsText(file);
          })
      );

      const newFiles = await Promise.all(fetchers);

      if (!canceled) {
        setKnowledgeFiles([...uploadedFiles, ...newFiles]);
        setIsLoading(false);
      }
    };

    fetchKnowledgeFiles();

    return () => {
      canceled = true;
    };
  }, [filesToUpload, uploadedFiles]);

  const handleSeedExampleUpdate = (seedExampleIndex: number, updatedExample: KnowledgeSeedExample): void =>
    onUpdateSeedExamples(
      seedExamples.map((seedExample: KnowledgeSeedExample, index: number) => (index === seedExampleIndex ? updatedExample : seedExample))
    );

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void =>
    onUpdateSeedExamples(handleKnowledgeSeedExamplesQuestionBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void =>
    onUpdateSeedExamples(handleKnowledgeSeedExamplesAnswerBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));

  const addSeedExample = (): void => {
    const seedExample = createEmptyKnowledgeSeedExample();
    seedExample.immutable = false;
    onUpdateSeedExamples([...seedExamples, seedExample]);
  };

  const onDeleteSeedExample = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }} ref={setBodyRef}>
      <FlexItem>
        <WizardPageHeader
          title="Create seed data"
          description={
            <>
              Let’s start to create the data that accurately represent the knowledge you are trying to teach your model. A markdown file has been
              generated for each document you uploaded. Each contribution must contain 5 contexts, selecting a combination of simple and complex
              contexts help to prepare your model to handle various user needs. For each context, you will create 3 question and answer pairs.{' '}
              <Button
                variant="link"
                isInline
                component="a"
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about seed data
              </Button>
            </>
          }
        />
      </FlexItem>
      {isLoading ? (
        <FlexItem>
          <Bullseye>
            <Spinner />
          </Bullseye>
        </FlexItem>
      ) : (
        <>
          {!knowledgeFiles?.length ? (
            <FlexItem>
              <Alert
                variant="danger"
                isInline
                title={'There are no uploaded documents for this contribution. Please add documents in the "Upload documents" step.'}
              />
            </FlexItem>
          ) : null}
          <FlexItem>
            {seedExamples.map((seedExample: KnowledgeSeedExample, seedExampleIndex: number) => (
              <KnowledgeSeedExampleCard
                bodyRef={bodyRef}
                key={seedExampleIndex}
                isGithubMode={isGithubMode}
                knowledgeFiles={knowledgeFiles}
                seedExampleIndex={seedExampleIndex}
                seedExample={seedExample}
                onUpdateSeedExample={(updated) => handleSeedExampleUpdate(seedExampleIndex, updated)}
                onDeleteSeedExample={() => onDeleteSeedExample(seedExampleIndex)}
                handleQuestionBlur={(questionAndAnswerIndex) => handleQuestionBlur(seedExampleIndex, questionAndAnswerIndex)}
                handleAnswerBlur={(questionAndAnswerIndex) => handleAnswerBlur(seedExampleIndex, questionAndAnswerIndex)}
              />
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Button icon={<PlusCircleIcon />} variant="link" type="button" onClick={addSeedExample}>
                Add question-and-answer pair
              </Button>
            </div>
          </FlexItem>
        </>
      )}
    </Flex>
  );
};

export default KnowledgeSeedExamples;
