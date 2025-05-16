import React, { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Dropdown, MenuToggleElement, MenuToggle, Flex, FlexItem, Avatar, DropdownList, DropdownItem } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import { useUserInfo } from '@/hooks/useUserInfo';

const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const { userName, userImage } = useUserInfo();

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const onSelect = () => {
    setIsOpen(false);
  };

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={onSelect}
      onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle ref={toggleRef} aria-label="user menu dropdown" variant="plain" onClick={onToggleClick} isExpanded={isOpen}>
          <Flex spaceItems={{ default: 'spaceItemsSm' }} style={{ display: 'flex', alignItems: 'center' }}>
            <FlexItem>{userImage ? <Avatar src={userImage} alt={userName} /> : <Avatar src="/default-avatar.png" alt="Default Avatar" />}</FlexItem>
            <FlexItem>{userName}</FlexItem>
            <FlexItem>
              <CaretDownIcon />
            </FlexItem>
          </Flex>
        </MenuToggle>
      )}
      shouldFocusToggleOnSelect
      style={{ position: 'relative' }}
    >
      <DropdownList>
        <DropdownItem key="Log out" onClick={() => signOut()}>
          Log out
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default UserMenu;
