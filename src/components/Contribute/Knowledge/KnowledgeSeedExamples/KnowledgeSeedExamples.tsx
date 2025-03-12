// src/components/Contribute/Knowledge/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React, { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, Flex, FlexItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import type { KnowledgeSeedExample } from '@/types';
import KnowledgeFileSelectModal from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeFileSelectModal';
import {
  createEmptyKnowledgeSeedExample,
  handleKnowledgeSeedExamplesAnswerInputChange,
  handleKnowledgeSeedExamplesAnswerBlur,
  handleKnowledgeSeedExamplesQuestionBlur,
  handleKnowledgeSeedExamplesQuestionInputChange,
  handleKnowledgeSeedExamplesContextBlur,
  handleKnowledgeSeedExamplesContextInputChange,
  toggleKnowledgeSeedExamplesExpansion
} from '@/components/Contribute/Utils/seedExampleUtils';
import KnowledgeQuestionAnswerPairs from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeQuestionAnswerPairs';
import WizardPageHeader from '@/components/Common/WizardPageHeader';

export interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate?: string;
}
interface Props {
  isGithubMode: boolean;
  filesToUpload: File[];
  uploadedFiles: KnowledgeFile[];
  seedExamples: KnowledgeSeedExample[];
  onUpdateSeedExamples: (seedExamples: KnowledgeSeedExample[]) => void;
}

const KnowledgeSeedExamples: React.FC<Props> = ({ isGithubMode, filesToUpload, uploadedFiles, seedExamples, onUpdateSeedExamples }) => {
  const [fileSelectIndex, setFileSelectIndex] = useState<number>(-1);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    const fetchKnowledgeFiles = async () => {
      setIsLoading(true);
      setError('');
      const allFiles = [];
      allFiles.push(...uploadedFiles);
      filesToUpload.map(
        (file) =>
          new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const fileContent = e.target!.result as string;
              allFiles.push({ filename: file.name, content: fileContent });
              resolve();
            };
            reader.onerror = reject;
            reader.readAsText(file);
          })
      );
      setKnowledgeFiles(allFiles);
    };

    if (!knowledgeFiles.length) {
      fetchKnowledgeFiles();
    }
    setIsLoading(false);
  }, [fileSelectIndex, isGithubMode, knowledgeFiles.length, filesToUpload, uploadedFiles]);

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string, validate = false): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesContextInputChange(seedExamples, seedExampleIndex, contextValue, validate));
  };

  const handleSelectContextInput = (contextValue: string) => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesContextInputChange(seedExamples, fileSelectIndex, contextValue, true));
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesContextBlur(seedExamples, seedExampleIndex));
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesQuestionInputChange(seedExamples, seedExampleIndex, questionAndAnswerIndex, questionValue));
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesQuestionBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesAnswerInputChange(seedExamples, seedExampleIndex, questionAndAnswerIndex, answerValue));
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    onUpdateSeedExamples(handleKnowledgeSeedExamplesAnswerBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    onUpdateSeedExamples(toggleKnowledgeSeedExamplesExpansion(seedExamples, index));
  };

  const addSeedExample = (): void => {
    const seedExample = createEmptyKnowledgeSeedExample();
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    onUpdateSeedExamples([...seedExamples, seedExample]);
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader
          title="Create seed data"
          description={
            <>
              Add seed examples with context and minimum 3 question and answer pairs. A minimum of five seed examples are required.{' '}
              <Button
                variant="link"
                isInline
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about seed examples
              </Button>
            </>
          }
        />
      </FlexItem>
      <FlexItem>
        <Accordion asDefinitionList={false}>
          {seedExamples.map((seedExample: KnowledgeSeedExample, seedExampleIndex: number) => (
            <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
              <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
                <Flex gap={{ default: 'gapMd' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%' }}>
                  <FlexItem>
                    Seed Example {seedExampleIndex + 1}{' '}
                    {seedExample.immutable ? <span style={{ color: 'var(--pf-t--global--color--status--danger--default)' }}>*</span> : null}
                  </FlexItem>
                  {!seedExample.immutable ? (
                    <FlexItem>
                      <Button
                        component="a"
                        icon={<TrashIcon />}
                        variant="plain"
                        aria-label="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSeedExample(seedExampleIndex);
                        }}
                      />
                    </FlexItem>
                  ) : null}
                </Flex>
              </AccordionToggle>
              <AccordionContent id={`seed-example-content-${seedExampleIndex}`}>
                <KnowledgeQuestionAnswerPairs
                  seedExample={seedExample}
                  seedExampleIndex={seedExampleIndex}
                  onSelectContext={setFileSelectIndex}
                  handleContextInputChange={handleContextInputChange}
                  handleContextBlur={handleContextBlur}
                  handleQuestionInputChange={handleQuestionInputChange}
                  handleQuestionBlur={handleQuestionBlur}
                  handleAnswerInputChange={handleAnswerInputChange}
                  handleAnswerBlur={handleAnswerBlur}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button icon={<PlusCircleIcon />} variant="link" type="button" onClick={addSeedExample}>
            Add Seed Example
          </Button>
        </div>
      </FlexItem>
      {fileSelectIndex >= 0 ? (
        <KnowledgeFileSelectModal
          knowledgeFiles={knowledgeFiles}
          isLoading={isLoading}
          error={error}
          handleContextInputChange={handleSelectContextInput}
          handleCloseModal={() => setFileSelectIndex(-1)}
        />
      ) : null}
    </Flex>
  );
};

export default KnowledgeSeedExamples;
