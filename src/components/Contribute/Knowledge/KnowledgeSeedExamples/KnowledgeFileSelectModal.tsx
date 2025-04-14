// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  ExpandableSection,
  Content,
  ModalHeader,
  ModalBody,
  Flex,
  FlexItem
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
  handleContextInputChange: (contextValue: string) => void;
  handleCloseModal: () => void;
}

const KnowledgeFileSelectModal: React.FC<Props> = ({ knowledgeFiles, isLoading, error, handleContextInputChange, handleCloseModal }) => {
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});
  const [selectedWordCount, setSelectedWordCount] = useState<number>(0);

  // Ref for the <pre> elements to track selections TODO: figure out how to make text expansions taller in PF without a custom-pre
  const preRefs = useRef<Record<string, HTMLPreElement | null>>({});

  const handleUseSelectedText = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();

    if (!selectedText) {
      alert('Please select the text you want to use as context.');
      return;
    }

    handleContextInputChange(selectedText);
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

  const setPreRef = useCallback(
    (filename: string) => (el: HTMLPreElement | null) => {
      preRefs.current[filename] = el;
    },
    []
  );

  // Update word count whenever context changes
  return (
    <Modal variant={ModalVariant.large} isOpen onClose={handleCloseModal}>
      <ModalHeader
        title="Select context from files"
        description={
          <>
            Highlight up to 500 words from a single file at a time to populate the <strong>context</strong> field. If selecting contexts from multiple
            files, the files must belong to the same commit (SHA).
          </>
        }
        labelId="select-context-from-files-title"
      />
      <ModalBody id="select-context-from-files-body">
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          {isLoading && (
            <FlexItem style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Spinner size="md" />
              <span>Loading knowledge files and their commits...</span>
            </FlexItem>
          )}
          {!isLoading && error && <FlexItem style={{ color: 'red' }}>{error}</FlexItem>}
          {!isLoading && !error && knowledgeFiles.length === 0 && (
            <FlexItem>
              <Alert variant="warning" isInline title="To select a context directly from a file, you must first upload a knowledge file." />
            </FlexItem>
          )}
          {!isLoading && !error && knowledgeFiles.length > 0 && (
            <FlexItem flex={{ default: 'flex_1' }}>
              <Card>
                <CardHeader>Uploaded Documents:</CardHeader>
                <CardBody>
                  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                    {knowledgeFiles.map((file) => (
                      <FlexItem key={file.filename}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ marginRight: '10px', fontWeight: 'bold' }}>{file.filename}</div>
                          <div>
                            <Button variant="link" onClick={() => toggleFileContent(file.filename)} style={{ marginRight: '10px' }}>
                              {expandedFiles[file.filename] ? 'Hide' : 'Show'} Contents for Context Selection
                            </Button>
                          </div>
                        </div>
                        {expandedFiles[file.filename] && (
                          <ExpandableSection
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
                                borderRadius: '2px',
                                maxHeight: '550px',
                                overflowY: 'auto',
                                userSelect: 'text'
                              }}
                            >
                              {file.content}
                            </pre>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
                              <Button
                                variant="primary"
                                onClick={() => handleUseSelectedText()}
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
                      </FlexItem>
                    ))}
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}
        </Flex>
      </ModalBody>
    </Modal>
  );
};

export default KnowledgeFileSelectModal;
