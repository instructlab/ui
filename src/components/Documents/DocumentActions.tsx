import * as React from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle, MenuToggleElement } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { KnowledgeFile } from '@/types';
import DeleteDocumentModal from '@/components/Documents/DeleteDocumentModal';

interface Props {
  document: KnowledgeFile;
  onRemove: () => void;
}

const DocumentActions: React.FC<Props> = ({ document, onRemove }) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);

  const handleDeleteDocumentConfirm = async (doDelete: boolean) => {
    setIsDeleteModalOpen(false);
    if (doDelete) {
      onRemove();
    }
  };

  return (
    <>
      <Dropdown
        onSelect={() => setIsActionMenuOpen(false)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isActionMenuOpen}
            onClick={() => setIsActionMenuOpen((prev) => !prev)}
            variant="plain"
            aria-label="document action menu"
            icon={<EllipsisVIcon aria-hidden="true" />}
          />
        )}
        isOpen={isActionMenuOpen}
        onOpenChange={(isOpen: boolean) => setIsActionMenuOpen(isOpen)}
        popperProps={{ position: 'end' }}
      >
        <DropdownList>
          <DropdownItem className="destructive-action-item" key="delete-document" onClick={() => setIsDeleteModalOpen(true)}>
            Delete document
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      {isDeleteModalOpen ? <DeleteDocumentModal document={document} onClose={handleDeleteDocumentConfirm} /> : null}
    </>
  );
};

export default DocumentActions;
