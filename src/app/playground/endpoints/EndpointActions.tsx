'use client';

import React from 'react';
import { Button, Dropdown, DropdownList, DropdownItem, MenuToggle, Divider } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { Endpoint } from '@/types';

interface Props {
  endpoint: Endpoint;
  onToggleEnabled: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const EndpointActions: React.FC<Props> = ({ endpoint, onToggleEnabled, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

  return (
    <>
      <Button variant="secondary" onClick={onToggleEnabled}>
        {endpoint.enabled ? 'Disable' : 'Enable'}
      </Button>
      <Dropdown
        isOpen={menuOpen}
        onSelect={() => setMenuOpen(false)}
        onOpenChange={(isOpen: boolean) => setMenuOpen(isOpen)}
        toggle={(toggleRef) => (
          <MenuToggle aria-label="actions" variant="plain" ref={toggleRef} onClick={() => setMenuOpen((prev) => !prev)} isExpanded={menuOpen}>
            <EllipsisVIcon />
          </MenuToggle>
        )}
        popperProps={{ position: 'right' }}
        ouiaId="ModelEndpointDropdown"
      >
        <DropdownList>
          <DropdownItem onClick={onEdit}>Edit</DropdownItem>
          <Divider component="li" />
          <DropdownItem key="delete" onClick={onDelete} className="destructive-action-item">
            <span>Delete endpoint</span>
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    </>
  );
};

export default EndpointActions;
