// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React, { useState } from 'react';
import type { SeedExample } from '@/types';
import SeedExamples from '@/components/Contribute/SeedExamples/SeedExamples';
import KnowledgeFileSelectModal from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeFileSelectModal';
import { handleSeedExamplesContextInputChange } from '@/components/Contribute/Utils/seedExampleUtils';

interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate?: string;
}

const GITHUB_KNOWLEDGE_FILES_API = '/api/github/knowledge-files';
const NATIVE_GIT_KNOWLEDGE_FILES_API = '/api/native/git/knowledge-files';

interface Props {
  isGithubMode: boolean;
  seedExamples: SeedExample[];
  onUpdateSeedExamples: (seedExamples: SeedExample[]) => void;
  addDocumentInfo: (repoUrl: string, commitSha: string, docName: string) => void;
  repositoryUrl: string;
  commitSha: string;
}

const KnowledgeSeedExamples: React.FC<Props> = ({ isGithubMode, seedExamples, onUpdateSeedExamples, addDocumentInfo, repositoryUrl, commitSha }) => {
  const [fileSelectIndex, setFileSelectIndex] = useState<number>(-1);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  React.useEffect(() => {
    const fetchKnowledgeFiles = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await fetch(isGithubMode ? GITHUB_KNOWLEDGE_FILES_API : NATIVE_GIT_KNOWLEDGE_FILES_API, {
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

    if (fileSelectIndex > 0 && !knowledgeFiles.length) {
      fetchKnowledgeFiles();
    }
  }, [fileSelectIndex, isGithubMode, knowledgeFiles.length]);

  const handleContextInputChange = (contextValue: string) => {
    handleSeedExamplesContextInputChange(seedExamples, fileSelectIndex, contextValue, true);
  };

  return (
    <>
      <SeedExamples
        isSkillContribution={false}
        seedExamples={seedExamples}
        onUpdateSeedExamples={onUpdateSeedExamples}
        onSelectContext={setFileSelectIndex}
      />
      {fileSelectIndex >= 0 ? (
        <KnowledgeFileSelectModal
          knowledgeFiles={knowledgeFiles}
          isLoading={isLoading}
          error={error}
          handleContextInputChange={handleContextInputChange}
          addDocumentInfo={addDocumentInfo}
          repositoryUrl={repositoryUrl}
          commitSha={commitSha}
          handleCloseModal={() => setFileSelectIndex(-1)}
        />
      ) : null}
    </>
  );
};

export default KnowledgeSeedExamples;
