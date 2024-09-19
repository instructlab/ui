import React, { useCallback, useState } from 'react';
import { Flex, FlexItem } from '@patternfly/react-core/dist/esm/layouts/Flex';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/esm/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/esm/components/MenuToggle';
import { ExternalLinkAltIcon } from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/outlined-question-circle-icon';
import AboutModal from '../AboutModal/AboutModal';

const HelpDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    // eslint-disable-next-line no-console
    console.log('selected', value);
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
            backgroundColor: '#fff',
            border: ' 1px solid #ccc',
            zIndex: 1000
          }}
        >
          <DropdownItem value={0} key="link" target="_blank" to="https://github.com/instructlab/instructlab/blob/main/README.md">
            <Flex spaceItems={{ default: 'spaceItemsXl' }}>
              <FlexItem>Documentation</FlexItem>
              <FlexItem>
                <ExternalLinkAltIcon style={{ color: '#2b9af3' }} />
              </FlexItem>
            </Flex>
          </DropdownItem>

          <DropdownItem value={1} key="link" to="#tbd">
            Help
          </DropdownItem>
          <DropdownItem value={2} key="link" to="#about" onClick={handleAboutUsModalOpen}>
            About
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      <AboutModal isOpen={isAboutModalOpen} setIsOpen={setIsAboutModalOpen} />
    </>
  );
};

export default HelpDropdown;
