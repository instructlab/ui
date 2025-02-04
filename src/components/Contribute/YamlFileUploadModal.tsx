import React from 'react';
import YamlFileUpload from './YamlFileUpload';
import { KnowledgeYamlData, SkillYamlData } from '@/types';
import { Modal, ModalVariant, ModalHeader, ModalBody } from '@patternfly/react-core';
import { ActionGroupAlertContent } from './Knowledge/Github';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isKnowledgeForm: boolean;
  onYamlUploadKnowledgeFillForm?: (data: KnowledgeYamlData) => void;
  onYamlUploadSkillsFillForm?: (data: SkillYamlData) => void;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

export const YamlFileUploadModal: React.FunctionComponent<Props> = ({
  isModalOpen,
  setIsModalOpen,
  isKnowledgeForm,
  onYamlUploadKnowledgeFillForm,
  onYamlUploadSkillsFillForm,
  setActionGroupAlertContent
}) => {
  const handleModalToggle = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <React.Fragment>
      <Modal
        variant={ModalVariant.small}
        title="Variant modal"
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        aria-labelledby="variant-modal-title"
        aria-describedby="modal-box-body-variant"
      >
        <ModalHeader title="Upload YAML file" labelId="variant-modal-title" />
        <ModalBody id="modal-box-body-variant">
          Uploading your YAML will bring in all its data and streamline the contribution process.
          <YamlFileUpload
            setIsModalOpen={setIsModalOpen}
            isKnowledgeForm={isKnowledgeForm}
            onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
            onYamlUploadSkillsFillForm={onYamlUploadSkillsFillForm}
            setActionGroupAlertContent={setActionGroupAlertContent}
          />
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};
