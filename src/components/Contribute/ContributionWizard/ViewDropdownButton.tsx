import React, { useState } from 'react';
import YamlCodeModal from '@/components/YamlCodeModal';
import { AttributionData, ContributionFormData, KnowledgeFormData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import { Dropdown, MenuToggleElement, Icon, DropdownList, DropdownItem, Button, Flex, FlexItem } from '@patternfly/react-core';
import { CodeIcon, FileIcon, CaretDownIcon } from '@patternfly/react-icons';

interface Props {
  formData: ContributionFormData;
  convertToYaml: (formData: ContributionFormData) => unknown;
  isGithubMode: boolean;
  isSkillContribution: boolean;
}

export const ViewDropdownButton: React.FunctionComponent<Props> = ({ formData, convertToYaml, isGithubMode, isSkillContribution }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState<string>('');

  const handleViewYaml = () => {
    const yamlData = convertToYaml(formData);
    const yamlString = dumpYaml(yamlData);
    setModalContent(yamlString);
    setIsModalOpen(true);
  };

  const handleSaveYaml = () => {
    const yamlData = convertToYaml(formData);
    const yamlString = dumpYaml(yamlData);
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = isSkillContribution ? 'skill.yaml' : 'knowledge.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewAttribution = () => {
    const attributionData: AttributionData = {
      title_of_work: formData.titleWork!,
      link_to_work: (formData as KnowledgeFormData).linkWork!,
      revision: (formData as KnowledgeFormData).revision!,
      license_of_the_work: formData.licenseWork!,
      creator_names: formData.creators
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
      <YamlCodeModal
        isModalOpen={isModalOpen}
        handleModalToggle={() => setIsModalOpen(!isModalOpen)}
        yamlContent={modalContent}
        onSave={handleSaveYaml}
      />
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
