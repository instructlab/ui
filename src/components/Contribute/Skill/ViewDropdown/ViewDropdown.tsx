import React, { useState } from 'react';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { SkillFormData } from '..';
import YamlCodeModal from '@/components/YamlCodeModal';
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import { AttributionData, SkillYamlData } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import FileIcon from '@patternfly/react-icons/dist/dynamic/icons/file-icon';
import EyeIcon from '@patternfly/react-icons/dist/esm/icons/eye-icon';

interface Props {
  skillFormData: SkillFormData;
  githubUsername: string | undefined;
}

export const ViewDropdown: React.FunctionComponent<Props> = ({ skillFormData, githubUsername }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('');

  const handleViewYaml = () => {
    const yamlData: SkillYamlData = {
      created_by: githubUsername!,
      version: SkillSchemaVersion,
      task_description: skillFormData.documentOutline!,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.question,
        answer: example.answer
      }))
    };
    const yamlString = dumpYaml(yamlData);
    setModalContent(yamlString);
    setIsModalOpen(true);
  };

  const handleViewAttribution = () => {
    const attributionData: AttributionData = {
      title_of_work: skillFormData.titleWork!,
      license_of_the_work: skillFormData.licenseWork!,
      creator_names: skillFormData.creators
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
          <DropdownItem key="view yaml" onClick={handleViewYaml}>
            <CodeIcon /> YAML Content
          </DropdownItem>
          <DropdownItem key="view yaml" onClick={handleViewAttribution}>
            <FileIcon /> Attribution Content
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};
