import React, { useState } from 'react';
import YamlCodeModal from '@/components/YamlCodeModal';
import { AttributionData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { Dropdown, MenuToggleElement, Icon, DropdownList, DropdownItem, Button, Flex, FlexItem } from '@patternfly/react-core';
import { CodeIcon, FileIcon, CaretDownIcon } from '@patternfly/react-icons';

interface Props {
  knowledgeFormData: KnowledgeFormData;
  isGithubMode: boolean;
  onSave: () => void;
}

export const ViewDropdownButton: React.FunctionComponent<Props> = ({ knowledgeFormData, isGithubMode, onSave }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('');

  const handleViewYaml = () => {
    const yamlData: KnowledgeYamlData = {
      created_by: knowledgeFormData.email!,
      version: KnowledgeSchemaVersion,
      domain: knowledgeFormData.domain!,
      document_outline: knowledgeFormData.documentOutline!,
      seed_examples: knowledgeFormData.seedExamples.map((example) => ({
        context: example.context,
        questions_and_answers: example.questionAndAnswers.map((qa) => ({
          question: qa.question,
          answer: qa.answer
        }))
      })),
      document: {
        repo: knowledgeFormData.knowledgeDocumentRepositoryUrl!,
        commit: knowledgeFormData.knowledgeDocumentCommit!,
        patterns: knowledgeFormData.documentName ? knowledgeFormData.documentName!.split(',').map((pattern) => pattern.trim()) : ['']
      }
    };
    const yamlString = dumpYaml(yamlData);
    setModalContent(yamlString);
    setIsModalOpen(true);
  };

  const handleViewAttribution = () => {
    const attributionData: AttributionData = {
      title_of_work: knowledgeFormData.titleWork!,
      link_to_work: knowledgeFormData.linkWork!,
      revision: knowledgeFormData.revision!,
      license_of_the_work: knowledgeFormData.licenseWork!,
      creator_names: knowledgeFormData.creators
    };
    const attributionString = dumpYaml(attributionData);
    setModalContent(attributionString);
    setIsModalOpen(true);
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    // eslint-disable-next-line no-console
    setIsOpen(false);
  };

  return (
    <>
      <YamlCodeModal isModalOpen={isModalOpen} handleModalToggle={() => setIsModalOpen(!isModalOpen)} yamlContent={modalContent} onSave={onSave} />
      {isGithubMode ? (
        <Dropdown
          isOpen={isOpen}
          onSelect={onSelect}
          onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <Button variant="secondary" ref={toggleRef} onClick={onToggleClick}>
              <Flex gap={{ default: 'gapMd' }}>
                <FlexItem>YAML/Attribution files</FlexItem>
                <FlexItem>
                  <CaretDownIcon />
                </FlexItem>
              </Flex>
            </Button>
          )}
          ouiaId="DownloadDropdown"
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            <DropdownItem
              key="view-yaml"
              onClick={handleViewYaml}
              icon={
                <Icon>
                  <CodeIcon />
                </Icon>
              }
            >
              {' '}
              YAML Content
            </DropdownItem>
            {isGithubMode && (
              <DropdownItem
                key="view-attribution"
                onClick={handleViewAttribution}
                icon={
                  <Icon>
                    <FileIcon />
                  </Icon>
                }
              >
                {' '}
                Attribution Content
              </DropdownItem>
            )}
          </DropdownList>
        </Dropdown>
      ) : (
        <Button variant="secondary" onClick={handleViewYaml}>
          View YAML file
        </Button>
      )}
    </>
  );
};

export default ViewDropdownButton;
