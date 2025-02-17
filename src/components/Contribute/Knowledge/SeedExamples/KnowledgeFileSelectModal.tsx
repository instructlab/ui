// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KnowledgeSeedExample } from '@/types';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Switch,
  Spinner,
  Stack,
  StackItem,
  Card,
  CardHeader,
  CardBody,
  ExpandableSection,
  Content
} from '@patternfly/react-core';

interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha: string;
  commitDate?: string;
}

interface Props {
  knowledgeFiles: KnowledgeFile[];
  isLoading: boolean;
  error: string;
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
  handleCloseModal: () => void;
}

const KnowledgeFileSelectModal: React.FC<Props> = ({
  knowledgeFiles,
  isLoading,
  error,
  seedExampleIndex,
  handleContextInputChange,
  handleContextBlur,
  addDocumentInfo,
  repositoryUrl,
  commitSha,
  handleCloseModal
}) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [selectedWordCount, setSelectedWordCount] = useState<number>(0);
  const [showAllCommits, setShowAllCommits] = useState<boolean>(false);

  // Ref for the <pre> elements to track selections TODO: figure out how to make text expansions taller in PF without a custom-pre
  const preRefs = useRef<Record<string, HTMLPreElement | null>>({});

  const LOCAL_TAXONOMY_DOCS_ROOT_DIR =
    `${process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR}/taxonomy-knowledge-docs` || `${process.env.HOME}/.instructlab-ui/taxonomy-knowledge-docs`;

  const handleUseSelectedText = (file: KnowledgeFile) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) {
      alert('Please select the text you want to use as context.');
      return;
    }

    repositoryUrl = `${LOCAL_TAXONOMY_DOCS_ROOT_DIR}/${file.filename}`;
    const commitShaValue = file.commitSha;
    const docName = file.filename;

    console.log(
      `handleUseSelectedText: selectedText="${selectedText}", repositoryUrl=${repositoryUrl}, commitSha=${commitShaValue}, docName=${docName}`
    );

    handleContextInputChange(seedExampleIndex, selectedText);
    handleContextBlur(seedExampleIndex);
    addDocumentInfo(repositoryUrl, commitShaValue, docName);
    handleCloseModal();
  };

  const updateSelectedWordCount = (filename: string) => {
    const selection = window.getSelection();
    const preElement = preRefs.current[filename];
    if (selection && preElement) {
      const anchorNode = selection.anchorNode;
      const focusNode = selection.focusNode;

      if (preElement.contains(anchorNode) && preElement.contains(focusNode)) {
        const selectedText = selection.toString().trim();
        const wordCount = selectedText.split(/\s+/).filter((word) => word.length > 0).length;
        setSelectedWordCount(wordCount);
      } else {
        setSelectedWordCount(0);
      }
    }
  };

  // Attach event listeners for selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      // Iterate through all expanded files and update word count
      Object.keys(expandedFiles).forEach((filename) => {
        if (expandedFiles[filename]) {
          updateSelectedWordCount(filename);
        }
      });
    };
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [expandedFiles]);

  const toggleFileContent = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename]
    }));
    console.log(`toggleFileContent: filename=${filename}, expanded=${!expandedFiles[filename]}`);
  };

  // Group files by commitSha
  const groupedFiles = knowledgeFiles.reduce<Record<string, KnowledgeFile[]>>((acc, file) => {
    if (!acc[file.commitSha]) {
      acc[file.commitSha] = [];
    }
    acc[file.commitSha].push(file);
    return acc;
  }, {});

  // Extract commit dates for sorting
  const commitDateMap: Record<string, string> = {};
  knowledgeFiles.forEach((file) => {
    if (file.commitDate && !commitDateMap[file.commitSha]) {
      commitDateMap[file.commitSha] = file.commitDate;
    }
  });

  // Sort the commit SHAs based on commitDate in descending order (latest first)
  const sortedCommitShas = Object.keys(groupedFiles).sort((a, b) => {
    const dateA = new Date(commitDateMap[a] || '').getTime();
    const dateB = new Date(commitDateMap[b] || '').getTime();
    return dateB - dateA;
  });

  // Enforce single commit SHA and repository URL
  const isSameCommit = (fileCommitSha: string): boolean => {
    if (!commitSha) {
      return true;
    }
    return fileCommitSha === commitSha;
  };

  // Determine which commits to display based on the toggle
  const commitsToDisplay = showAllCommits ? sortedCommitShas : sortedCommitShas.slice(0, 1);

  const setPreRef = useCallback(
    (filename: string) => (el: HTMLPreElement | null) => {
      preRefs.current[filename] = el;
    },
    []
  );

  // Update word count whenever context changes
  return (
    <Modal variant={ModalVariant.large} title="Select a Knowledge File" isOpen onClose={handleCloseModal} style={{ padding: '20px' }}>
      {commitSha && (
        <div
          style={{
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '10px',
            fontSize: '14px',
            color: '#333'
          }}
        >
          <Alert
            variant="warning"
            isInline
            title="All knowledge files need to originate from the same commit or 'Document Information' submission"
            style={{ marginBottom: '20px' }}
          >
            A commit SHA (<strong>{commitSha}</strong>) has already been selected in a previous seed example. All subsequent selections must use the
            same commit SHA for consistency.
          </Alert>
          {/*A commit SHA (<strong>{commitSha}</strong>) has already been selected in a previous seed example. All subsequent selections must use the*/}
          {/*same commit SHA for consistency.*/}
        </div>
      )}

      <Alert variant="info" isInline title="Instructions" style={{ marginBottom: '20px' }}>
        Please highlight up to 500 words and click the &quot;Use Selected Text For Context&quot; button to populate the context field. Knowledge
        context must be verbatim from the knowledge file by selecting the text. Multiple files can be used for context selection, but they must belong
        to the same commit (SHA).
      </Alert>
      <div style={{ marginBottom: '20px' }}>
        <Switch
          label="Show All Knowledge Files"
          // labelOff="Show Only Most Recent Commit"
          isChecked={showAllCommits}
          onChange={() => setShowAllCommits(!showAllCommits)}
          id="show-all-commits-toggle"
        />
      </div>

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px', gap: '10px' }}>
          <Spinner size="md" />
          <span>Loading knowledge files and their commits...</span>
        </div>
      )}
      {!isLoading && error && <div style={{ color: 'red', padding: '10px' }}>{error}</div>}
      {!isLoading && !error && knowledgeFiles.length === 0 && <div style={{ padding: '10px' }}>No knowledge files available.</div>}
      {!isLoading && !error && knowledgeFiles.length > 0 && (
        <Stack hasGutter style={{ padding: '10px' }}>
          {commitsToDisplay.map((commitShaKey) => {
            const files = groupedFiles[commitShaKey];
            const isSelectable = isSameCommit(commitShaKey);
            const commitDate = commitDateMap[commitShaKey];
            const formattedDate = commitDate ? new Date(commitDate).toLocaleString() : 'Unknown date';

            // Highlight the card if commitShaKey matches currently selected commitSha
            const highlightCard = commitSha && commitShaKey === commitSha;

            return (
              <StackItem key={commitShaKey}>
                <Card
                  style={{
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                    borderRadius: '8px',
                    padding: '15px',
                    border: highlightCard ? '2px solid #007BFF' : '1px solid #ccc',
                    backgroundColor: highlightCard ? '#FFF' : '#fff'
                  }}
                >
                  <CardHeader>
                    <strong>Commit SHA:</strong> {commitShaKey} <br />
                    <strong>Date:</strong> {formattedDate}
                  </CardHeader>
                  <CardBody style={{ padding: '15px' }}>
                    {files.map((file) => (
                      <div key={file.filename} style={{ marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ marginRight: '10px', fontWeight: 'bold' }}>{file.filename}</div>
                          <div>
                            <Button
                              variant="link"
                              onClick={() => toggleFileContent(file.filename)}
                              isDisabled={!isSelectable}
                              style={{ marginRight: '10px' }}
                            >
                              {expandedFiles[file.filename] ? 'Hide' : 'Show'} Contents for Context Selection
                            </Button>
                          </div>
                        </div>
                        {expandedFiles[file.filename] && (
                          <ExpandableSection
                            toggleText={expandedFiles[file.filename] ? 'Hide file contents' : 'Show file contents'}
                            onToggle={() => toggleFileContent(file.filename)}
                            isExpanded={expandedFiles[file.filename]}
                            style={{ marginTop: '10px' }}
                          >
                            <pre
                              ref={setPreRef(file.filename)}
                              style={{
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                                backgroundColor: '#f5f5f5',
                                padding: '10px',
                                borderRadius: '4px',
                                maxHeight: '700px',
                                overflowY: 'auto',
                                userSelect: 'text'
                              }}
                            >
                              {file.content}
                            </pre>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                              <Button
                                variant="primary"
                                onClick={() => handleUseSelectedText(file)}
                                isDisabled={selectedWordCount === 0 || selectedWordCount > 500} // Disable if word count exceeds 500
                                style={{ marginRight: '10px' }}
                              >
                                Use Selected Text For Context
                              </Button>
                              <Content
                                component="small"
                                style={{
                                  fontWeight: 'bold',
                                  color: selectedWordCount > 500 ? 'red' : 'green'
                                }}
                              >
                                {selectedWordCount}/500 words selected
                              </Content>
                            </div>
                          </ExpandableSection>
                        )}
                      </div>
                    ))}
                  </CardBody>
                </Card>
              </StackItem>
            );
          })}
        </Stack>
      )}
    </Modal>
  );
};

export default KnowledgeFileSelectModal;
