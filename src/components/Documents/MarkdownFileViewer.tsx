// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React from 'react';
import { Button, Content, Modal, ModalFooter, ModalHeader, ModalBody, ModalVariant } from '@patternfly/react-core';
import { t_global_background_color_secondary_default as PreBackgroundColor, t_global_spacer_md as MdSpacer } from '@patternfly/react-tokens';
import { KnowledgeFile } from '@/types';

interface Props {
  markdownFile: KnowledgeFile;
  handleCloseModal: () => void;
}

const MarkdownFileViewer: React.FC<Props> = ({ markdownFile, handleCloseModal }) => (
  <Modal variant={ModalVariant.large} isOpen onClose={handleCloseModal} aria-labelledby="select-context-title">
    <ModalHeader labelId="select-context-title" title={`Markdown file view: ${markdownFile.filename}`} />
    <ModalBody id="select-context-body" style={{ paddingTop: 0, marginTop: MdSpacer.var }}>
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
        {markdownFile.content}
      </Content>
    </ModalBody>
    <ModalFooter>
      <Button variant="link" onClick={handleCloseModal}>
        Close
      </Button>
    </ModalFooter>
  </Modal>
);

export default MarkdownFileViewer;
