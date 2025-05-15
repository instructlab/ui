// src/components/Contribute/Knowledge/Edit/KnowledgeSeedExamples/KnowledgeSeedExamples.tsx
import * as React from 'react';
import { Bullseye, Button, Flex, FlexItem, Spinner } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import type { KnowledgeFile, KnowledgeSeedExample } from '@/types';
import XsExternalLinkAltIcon from '@/components/Common/XsExternalLinkAltIcon';
import FormSectionHeader from '@/components/Common/FormSectionHeader';
import { descendingCompareKnowledgeFileDates } from '@/components/Contribute/Utils/contributionUtils';
import {
  createEmptyKnowledgeSeedExample,
  handleKnowledgeSeedExamplesAnswerBlur,
  handleKnowledgeSeedExamplesQuestionBlur
} from '@/components/Contribute/Utils/seedExampleUtils';
import KnowledgeSeedExampleCard from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExampleCard';

interface Props {
  scrollable: HTMLElement | null;
  uploadedFiles: KnowledgeFile[];
  seedExamples: KnowledgeSeedExample[];
  onUpdateSeedExamples: (seedExamples: KnowledgeSeedExample[]) => void;
}

const KnowledgeSeedExamples: React.FC<Props> = ({ scrollable, uploadedFiles, seedExamples, onUpdateSeedExamples }) => {
  const [documents, setDocuments] = React.useState<KnowledgeFile[]>([]);
  const [documentsLoading, setDocumentsLoading] = React.useState<boolean>(true);
  const [bodyRef, setBodyRef] = React.useState<HTMLElement | null>();

  React.useEffect(() => {
    let canceled = false;

    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents/list', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        const result = await response.json();
        if (!canceled) {
          setDocuments(result.files);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        if (!canceled) {
          setDocumentsLoading(false);
        }
      }
    };
    fetchDocuments();

    return () => {
      canceled = true;
    };
  }, []);

  const knowledgeSeedFiles = React.useMemo(() => {
    if (documentsLoading) {
      return [];
    }

    return [
      ...uploadedFiles,
      ...documents.filter(
        (document) =>
          !uploadedFiles.find((knowledgeFile) => document.filename === knowledgeFile.filename && document.commitDate !== knowledgeFile.commitDate)
      )
    ].sort(descendingCompareKnowledgeFileDates);
  }, [documents, documentsLoading, uploadedFiles]);

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
        <FormSectionHeader
          title="Seed data"
          description={
            <>
              Let’s start to create the data that accurately represents the knowledge you are trying to teach your model. Selecting a combination of
              simple and complex contexts help to prepare your model to handle various user needs.{' '}
              <Button
                variant="link"
                isInline
                component="a"
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<XsExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about seed data
              </Button>
            </>
          }
        />
      </FlexItem>
      <FlexItem>
        {documentsLoading ? (
          <Bullseye>
            <Spinner />
          </Bullseye>
        ) : (
          <>
            {seedExamples.map((seedExample: KnowledgeSeedExample, seedExampleIndex: number) => (
              <KnowledgeSeedExampleCard
                scrollable={scrollable}
                bodyRef={bodyRef}
                key={seedExampleIndex}
                knowledgeFiles={knowledgeSeedFiles}
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
                Add seed example
              </Button>
            </div>
          </>
        )}
      </FlexItem>
    </Flex>
  );
};

export default KnowledgeSeedExamples;
