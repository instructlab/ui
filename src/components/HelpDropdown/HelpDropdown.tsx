import { Dropdown, MenuToggleElement, MenuToggle, DropdownList, DropdownItem, Flex, FlexItem } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import React, { useCallback, useState } from 'react';
import AboutInstructLab from '../AboutModal/AboutModal';

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
            <OutlinedQuestionCircleIcon />
          </MenuToggle>
        )}
        shouldFocusToggleOnSelect
        style={{ position: 'relative' }}
      >
        <DropdownList
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            minWidth: '200px',
            width: 'auto',
            // backgroundColor: '#fff',
            border: ' 1px solid #ccc',
            zIndex: 1000
          }}
        >
          <DropdownItem value={0} key="documentation" target="_blank" to="https://github.com/instructlab/instructlab/blob/main/README.md">
            <Flex spaceItems={{ default: 'spaceItemsXl' }}>
              <FlexItem>Documentation</FlexItem>
              <FlexItem>
                <ExternalLinkAltIcon style={{ color: '#2b9af3' }} />
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
