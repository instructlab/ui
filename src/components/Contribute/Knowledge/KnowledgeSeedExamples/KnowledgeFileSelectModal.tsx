// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button,
  Modal,
  ModalVariant,
  Alert,
  Spinner,
  Stack,
  StackItem,
  Card,
  CardHeader,
  CardBody,
  ExpandableSection,
  Content,
  ModalHeader,
  ModalBody
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
      <ModalHeader title="Select Context from Files" labelId="select-context-from-files-title" />
      <ModalBody id="select-context-from-files-body">
        <Alert variant="info" isInline isPlain title="Instructions">
          Please highlight up to <strong>500 words </strong>and click the &quot;Use Selected Text For Context&quot; button to populate the context
          field. <strong>Knowledge context must be verbatim from the knowledge file by selecting the text</strong>. Each context can be selected from
          different file.
        </Alert>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Spinner size="md" />
            <span>Loading knowledge files and their commits...</span>
          </div>
        )}
        {!isLoading && error && <div style={{ color: 'red' }}>{error}</div>}
        {!isLoading && !error && knowledgeFiles.length === 0 && (
          <div>
            <strong>No knowledge files were uploaded for the knowledge contribution.</strong>
          </div>
        )}
        {!isLoading && !error && knowledgeFiles.length > 0 && (
          <Stack hasGutter>
            <StackItem key={'knowledge-documents'}>
              <Card>
                <CardHeader>
                  <strong>Uploaded Documents:</strong> <br />
                </CardHeader>
                <CardBody>
                  {knowledgeFiles.map((file) => (
                    <div key={file.filename}>
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
                    </div>
                  ))}
                </CardBody>
              </Card>
            </StackItem>
          </Stack>
        )}
      </ModalBody>
    </Modal>
  );
};

export default KnowledgeFileSelectModal;
