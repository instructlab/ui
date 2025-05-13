import * as React from 'react';
import {
  Button,
  Flex,
  FlexItem,
  MenuToggle,
  SearchInput,
  Select,
  SelectList,
  SelectOption,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarGroup,
  ToolbarItem
} from '@patternfly/react-core';
import { PficonSortCommonAscIcon, PficonSortCommonDescIcon, TableIcon, ThLargeIcon } from '@patternfly/react-icons';
import { SORT_ASCENDING, SORT_DESCENDING, SORT_BY_NAME, SORT_BY_LAST_UPDATE, SortTitles } from '@/components/Documents/const';

interface Props {
  currentFilter?: string;
  onFilterUpdate: (value?: string) => void;
  isTableView: boolean;
  setIsTableView: (value: boolean) => void;
  currentSort: string;
  setCurrentSort: (newSort: string) => void;
  currentSortDirection: string;
  setCurrentSortDirection: (newSort: string) => void;
}

const DocumentsToolbar: React.FC<Props> = ({
  currentFilter = '',
  onFilterUpdate,
  isTableView,
  setIsTableView,
  currentSort,
  setCurrentSort,
  currentSortDirection,
  setCurrentSortDirection
}) => {
  const [isSortValueOpen, setIsSortValueOpen] = React.useState<boolean>(false);

  return (
    <Toolbar hasNoPadding={isTableView}>
      <ToolbarGroup>
        <ToolbarItem>
          <SearchInput
            aria-label="search documents by file name"
            placeholder="Find by name"
            value={currentFilter}
            onChange={(_ev, value) => onFilterUpdate(value)}
          />
        </ToolbarItem>
        <ToolbarItem>
          <ToggleGroup aria-label="toggle view">
            <ToggleGroupItem icon={<TableIcon />} aria-label="table view" isSelected={isTableView} onChange={() => setIsTableView(true)} />
            <ToggleGroupItem icon={<ThLargeIcon />} aria-label="table view" isSelected={!isTableView} onChange={() => setIsTableView(false)} />
          </ToggleGroup>
        </ToolbarItem>
        {!isTableView ? (
          <>
            <ToolbarItem>
              <Flex gap={{ default: 'gapXs' }} flexWrap={{ default: 'nowrap' }}>
                <FlexItem>
                  <Select
                    id="sort-value"
                    aria-label="Select sort type"
                    isOpen={isSortValueOpen}
                    selected={currentSort}
                    onSelect={(_ev, value) => {
                      setCurrentSort(String(value));
                      setIsSortValueOpen(false);
                    }}
                    onOpenChange={(isOpen) => setIsSortValueOpen(isOpen)}
                    toggle={(toggleRef) => (
                      <MenuToggle ref={toggleRef} onClick={() => setIsSortValueOpen((prev) => !prev)} isExpanded={isSortValueOpen}>
                        Sort by {currentSort}
                      </MenuToggle>
                    )}
                    shouldFocusToggleOnSelect
                  >
                    <SelectList>
                      <SelectOption value={SORT_BY_NAME}>{SortTitles[SORT_BY_NAME]}</SelectOption>
                      <SelectOption value={SORT_BY_LAST_UPDATE}>{SortTitles[SORT_BY_LAST_UPDATE]}</SelectOption>
                    </SelectList>
                  </Select>
                </FlexItem>
                <FlexItem>
                  <Button
                    variant="plain"
                    icon={
                      currentSortDirection === SORT_ASCENDING ? (
                        <PficonSortCommonAscIcon alt={SORT_ASCENDING} />
                      ) : (
                        <PficonSortCommonDescIcon alt={SORT_DESCENDING} />
                      )
                    }
                    aria-label={currentSortDirection === SORT_ASCENDING ? SORT_ASCENDING : SORT_DESCENDING}
                    onClick={() => setCurrentSortDirection(currentSortDirection === SORT_ASCENDING ? SORT_DESCENDING : SORT_ASCENDING)}
                  />
                </FlexItem>
              </Flex>
            </ToolbarItem>
            <ToolbarItem></ToolbarItem>
          </>
        ) : null}
        <ToolbarItem></ToolbarItem>
      </ToolbarGroup>
    </Toolbar>
  );
};

export default DocumentsToolbar;
