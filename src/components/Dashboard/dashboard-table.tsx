import React from 'react';
import {
  Card,
  Flex,
  FlexItem,
  Pagination,
  PaginationVariant,
  Label,
  Spinner,
  EmptyState,
  EmptyStateHeader,
  EmptyStateIcon,
  Bullseye,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

// import { columns } from '@patternfly/react-table/dist/esm/demos/sampleData';
import { PullRequest } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ExclamationCircleIcon, GithubIcon } from '@patternfly/react-icons';
import Image from 'next/image';

type Direction = 'asc' | 'desc' | undefined;

interface DasboardTableProps {
  rows: PullRequest[];
  isFirstPullDone: boolean;
  error: null | string;
}

export const DashboardTable: React.FunctionComponent<DasboardTableProps> = ({ rows, isFirstPullDone, error }) => {
  const router = useRouter();

  // Last two columns are placeholders that reserve space for the buttons 'View' and 'Edit'
  const columns = ['Title', 'Status', 'Created', 'Updated', 'Labels', '', ''];

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
  }, [sortedData, page, perPage, rows]);

  const handleSetPage = (_evt: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (_evt: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setPerPage(newPerPage);
  };

  const renderPagination = (variant: 'top' | 'bottom' | PaginationVariant, isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={rows?.length ?? 0}
      page={page}
      perPage={perPage}
      onSetPage={handleSetPage}
      onPerPageSelect={handlePerPageSelect}
      perPageOptions={[
        { title: '10', value: 10 },
        { title: '20', value: 20 },
        { title: '50', value: 50 },
        { title: '100', value: 100 }
      ]}
      variant={variant}
      titles={{
        paginationAriaLabel: `${variant} pagination`
      }}
    />
  );

  const handleEditClick = (pr: PullRequest) => {
    const hasKnowledgeLabel = pr.labels.some((label) => label.name === 'knowledge');
    const hasSkillLabel = pr.labels.some((label) => label.name === 'skill');

    if (hasKnowledgeLabel) {
      router.push(`/edit-submission/knowledge/${pr.number}`);
    } else if (hasSkillLabel) {
      router.push(`/edit-submission/skill/${pr.number}`);
    }
  };

  const ErrorState = () => {
    return (
      <Tr>
        <Td colSpan={8}>
          <Bullseye>
            <EmptyState>
              <EmptyStateHeader
                titleText="Error"
                headingLevel="h4"
                icon={<EmptyStateIcon icon={ExclamationCircleIcon} color={'var(--pf-v5-global--danger-color--100)'} />}
                className="pf-v5-global--danger-color--100"
              />
              <EmptyStateBody> There was an error retrieving data. Check your connection and reload the page </EmptyStateBody>
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  const LoadingState = () => {
    return (
      <Tr>
        <Td colSpan={8}>
          <Bullseye>
            <EmptyState>
              <EmptyStateHeader titleText="Loading" headingLevel="h4" icon={<EmptyStateIcon icon={Spinner} />} />
            </EmptyState>
          </Bullseye>
        </Td>
      </Tr>
    );
  };

  const DataLoadedState = () => {
    console.log('Row RENDERING: ', sortedRows);
    return sortedRows.map((pr) => (
      <Tr key={pr.number}>
        <>
          <Td dataLabel={columns[0]} width={15}>
            <div>{pr.title}</div>
          </Td>
          <Td dataLabel={columns[1]} width={10}>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>{pr.state}</FlexItem>
            </Flex>
          </Td>
          <Td dataLabel={columns[2]} width={10}>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>{pr.created_at}</FlexItem>
            </Flex>
          </Td>
          <Td dataLabel={columns[3]} width={10}>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem>{pr.updated_at}</FlexItem>
            </Flex>
          </Td>
          <Td dataLabel={columns[4]} width={15}>
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
          <Td dataLabel={columns[5]} width={10}>
            <Flex spaceItems={{ default: 'spaceItemsSm' }}>
              <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
                <Button variant="secondary" component="a" href={pr.html_url} target="_blank" rel="noopener noreferrer">
                  View PR
                </Button>
              </FlexItem>
            </Flex>
          </Td>
          <Td dataLabel={columns[6]} width={10}>
            <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
              {pr.state === 'open' && (
                <Button variant="primary" onClick={() => handleEditClick(pr)}>
                  Edit
                </Button>
              )}
            </FlexItem>
          </Td>
        </>
      </Tr>
    ));
  };

  const TableData = () => {
    if (error) {
      return <ErrorState />;
    } else if (!isFirstPullDone) {
      return <LoadingState />;
    }

    return <DataLoadedState />;
  };

  return (
    <Card component="div">
      {renderPagination('bottom', false)}
      <Table aria-label="Sortable Table" ouiaId="SortableTable">
        <Thead>
          <Tr>
            {columns.map((columnName, columnIndex) => {
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
              if (columnName === 'Title' || columnName === 'Status' || columnName === 'Created' || columnName === 'Updated') {
                return (
                  <Th
                    modifier={columnIndex !== 6 ? 'wrap' : undefined}
                    key={columnIndex}
                    {...sortParams}
                    aria-label={`pr-dashboard-column-${columnIndex}-${columnName}`}
                  >
                    {columnName}
                  </Th>
                );
              }
              return (
                <Th
                  modifier={columnIndex !== 6 ? 'wrap' : undefined}
                  key={columnIndex}
                  aria-label={`pr-dashboard-column-${columnIndex}-${columnName}`}
                >
                  {columnName}
                </Th>
              );
            })}
          </Tr>
        </Thead>
        <Tbody>
          <TableData />
        </Tbody>
      </Table>
      {renderPagination('bottom', false)}
    </Card>
  );
};
