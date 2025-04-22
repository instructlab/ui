// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs.tsx
import React from 'react';
import {
  Button,
  Content,
  HelperText,
  HelperTextItem,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalVariant,
  ValidatedOptions
} from '@patternfly/react-core';
import {
  t_global_background_color_secondary_default as PreBackgroundColor,
  t_global_spacer_xs as XsSpacer,
  t_global_spacer_md as MdSpacer,
  t_global_spacer_lg as LgSpacer
} from '@patternfly/react-tokens';
import { KnowledgeFile } from '@/types';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { getWordCount } from '@/components/Contribute/Utils/contributionUtils';

interface Props {
  knowledgeFile: KnowledgeFile;
  initialSelection?: string;
  handleContextInputChange: (contextValue: string) => void;
  handleCloseModal: () => void;
}

const KnowledgeFileSelectModal: React.FC<Props> = ({ knowledgeFile, initialSelection, handleContextInputChange, handleCloseModal }) => {
  const [selectedText, setSelectedText] = React.useState<string>('');
  const selectedWordCount = getWordCount(selectedText?.trim());

  // Ref for the <pre> element to track selections TODO: figure out how to make text expansions taller in PF without a custom-pre
  const preRef = React.useRef<HTMLPreElement | null>(null);

  const setWindowSelection = React.useCallback(
    (ref: HTMLPreElement | null, currentSelectionText?: string) => {
      const selection = window.getSelection();
      if (ref && currentSelectionText && selection && knowledgeFile.content) {
        const index = knowledgeFile.content.indexOf(currentSelectionText);
        if (index >= 0) {
          const range = document.createRange();
          range.setStart(ref.childNodes[0], index);
          range.setEnd(ref.childNodes[0], index + currentSelectionText.length);

          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    },
    [knowledgeFile.content]
  );

  const setPreRef = React.useCallback(
    (ref: HTMLPreElement | null) => {
      preRef.current = ref;
      setWindowSelection(ref, initialSelection);
    },
    [initialSelection, setWindowSelection]
  );

  // Attach event listeners for selection changes
  React.useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const preElement = preRef.current;

      if (selection && preElement) {
        const newSelectedText = selection.toString();
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;

        if (newSelectedText && preElement.contains(anchorNode) && preElement.contains(focusNode)) {
          setSelectedText(newSelectedText);
          return;
        }
        setWindowSelection(preRef.current, selectedText);
      }
    };
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [setWindowSelection, selectedText]);

  const handleUseSelectedText = () => {
    if (!selectedText) {
      alert('Please select the text you want to use as context.');
      return;
    }

    handleContextInputChange(selectedText.trim());
    handleCloseModal();
  };

  const handleSelectionStart = (event: React.MouseEvent) => {
    if (event.shiftKey) {
      return;
    }
    setSelectedText('');
  };

  // Update word count whenever context changes
  return (
    <Modal variant={ModalVariant.large} isOpen onClose={handleCloseModal} aria-labelledby="select-context-title">
      <ModalHeader
        labelId="select-context-title"
        title="Select Context"
        description="To create a context, highlight 500 words or less. Selecting a combination of simple and complex contexts you can help prepare your model to handle various needs."
      />
      <ModalBody id="select-context-body" style={{ paddingTop: 0, marginTop: MdSpacer.var }}>
        <Content
          component="pre"
          ref={setPreRef}
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            backgroundColor: PreBackgroundColor.var,
            padding: MdSpacer.var,
            userSelect: 'text'
          }}
          onMouseDown={handleSelectionStart}
        >
          {knowledgeFile.content}
        </Content>
      </ModalBody>
      <HelperText style={{ paddingLeft: LgSpacer.var, paddingTop: XsSpacer.var }}>
        <HelperTextItem
          icon={selectedWordCount > 500 ? <ExclamationCircleIcon /> : undefined}
          variant={selectedWordCount > 500 ? ValidatedOptions.error : ValidatedOptions.default}
        >
          {selectedWordCount} / 500 words
        </HelperTextItem>
      </HelperText>
      <ModalFooter>
        <Button variant="primary" onClick={() => handleUseSelectedText()} isDisabled={selectedWordCount === 0 || selectedWordCount > 500}>
          Create context
        </Button>
        <Button variant="link" onClick={handleCloseModal}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default KnowledgeFileSelectModal;
