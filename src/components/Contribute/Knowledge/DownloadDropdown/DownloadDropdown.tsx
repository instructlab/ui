import React from 'react';
import DownloadYaml from '../DownloadYaml/DownloadYaml';
import DownloadAttribution from '../DownloadAttribution/DownloadAttribution';
import { KnowledgeFormData } from '@/types';
import { Dropdown, MenuToggleElement, MenuToggle, Icon, DropdownList } from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';

interface Props {
  knowledgeFormData: KnowledgeFormData;
  githubUsername: string | undefined;
  isGithubMode: boolean;
}

export const DownloadDropdown: React.FunctionComponent<Props> = ({ knowledgeFormData, githubUsername, isGithubMode }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    // eslint-disable-next-line no-console
    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          onClick={onToggleClick}
          isExpanded={isOpen}
          icon={
            <Icon>
              <DownloadIcon />{' '}
            </Icon>
          }
        >
          {' '}
          Download
        </MenuToggle>
      )}
      ouiaId="DownloadDropdown"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DownloadYaml knowledgeFormData={knowledgeFormData} githubUsername={githubUsername} />
        {isGithubMode && <DownloadAttribution knowledgeFormData={knowledgeFormData} />}
      </DropdownList>
    </Dropdown>
  );
};
