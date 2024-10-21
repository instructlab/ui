import React from 'react';

import { Card, Flex, FlexItem, Pagination, PaginationVariant, Label } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';

// import { columns } from '@patternfly/react-table/dist/esm/demos/sampleData';
import { PullRequest } from '@/types';
import { useRouter } from 'next/navigation';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';

type Direction = 'asc' | 'desc' | undefined;

interface DasboardTableProps {
  rows: PullRequest[];
}

export const DashboardTable: React.FunctionComponent<DasboardTableProps> = ({ rows }) => {
  // Last two columns are placeholders that reserve space for the buttons 'View' and 'Edit'
  const columns = ['Title', 'Status', 'Created', 'Updated', 'Labels', '', ''];

  //   console.log({ rows });
  //   console.log({ columns });

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

  const renderPagination = (variant: 'top' | 'bottom' | PaginationVariant, isCompact: boolean) => (
    <Pagination
      isCompact={isCompact}
      itemCount={rows.length}
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

  //   const renderLabel = (labelText: string) => {
  //     switch (labelText) {
  //       case 'Running':
  //         return <Label color="green">{labelText}</Label>;
  //       case 'Stopped':
  //         return <Label color="orange">{labelText}</Label>;
  //       case 'Needs Maintenance':
  //         return <Label color="blue">{labelText}</Label>;
  //       case 'Down':
  //         return <Label color="red">{labelText}</Label>;
  //     }
  //   };

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
      {renderPagination('bottom', false)}
      <Table aria-label="Sortable Table">
        <Thead>
          <Tr>
            {columns.map((column, columnIndex) => {
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
          {sortedRows.map((pr) => (
            <Tr key={pr.number}>
              <>
                {/* Title */}
                <Td dataLabel={columns[0]} width={15}>
                  <div>{pr.title}</div>
                </Td>
                {/* Status */}
                <Td dataLabel={columns[1]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{pr.state}</FlexItem>
                  </Flex>
                </Td>
                {/* Created */}
                <Td dataLabel={columns[2]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{pr.created_at}</FlexItem>
                  </Flex>
                </Td>
                {/* Updated */}
                <Td dataLabel={columns[3]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{pr.updated_at}</FlexItem>
                  </Flex>
                </Td>
                {/* Labels */}
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
                {/* View PR  */}
                <Td dataLabel={columns[5]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
                      <Button variant="secondary" component="a" href={pr.html_url} target="_blank" rel="noopener noreferrer">
                        View PR
                      </Button>
                    </FlexItem>
                  </Flex>
                </Td>
                {/* Edit */}
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
          ))}
        </Tbody>
      </Table>
      {renderPagination('bottom', false)}
    </Card>
  );
};
