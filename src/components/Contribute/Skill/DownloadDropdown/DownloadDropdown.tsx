import React from 'react';
import DownloadYaml from '../DownloadYaml/DownloadYaml';
import DownloadAttribution from '../DownloadAttribution/DownloadAttribution';
import { SkillFormData } from '@/types';
import { Dropdown, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { DownloadIcon } from '@patternfly/react-icons';

interface Props {
  skillFormData: SkillFormData;
  githubUsername: string | undefined;
}

export const DownloadDropdown: React.FunctionComponent<Props> = ({ skillFormData, githubUsername }) => {
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
        <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
          <DownloadIcon /> Download
        </MenuToggle>
      )}
      ouiaId="DownloadDropdown"
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <DownloadYaml skillFormData={skillFormData} githubUsername={githubUsername} />
        <DownloadAttribution skillFormData={skillFormData} />
      </DropdownList>
    </Dropdown>
  );
};
