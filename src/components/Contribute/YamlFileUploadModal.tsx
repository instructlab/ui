import React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, ModalVariant, Radio } from '@patternfly/react-core';
import YamlFileUpload from './YamlFileUpload';
import { KnowledgeYamlData, SkillYamlData } from '@/types';

interface Props {
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isKnowledgeForm: boolean;
  onYamlUploadKnowledgeFillForm?: (data: KnowledgeYamlData) => void;
  onYamlUploadSkillsFillForm?: (data: SkillYamlData) => void;
}

export const YamlFileUploadModal: React.FunctionComponent<Props> = ({
  isModalOpen,
  setIsModalOpen,
  isKnowledgeForm,
  onYamlUploadKnowledgeFillForm,
  onYamlUploadSkillsFillForm
}) => {
  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
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
            isKnowledgeForm={isKnowledgeForm}
            onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
            onYamlUploadSkillsFillForm={onYamlUploadSkillsFillForm}
          />
        </ModalBody>
        <ModalFooter></ModalFooter>
      </Modal>
    </React.Fragment>
  );
};
