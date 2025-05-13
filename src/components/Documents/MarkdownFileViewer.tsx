// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React from 'react';
import {
  Button,
  Content,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalVariant,
  Bullseye,
  Spinner,
  Flex,
  FlexItem,
  Alert
} from '@patternfly/react-core';
import { t_global_background_color_secondary_default as PreBackgroundColor, t_global_spacer_md as MdSpacer } from '@patternfly/react-tokens';
import { KnowledgeFile } from '@/types';

interface Props {
  markdownFile: KnowledgeFile;
  handleCloseModal: () => void;
}

const MarkdownFileViewer: React.FC<Props> = ({ markdownFile, handleCloseModal }) => {
  const [loading, setLoading] = React.useState<boolean>(!markdownFile.content);
  const [markdownContent, setMarkdownContent] = React.useState<string | undefined>(markdownFile.content);
  const [errorText, setErrorText] = React.useState<string | undefined>();

  React.useEffect(() => {
    let canceled = false;

    const getMarkdownContent = async () => {
      try {
        const response = await fetch(`/api/documents/get?filename=${markdownFile.filename}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!canceled) {
          if (!response.ok) {
            const errorText = await response.text();
            const error = JSON.parse(errorText);
            setLoading(false);
            setErrorText(error.error || error);
            console.error(`Error fetching document content for ${markdownFile.filename}:`, errorText);
            return;
          }
          const result = await response.json();
          setLoading(false);
          setMarkdownContent(result.file?.content);
        }
      } catch (error) {
        console.error(`Error fetching document content for ${markdownFile.filename}:`, error);
        setErrorText((error as Error).message);
      }
    };

    if (!markdownFile.content) {
      getMarkdownContent();
    }
    return () => {
      canceled = true;
    };
  }, [markdownFile]);

  const contents = errorText ? (
    <Alert variant="danger" isInline title="Unable to read file content">
      {errorText}
    </Alert>
  ) : (
    <Content
      component="pre"
      style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        backgroundColor: PreBackgroundColor.var,
        padding: MdSpacer.var,
        userSelect: 'text'
      }}
    >
      {markdownContent}
    </Content>
  );

  return (
    <Modal variant={ModalVariant.large} isOpen onClose={handleCloseModal} aria-labelledby="select-context-title">
      <ModalHeader labelId="select-context-title" title={`Markdown file view: ${markdownFile.filename}`} />
      <ModalBody id="select-context-body" style={{ paddingTop: 0, marginTop: MdSpacer.var }}>
        {loading ? (
          <Bullseye style={{ height: 250 }}>
            <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>
                <Spinner />
              </FlexItem>
              <FlexItem>Loading file content...</FlexItem>
            </Flex>
          </Bullseye>
        ) : (
          contents
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="link" onClick={handleCloseModal}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default MarkdownFileViewer;
