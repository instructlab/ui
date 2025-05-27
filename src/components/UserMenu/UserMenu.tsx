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
        <MenuToggle
          style={{ paddingTop: 0, paddingBottom: 0 }}
          ref={toggleRef}
          aria-label="user menu dropdown"
          variant="plain"
          onClick={onToggleClick}
          isExpanded={isOpen}
        >
          <Flex gap={{ default: 'gapSm' }} style={{ display: 'flex', alignItems: 'center' }}>
            {userImage ? (
              <Avatar src={userImage} alt={userName} style={{ width: 36, height: 36 }} />
            ) : (
              <Avatar src="/default-avatar.png" alt="Default Avatar" />
            )}
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
