import { Dropdown, MenuToggleElement, MenuToggle, DropdownList, DropdownItem, Flex, FlexItem, Icon } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import React, { useCallback, useState } from 'react';
import AboutInstructLab from '../AboutModal/AboutModal';
import XsExternalLinkAltIcon from '@/components/Common/XsExternalLinkAltIcon';

const HelpDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  const handleAboutUsModalOpen = useCallback(() => {
    setIsAboutModalOpen(true);
  }, []);

  return (
    <>
      <Dropdown
        isOpen={isOpen}
        onSelect={onSelect}
        onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle ref={toggleRef} aria-label="help dropdown toggle" variant="plain" onClick={onToggleClick} isExpanded={isOpen}>
            <Icon size="xl">
              <OutlinedQuestionCircleIcon />
            </Icon>
          </MenuToggle>
        )}
        shouldFocusToggleOnSelect
        style={{ position: 'relative' }}
      >
        <DropdownList
          style={{
            right: 0,
            minWidth: '200px',
            width: 'auto',
            zIndex: 1000
          }}
        >
          <DropdownItem value={0} key="documentation" target="_blank" to="https://github.com/instructlab/instructlab/blob/main/README.md">
            <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
              <FlexItem>Documentation</FlexItem>
              <FlexItem>
                <XsExternalLinkAltIcon />
              </FlexItem>
            </Flex>
          </DropdownItem>

          <DropdownItem value={1} key="help" to="https://docs.instructlab.ai" target="_blank" rel="noopener noreferrer">
            Help
          </DropdownItem>
          <DropdownItem value={2} key="about" to="#about" onClick={handleAboutUsModalOpen}>
            About
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      <AboutInstructLab isOpen={isAboutModalOpen} setIsOpen={setIsAboutModalOpen} />
    </>
  );
};

export default HelpDropdown;
