import React from 'react';

import { Card, Flex, FlexItem, Pagination, PaginationVariant, Label } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import CodeBranchIcon from '@patternfly/react-icons/dist/esm/icons/code-branch-icon';
import CubeIcon from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import { columns, rows, SampleDataRow } from '@patternfly/react-table/dist/esm/demos/sampleData';

type Direction = 'asc' | 'desc' | undefined;

export const TableSortableResponsive: React.FunctionComponent = () => {
  console.log({ rows });
  console.log({ columns });

  // Last two columns are placeholders that reserve space for the buttons 'View' and 'Edit'
  //   const columns = ['Title', 'Status', 'Created', 'Updated', 'Labels', '', ''];

  const sortRows = (rows: SampleDataRow[], sortIndex: number, sortDirection: Direction) =>
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

  const renderLabel = (labelText: string) => {
    switch (labelText) {
      case 'Running':
        return <Label color="green">{labelText}</Label>;
      case 'Stopped':
        return <Label color="orange">{labelText}</Label>;
      case 'Needs Maintenance':
        return <Label color="blue">{labelText}</Label>;
      case 'Down':
        return <Label color="red">{labelText}</Label>;
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
          {sortedRows.map((row, rowIndex) => (
            <Tr key={rowIndex}>
              <>
                <Td dataLabel={columns[0]} width={15}>
                  <div>{row.name}</div>
                </Td>
                <Td dataLabel={columns[1]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <CodeBranchIcon key="icon" />
                    </FlexItem>
                    <FlexItem>{row.threads}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columns[2]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <CodeIcon key="icon" />
                    </FlexItem>
                    <FlexItem>{row.applications}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columns[3]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>
                      <CubeIcon key="icon" />
                    </FlexItem>
                    <FlexItem>{row.workspaces}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columns[4]} width={15}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{renderLabel(row.status)}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columns[5]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{row.location}</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columns[6]} width={10}>
                  <Flex spaceItems={{ default: 'spaceItemsSm' }}>
                    <FlexItem>{row.lastModified[0]} days ago</FlexItem>
                  </Flex>
                </Td>
                <Td dataLabel={columns[7]} modifier="truncate">
                  <a href="#">{row.url}</a>
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
