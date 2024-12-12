import React, { useState } from 'react';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import YamlCodeModal from '@/components/YamlCodeModal';
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import { AttributionData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import FileIcon from '@patternfly/react-icons/dist/dynamic/icons/file-icon';
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon';

interface Props {
  knowledgeFormData: KnowledgeFormData;
  githubUsername: string | undefined;
}

export const ViewDropdown: React.FunctionComponent<Props> = ({ knowledgeFormData, githubUsername }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('');

  const handleViewYaml = () => {
    const yamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
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
      <YamlCodeModal isModalOpen={isModalOpen} handleModalToggle={() => setIsModalOpen(!isModalOpen)} yamlContent={modalContent} />
      <Dropdown
        isOpen={isOpen}
        onSelect={onSelect}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
            <EyeIcon />
            View
          </MenuToggle>
        )}
        ouiaId="DownloadDropdown"
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          <DropdownItem key="view-yaml" onClick={handleViewYaml}>
            <CodeIcon /> YAML Content
          </DropdownItem>
          <DropdownItem key="view-attribution" onClick={handleViewAttribution}>
            <FileIcon /> Attribution Content
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};
