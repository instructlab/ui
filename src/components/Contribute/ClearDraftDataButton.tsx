import * as React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { t_global_spacer_md as MdSpacer } from '@patternfly/react-tokens';
import { clearAllDraftData } from '@/components/Contribute/Utils/autoSaveUtils';

interface Props {
  onCleared: () => void;
}
const ClearDraftDataButton: React.FC<Props> = ({ onCleared }) => {
  const [isConfirmOpen, setIsConfirmOpen] = React.useState<boolean>(false);

  const handleClearDraftData = () => {
    clearAllDraftData();
    setIsConfirmOpen(false);
    onCleared();
  };

  return (
    <span style={{ marginLeft: MdSpacer.var }}>
      <Button variant="secondary" onClick={() => setIsConfirmOpen(true)}>
        Clear all draft data
      </Button>
      {isConfirmOpen ? (
        <Modal variant={ModalVariant.small} isOpen onClose={() => setIsConfirmOpen(false)} aria-labelledby="clear-drafts-modal-title">
          <ModalHeader title="Clear all draft data" labelId="clear-drafts-modal-title" titleIconVariant="warning" />
          <ModalBody id="publish-contribution-body-variant">
            <p>Are you sure you want to clear all draft data?</p>
          </ModalBody>
          <ModalFooter>
            <Button key="confirm" variant="primary" onClick={() => handleClearDraftData()}>
              Clear draft data
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => setIsConfirmOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </span>
  );
};

export default ClearDraftDataButton;
