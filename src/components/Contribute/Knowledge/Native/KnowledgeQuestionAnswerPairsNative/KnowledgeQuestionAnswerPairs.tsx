// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { KnowledgeSeedExample, QuestionAndAnswerPair } from '@/types';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { Tooltip } from '@patternfly/react-core/dist/esm/components/Tooltip/Tooltip';
import { CatalogIcon } from '@patternfly/react-icons/dist/esm/icons/catalog-icon';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { ExpandableSection } from '@patternfly/react-core/dist/esm/components/ExpandableSection/ExpandableSection';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Card, CardBody, CardHeader } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';

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
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [selectedWordCount, setSelectedWordCount] = useState<number>(0);
  const [showAllCommits, setShowAllCommits] = useState<boolean>(false);

  // Ref for the <pre> elements to track selections TODO: figure out how to make text expansions taller in PF without a custom-pre
  const preRefs = useRef<Record<string, HTMLPreElement | null>>({});

  const LOCAL_TAXONOMY_DOCS_ROOT_DIR =
    `${process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR}/taxonomy-knowledge-docs` || `${process.env.HOME}/.instructlab-ui/taxonomy-knowledge-docs`;

  const fetchKnowledgeFiles = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/native/git/knowledge-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName: 'main', action: 'diff' })
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
    setSelectedWordCount(0);
    setShowAllCommits(false);
    window.getSelection()?.removeAllRanges();
  };

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
    if (isModalOpen) {
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
    } else {
      setSelectedWordCount(0);
    }
  }, [isModalOpen, expandedFiles]);

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

  return (
    <FormGroup style={{ padding: '20px' }}>
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
        maxLength={500}
        style={{ marginBottom: '20px' }}
        onChange={(_event, contextValue: string) => handleContextInputChange(seedExampleIndex, contextValue)}
        onBlur={() => handleContextBlur(seedExampleIndex)}
      />
      {seedExample.isContextValid === ValidatedOptions.error && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isContextValid}>
              {seedExample.validationError || 'Required field. It must be non-empty and less than 500 words.'}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}

      <Modal variant={ModalVariant.large} title="Select a Knowledge File" isOpen={isModalOpen} onClose={handleCloseModal} style={{ padding: '20px' }}>
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
          context must be verbatim from the knowledge file by selecting the text. Multiple files can be used for context selection, but they must
          belong to the same commit (SHA).
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

      {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex) => (
        <div key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 0}>
          <FormFieldGroupHeader
            titleText={{
              text: (
                <p>
                  Q&A Pair {questionAnswerIndex + 1} {questionAndAnswerPair.immutable && <span style={{ color: 'red' }}>*</span>}
                </p>
              ),
              id: 'nested-field-group1-titleText-id'
            }}
          />
          <React.Fragment>
            <TextArea
              isRequired
              type="text"
              aria-label={`Question ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
              placeholder={`Enter question ${questionAnswerIndex + 1}`}
              value={questionAndAnswerPair.question}
              maxLength={250}
              validated={questionAndAnswerPair.isQuestionValid}
              style={{ marginBottom: '10px' }}
              onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionAnswerIndex, questionValue)}
              onBlur={() => handleQuestionBlur(seedExampleIndex, questionAnswerIndex)}
            />
            {questionAndAnswerPair.isQuestionValid === ValidatedOptions.error && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={questionAndAnswerPair.isQuestionValid}>
                    {questionAndAnswerPair.questionValidationError || 'Required field. Total length of all Q&A pairs should be less than 250 words.'}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
            <TextArea
              isRequired
              type="text"
              aria-label={`Answer ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
              placeholder={`Enter answer ${questionAnswerIndex + 1}`}
              value={questionAndAnswerPair.answer}
              maxLength={250}
              validated={questionAndAnswerPair.isAnswerValid}
              style={{ marginTop: '10px' }}
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
          </React.Fragment>
        </div>
      ))}
    </FormGroup>
  );
};

export default KnowledgeQuestionAnswerPairsNative;
