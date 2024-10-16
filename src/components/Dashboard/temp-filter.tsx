import React from 'react';
import {
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  MenuToggleCheckbox,
  Popper,
  Pagination,
  EmptyState,
  EmptyStateHeader,
  EmptyStateFooter,
  EmptyStateBody,
  Button,
  Bullseye,
  Badge,
  ToolbarGroup,
  ToolbarFilter,
  ToolbarToggleGroup,
  EmptyStateActions,
  EmptyStateIcon,
  Card
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import SearchIcon from '@patternfly/react-icons/dist/esm/icons/search-icon';
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon';

// test
import { PullRequest } from '@/types';
import { Flex, FlexItem, Label } from '@patternfly/react-core';
import { useRouter } from 'next/navigation';

interface Repository {
  name: string;
  threads: string;
  apps: string;
  workspaces: string;
  status: string;
  location: string;
}

// In real usage, this data would come from some external source like an API via props.
const repositories: Repository[] = [
  { name: 'US-Node 1', threads: '5', apps: '25', workspaces: '5', status: 'Stopped', location: 'Raleigh' },
  { name: 'US-Node 2', threads: '5', apps: '30', workspaces: '2', status: 'Down', location: 'Westford' },
  { name: 'US-Node 3', threads: '13', apps: '35', workspaces: '12', status: 'Degraded', location: 'Boston' },
  { name: 'US-Node 4', threads: '2', apps: '5', workspaces: '18', status: 'Needs Maintenance', location: 'Raleigh' },
  { name: 'US-Node 5', threads: '7', apps: '30', workspaces: '5', status: 'Running', location: 'Boston' },
  { name: 'US-Node 6', threads: '5', apps: '20', workspaces: '15', status: 'Stopped', location: 'Raleigh' },
  { name: 'CZ-Node 1', threads: '12', apps: '48', workspaces: '13', status: 'Down', location: 'Brno' },
  { name: 'CZ-Node 2', threads: '3', apps: '8', workspaces: '20', status: 'Running', location: 'Brno' },
  { name: 'CZ-Remote-Node 1', threads: '1', apps: '15', workspaces: '20', status: 'Down', location: 'Brno' },
  { name: 'Bangalore-Node 1', threads: '1', apps: '20', workspaces: '20', status: 'Running', location: 'Bangalore' }
];

// const columnNames = {
//   name: 'Title',
//   threads: 'Threads',
//   apps: 'Applications',
//   workspaces: 'Workspaces',
//   status: 'Status',
//   location: 'Location'
// };

const columnNames = {
  title: 'Title',
  status: 'Status',
  created: 'Created',
  updated: 'Updated',
  labels: 'Labels',
  placeholder: ''
};

interface DasboardTableProps {
  rows: PullRequest[];
}

export const FilterAttributeSearch: React.FunctionComponent<DasboardTableProps> = ({ rows }) => {
  // Set up repo filtering
  const [searchValue, setSearchValue] = React.useState('');
  const [locationSelections, setLocationSelections] = React.useState<string[]>([]);
  const [statusSelection, setStatusSelection] = React.useState('');

  const onSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const onFilter = (row: PullRequest) => {
    // Search name with search value
    let searchValueInput: RegExp;
    try {
      searchValueInput = new RegExp(searchValue, 'i');
    } catch (err) {
      searchValueInput = new RegExp(searchValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    }
    const matchesSearchValue = row.title.search(searchValueInput) >= 0;

    // // Search status with status selection
    // const matchesStatusValue = repo.status.toLowerCase() === statusSelection.toLowerCase();

    // // Search location with location selections
    // const matchesLocationValue = locationSelections.includes(repo.location);

    return (
      searchValue === '' || matchesSearchValue
      //   (statusSelection === '' || matchesStatusValue) &&
      //   (locationSelections.length === 0 || matchesLocationValue)
    );
  };
  const filteredRepos = rows.filter(onFilter);

  // Set up table row selection
  // In this example, selected rows are tracked by the repo names from each row. This could be any unique identifier.
  // This is to prevent state from being based on row order index in case we later add sorting.
  const isRepoSelectable = (repo: Repository) => repo.name !== 'a'; // Arbitrary logic for this example
  const [selectedRepoNames, setSelectedRepoNames] = React.useState<string[]>([]);
  const setRepoSelected = (repo: Repository, isSelecting = true) =>
    setSelectedRepoNames((prevSelected) => {
      const otherSelectedRepoNames = prevSelected.filter((r) => r !== repo.name);
      return isSelecting && isRepoSelectable(repo) ? [...otherSelectedRepoNames, repo.name] : otherSelectedRepoNames;
    });
  const selectAllRepos = (isSelecting = true) => setSelectedRepoNames(isSelecting ? filteredRepos.map((r) => r.name) : []); // Selecting all should only select all currently filtered rows
  const areAllReposSelected = selectedRepoNames.length === filteredRepos.length && filteredRepos.length > 0;
  const areSomeReposSelected = selectedRepoNames.length > 0;
  const isRepoSelected = (repo: Repository) => selectedRepoNames.includes(repo.name);

  // To allow shift+click to select/deselect multiple rows
  const [recentSelectedRowIndex, setRecentSelectedRowIndex] = React.useState<number | null>(null);
  const [shifting, setShifting] = React.useState(false);

  const onSelectRepo = (repo: Repository, rowIndex: number, isSelecting: boolean) => {
    // If the user is shift + selecting the checkboxes, then all intermediate checkboxes should be selected
    if (shifting && recentSelectedRowIndex !== null) {
      const numberSelected = rowIndex - recentSelectedRowIndex;
      const intermediateIndexes =
        numberSelected > 0
          ? Array.from(new Array(numberSelected + 1), (_x, i) => i + recentSelectedRowIndex)
          : Array.from(new Array(Math.abs(numberSelected) + 1), (_x, i) => i + rowIndex);
      intermediateIndexes.forEach((index) => setRepoSelected(repositories[index], isSelecting));
    } else {
      setRepoSelected(repo, isSelecting);
    }
    setRecentSelectedRowIndex(rowIndex);
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShifting(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Set up bulk selection menu
  //   const bulkSelectMenuRef = React.useRef<HTMLDivElement>(null);
  //   const bulkSelectToggleRef = React.useRef<any>(null);
  //   const bulkSelectContainerRef = React.useRef<HTMLDivElement>(null);

  //   const [isBulkSelectOpen, setIsBulkSelectOpen] = React.useState<boolean>(false);

  //   const handleBulkSelectClickOutside = (event: MouseEvent) => {
  //     if (isBulkSelectOpen && !bulkSelectMenuRef.current?.contains(event.target as Node)) {
  //       setIsBulkSelectOpen(false);
  //     }
  //   };

  //   const handleBulkSelectMenuKeys = (event: KeyboardEvent) => {
  //     if (!isBulkSelectOpen) {
  //       return;
  //     }
  //     if (bulkSelectMenuRef.current?.contains(event.target as Node) || bulkSelectToggleRef.current?.contains(event.target as Node)) {
  //       if (event.key === 'Escape' || event.key === 'Tab') {
  //         setIsBulkSelectOpen(!isBulkSelectOpen);
  //         bulkSelectToggleRef.current?.querySelector('button').focus();
  //       }
  //     }
  //   };

  //   React.useEffect(() => {
  //     window.addEventListener('keydown', handleBulkSelectMenuKeys);
  //     window.addEventListener('click', handleBulkSelectClickOutside);
  //     return () => {
  //       window.removeEventListener('keydown', handleBulkSelectMenuKeys);
  //       window.removeEventListener('click', handleBulkSelectClickOutside);
  //     };
  //   }, [isBulkSelectOpen, bulkSelectMenuRef]);

  //   const onBulkSelectToggleClick = (ev: React.MouseEvent) => {
  //     ev.stopPropagation(); // Stop handleClickOutside from handling
  //     setTimeout(() => {
  //       if (bulkSelectMenuRef.current) {
  //         const firstElement = bulkSelectMenuRef.current.querySelector('li > button:not(:disabled)');
  //         firstElement && (firstElement as HTMLElement).focus();
  //       }
  //     }, 0);
  //     setIsBulkSelectOpen(!isBulkSelectOpen);
  //   };

  //   let menuToggleCheckmark: boolean | null = false;
  //   if (areAllReposSelected) {
  //     menuToggleCheckmark = true;
  //   } else if (areSomeReposSelected) {
  //     menuToggleCheckmark = null;
  //   }

  //   const bulkSelectToggle = (
  //     <MenuToggle
  //       ref={bulkSelectToggleRef}
  //       onClick={onBulkSelectToggleClick}
  //       isExpanded={isBulkSelectOpen}
  //       splitButtonOptions={{
  //         items: [
  //           <MenuToggleCheckbox
  //             id="attribute-search-input-bulk-select"
  //             key="attribute-search-input-bulk-select"
  //             aria-label="Select all"
  //             isChecked={menuToggleCheckmark}
  //             onChange={(checked, _event) => selectAllRepos(checked)}
  //           />
  //         ]
  //       }}
  //       aria-label="Full table selection checkbox"
  //     />
  //   );

  //   const bulkSelectMenu = (
  //     <Menu
  //       id="attribute-search-input-bulk-select"
  //       ref={bulkSelectMenuRef}
  //       onSelect={(_ev, itemId) => {
  //         selectAllRepos(itemId === 1 || itemId === 2);
  //         setIsBulkSelectOpen(!isBulkSelectOpen);
  //         bulkSelectToggleRef.current?.querySelector('button').focus();
  //       }}
  //     >
  //       <MenuContent>
  //         <MenuList>
  //           <MenuItem itemId={0}>Select none (0 items)</MenuItem>
  //           <MenuItem itemId={1}>Select page ({repositories.length} items)</MenuItem>
  //           <MenuItem itemId={2}>Select all ({repositories.length} items)</MenuItem>
  //         </MenuList>
  //       </MenuContent>
  //     </Menu>
  //   );

  //   const toolbarBulkSelect = (
  //     <div ref={bulkSelectContainerRef}>
  //       <Popper
  //         trigger={bulkSelectToggle}
  //         triggerRef={bulkSelectToggleRef}
  //         popper={bulkSelectMenu}
  //         popperRef={bulkSelectMenuRef}
  //         appendTo={bulkSelectContainerRef.current || undefined}
  //         isVisible={isBulkSelectOpen}
  //       />
  //     </div>
  //   );

  // Set up name search input
  const searchInput = (
    <SearchInput
      placeholder="Filter by server name"
      value={searchValue}
      onChange={(_event, value) => onSearchChange(value)}
      onClear={() => onSearchChange('')}
    />
  );

  // Set up status single select
  const [isStatusMenuOpen, setIsStatusMenuOpen] = React.useState<boolean>(false);
  const statusToggleRef = React.useRef<HTMLButtonElement>(null);
  const statusMenuRef = React.useRef<HTMLDivElement>(null);
  const statusContainerRef = React.useRef<HTMLDivElement>(null);

  const handleStatusMenuKeys = (event: KeyboardEvent) => {
    if (isStatusMenuOpen && statusMenuRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsStatusMenuOpen(!isStatusMenuOpen);
        statusToggleRef.current?.focus();
      }
    }
  };

  const handleStatusClickOutside = (event: MouseEvent) => {
    if (isStatusMenuOpen && !statusMenuRef.current?.contains(event.target as Node)) {
      setIsStatusMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleStatusMenuKeys);
    window.addEventListener('click', handleStatusClickOutside);
    return () => {
      window.removeEventListener('keydown', handleStatusMenuKeys);
      window.removeEventListener('click', handleStatusClickOutside);
    };
  }, [isStatusMenuOpen, statusMenuRef]);

  const onStatusToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (statusMenuRef.current) {
        const firstElement = statusMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsStatusMenuOpen(!isStatusMenuOpen);
  };

  function onStatusSelect(event: React.MouseEvent | undefined, itemId: string | number | undefined) {
    if (typeof itemId === 'undefined') {
      return;
    }

    setStatusSelection(itemId.toString());
    setIsStatusMenuOpen(!isStatusMenuOpen);
  }

  const statusToggle = (
    <MenuToggle
      ref={statusToggleRef}
      onClick={onStatusToggleClick}
      isExpanded={isStatusMenuOpen}
      style={
        {
          width: '200px'
        } as React.CSSProperties
      }
    >
      Filter by status
    </MenuToggle>
  );

  const statusMenu = (
    <Menu ref={statusMenuRef} id="attribute-search-status-menu" onSelect={onStatusSelect} selected={statusSelection}>
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Degraded">Degraded</MenuItem>
          <MenuItem itemId="Down">Down</MenuItem>
          <MenuItem itemId="Needs maintenance">Needs maintenance</MenuItem>
          <MenuItem itemId="Running">Running</MenuItem>
          <MenuItem itemId="Stopped">Stopped</MenuItem>
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const statusSelect = (
    <div ref={statusContainerRef}>
      <Popper
        trigger={statusToggle}
        triggerRef={statusToggleRef}
        popper={statusMenu}
        popperRef={statusMenuRef}
        appendTo={statusContainerRef.current || undefined}
        isVisible={isStatusMenuOpen}
      />
    </div>
  );

  // Set up location checkbox select
  const [isLocationMenuOpen, setIsLocationMenuOpen] = React.useState<boolean>(false);
  const locationToggleRef = React.useRef<HTMLButtonElement>(null);
  const locationMenuRef = React.useRef<HTMLDivElement>(null);

  const handleLocationMenuKeys = (event: KeyboardEvent) => {
    if (isLocationMenuOpen && locationMenuRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsLocationMenuOpen(!isLocationMenuOpen);
        locationToggleRef.current?.focus();
      }
    }
  };

  const handleLocationClickOutside = (event: MouseEvent) => {
    if (isLocationMenuOpen && !locationMenuRef.current?.contains(event.target as Node)) {
      setIsLocationMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleLocationMenuKeys);
    window.addEventListener('click', handleLocationClickOutside);
    return () => {
      window.removeEventListener('keydown', handleLocationMenuKeys);
      window.removeEventListener('click', handleLocationClickOutside);
    };
  }, [isLocationMenuOpen, locationMenuRef]);

  // Set up attribute selector
  const [activeAttributeMenu, setActiveAttributeMenu] = React.useState<'Title' | 'Status' | 'Location'>('Title');
  const [isAttributeMenuOpen, setIsAttributeMenuOpen] = React.useState(false);
  const attributeToggleRef = React.useRef<HTMLButtonElement>(null);
  const attributeMenuRef = React.useRef<HTMLDivElement>(null);
  const attributeContainerRef = React.useRef<HTMLDivElement>(null);

  const handleAttribueMenuKeys = (event: KeyboardEvent) => {
    if (!isAttributeMenuOpen) {
      return;
    }
    if (attributeMenuRef.current?.contains(event.target as Node) || attributeToggleRef.current?.contains(event.target as Node)) {
      if (event.key === 'Escape' || event.key === 'Tab') {
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
        attributeToggleRef.current?.focus();
      }
    }
  };

  const handleAttributeClickOutside = (event: MouseEvent) => {
    if (isAttributeMenuOpen && !attributeMenuRef.current?.contains(event.target as Node)) {
      setIsAttributeMenuOpen(false);
    }
  };

  React.useEffect(() => {
    window.addEventListener('keydown', handleAttribueMenuKeys);
    window.addEventListener('click', handleAttributeClickOutside);
    return () => {
      window.removeEventListener('keydown', handleAttribueMenuKeys);
      window.removeEventListener('click', handleAttributeClickOutside);
    };
  }, [isAttributeMenuOpen, attributeMenuRef]);

  const onAttributeToggleClick = (ev: React.MouseEvent) => {
    ev.stopPropagation(); // Stop handleClickOutside from handling
    setTimeout(() => {
      if (attributeMenuRef.current) {
        const firstElement = attributeMenuRef.current.querySelector('li > button:not(:disabled)');
        firstElement && (firstElement as HTMLElement).focus();
      }
    }, 0);
    setIsAttributeMenuOpen(!isAttributeMenuOpen);
  };

  const attributeToggle = (
    <MenuToggle ref={attributeToggleRef} onClick={onAttributeToggleClick} isExpanded={isAttributeMenuOpen} icon={<FilterIcon />}>
      {activeAttributeMenu}
    </MenuToggle>
  );
  const attributeMenu = (
    <Menu
      ref={attributeMenuRef}
      onSelect={(_ev, itemId) => {
        setActiveAttributeMenu(itemId?.toString() as 'Title' | 'Status' | 'Location');
        setIsAttributeMenuOpen(!isAttributeMenuOpen);
      }}
    >
      <MenuContent>
        <MenuList>
          <MenuItem itemId="Title">Title</MenuItem>
          {/* <MenuItem itemId="Status">Status</MenuItem>
          <MenuItem itemId="Location">Location</MenuItem> */}
        </MenuList>
      </MenuContent>
    </Menu>
  );

  const attributeDropdown = (
    <div ref={attributeContainerRef}>
      <Popper
        trigger={attributeToggle}
        triggerRef={attributeToggleRef}
        popper={attributeMenu}
        popperRef={attributeMenuRef}
        appendTo={attributeContainerRef.current || undefined}
        isVisible={isAttributeMenuOpen}
      />
    </div>
  );

  // Set up pagination and toolbar
  const toolbarPagination = (
    <Pagination
      titles={{ paginationAriaLabel: 'Attribute search pagination' }}
      itemCount={repositories.length}
      perPage={10}
      page={1}
      widgetId="attribute-search-mock-pagination"
      isCompact
    />
  );

  const toolbar = (
    <Toolbar
      id="attribute-search-filter-toolbar"
      clearAllFilters={() => {
        setSearchValue('');
        setStatusSelection('');
        setLocationSelections([]);
      }}
    >
      <ToolbarContent>
        <ToolbarToggleGroup toggleIcon={<FilterIcon />} breakpoint="xl">
          <ToolbarGroup variant="filter-group">
            <ToolbarItem>{attributeDropdown}</ToolbarItem>
            <ToolbarFilter
              chips={searchValue !== '' ? [searchValue] : ([] as string[])}
              deleteChip={() => setSearchValue('')}
              deleteChipGroup={() => setSearchValue('')}
              categoryName="Name"
              showToolbarItem={activeAttributeMenu === 'Title'}
            >
              {searchInput}
            </ToolbarFilter>
            {/* <ToolbarFilter
              chips={statusSelection !== '' ? [statusSelection] : ([] as string[])}
              deleteChip={() => setStatusSelection('')}
              deleteChipGroup={() => setStatusSelection('')}
              categoryName="Status"
              showToolbarItem={activeAttributeMenu === 'Status'}
            >
              {statusSelect}
            </ToolbarFilter>
            <ToolbarFilter
              chips={locationSelections}
              deleteChip={(category, chip) => onLocationMenuSelect(undefined, chip as string)}
              deleteChipGroup={() => setLocationSelections([])}
              categoryName="Location"
              showToolbarItem={activeAttributeMenu === 'Location'}
            >
              {locationSelect}
            </ToolbarFilter> */}
          </ToolbarGroup>
        </ToolbarToggleGroup>
        <ToolbarItem variant="pagination">{toolbarPagination}</ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );

  const emptyState = (
    <EmptyState>
      <EmptyStateHeader headingLevel="h4" titleText="No results found" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>No results match the filter criteria. Clear all filters and try again.</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button
            variant="link"
            onClick={() => {
              setSearchValue('');
              setStatusSelection('');
              setLocationSelections([]);
            }}
          >
            Clear all filters
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );

  // JZ: PRTables

  type Direction = 'asc' | 'desc' | undefined;

  const sortRows = (rows: PullRequest[], sortIndex: number, sortDirection: Direction) =>
    [...rows].sort((a, b) => {
      let returnValue = 0;
      if (sortIndex === 0 || sortIndex === 7) {
        returnValue = 1;
      } else if (typeof Object.values(a)[sortIndex] === 'number') {
        // numeric sort
        returnValue = Object.values(a)[sortIndex] - Object.values(b)[sortIndex];
      } else {
        // string sort
        returnValue = Object.values(a)[sortIndex].localeCompare(Object.values(b)[sortIndex]);
      }
      if (sortDirection === 'desc') {
        return returnValue * -1;
      }
      return returnValue;
    });

  const [sortedData, setSortedData] = React.useState([...sortRows(rows, 0, 'asc')]);
  const [sortedRows, setSortedRows] = React.useState([...sortedData]);
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);

  // index of the currently active column
  const [activeSortIndex, setActiveSortIndex] = React.useState(0);
  // sort direction of the currently active column
  const [activeSortDirection, setActiveSortDirection] = React.useState<Direction>('asc');

  const onSort = (_event: any, index: number, direction: Direction) => {
    setActiveSortIndex(index);
    setActiveSortDirection(direction);

    setSortedData(sortRows(rows, index, direction));
  };

  React.useEffect(() => {
    setSortedRows(sortedData.slice((page - 1) * perPage, page * perPage));
  }, [sortedData, page, perPage]);

  const handleSetPage = (_evt: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (_evt: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setPerPage(newPerPage);
  };

  const router = useRouter();

  const handleEditClick = (pr: PullRequest) => {
    const hasKnowledgeLabel = pr.labels.some((label) => label.name === 'knowledge');
    const hasSkillLabel = pr.labels.some((label) => label.name === 'skill');

    if (hasKnowledgeLabel) {
      router.push(`/edit-submission/knowledge/${pr.number}`);
    } else if (hasSkillLabel) {
      router.push(`/edit-submission/skill/${pr.number}`);
    }
  };

  return (
    <Card component="div">
      {toolbar}
      <Table aria-label="Sortable Table">
        <Thead>
          <Tr>
            {Object.values(columnNames).map((column, columnIndex) => {
              const sortParams = {
                sort: {
                  sortBy: {
                    index: activeSortIndex,
                    direction: activeSortDirection
                  },
                  onSort,
                  columnIndex
                }
              };
              return (
                <Th modifier={columnIndex !== 6 ? 'wrap' : undefined} key={columnIndex} {...sortParams}>
                  {column}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          {/* TODO accommodate FILTER vs SortedRows  */}
          {sortedRows.length > 0 &&
            sortedRows.map((pr, rowIndex) => (
              <Tr key={pr.number}>
                <Td dataLabel={columnNames.title} width={15}>
                  <div>{pr.title}</div>
                </Td>
                <Td dataLabel={columnNames.status} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{pr.state}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columnNames.created} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{pr.created_at}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columnNames.updated} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{pr.updated_at}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columnNames.labels} width={15}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      {pr.labels.map((label) => (
                        <Label key={label.name} color="blue" style={{ marginRight: '5px' }}>
                          {label.name}
                        </Label>
                      ))}
                    </FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columnNames.placeholder} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
                      <Button variant="secondary" component="a" href={pr.html_url} target="_blank" rel="noopener noreferrer">
                        View PR
                      </Button>
                    </FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columnNames.placeholder} width={10}>
                  <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
                    {pr.state === 'open' && (
                      <Button variant="primary" onClick={() => handleEditClick(pr)}>
                        Edit
                      </Button>
                    )}
                  </FlexItem>
                </Td>
              </Tr>
            ))}
          {filteredRepos.length === 0 && (
            <Tr>
              <Td colSpan={8}>
                <Bullseye>{emptyState}</Bullseye>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Card>
  );
};
