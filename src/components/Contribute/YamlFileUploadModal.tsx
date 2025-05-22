import React from 'react';
import YamlFileUpload from './YamlFileUpload';
import { KnowledgeYamlData, SkillYamlData } from '@/types';
import { Modal, ModalVariant, ModalHeader, ModalBody, Flex, FlexItem } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

interface Props {
  isKnowledgeForm: boolean;
  onYamlUploadKnowledgeFillForm?: (data: KnowledgeYamlData) => void;
  onYamlUploadSkillsFillForm?: (data: SkillYamlData) => void;
  setActionGroupAlertContent: (alertContent: ActionGroupAlertContent | undefined) => void;
  onClose: () => void;
}

export const YamlFileUploadModal: React.FunctionComponent<Props> = ({
  isKnowledgeForm,
  onYamlUploadKnowledgeFillForm,
  onYamlUploadSkillsFillForm,
  setActionGroupAlertContent,
  onClose
}) => {
  return (
    <React.Fragment>
      <Modal
        variant={ModalVariant.small}
        title="Variant modal"
        isOpen
        onClose={onClose}
        aria-labelledby="variant-modal-title"
        aria-describedby="modal-box-body-variant"
      >
        <ModalHeader title="Upload YAML file" labelId="variant-modal-title" />
        <ModalBody id="modal-box-body-variant">
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
            <FlexItem>Uploading your YAML will bring in all its data and streamline the contribution process.</FlexItem>
            <FlexItem>
              <YamlFileUpload
                isKnowledgeForm={isKnowledgeForm}
                onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
                onYamlUploadSkillsFillForm={onYamlUploadSkillsFillForm}
                setActionGroupAlertContent={setActionGroupAlertContent}
              />
            </FlexItem>
          </Flex>
        </ModalBody>
      </Modal>
    </React.Fragment>
  );
};
