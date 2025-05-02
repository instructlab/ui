import * as React from 'react';
import { TbodyProps } from '@patternfly/react-table';
import TableBase from './TableBase';
import useTableColumnSort from './useTableColumnSort';

type TableProps<DataType> = Omit<
  React.ComponentProps<typeof TableBase<DataType>>,
  'itemCount' | 'onPerPageSelect' | 'onSetPage' | 'page' | 'perPage'
> & {
  tbodyProps?: TbodyProps & { ref?: React.Ref<HTMLTableSectionElement> };
  defaultSortDirection?: 'asc' | 'desc';
  setCurrentSortAndDirection: (sortByIndex: number, sortDir: 'asc' | 'desc') => void;
};

const Table = <T,>({
  data,
  columns,
  subColumns,
  enablePagination,
  defaultSortColumn = 0,
  defaultSortDirection = 'asc',
  setCurrentSortAndDirection,
  ...props
}: TableProps<T>): React.ReactElement => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);
  const sort = useTableColumnSort<T>(columns, subColumns || [], defaultSortColumn, defaultSortDirection);
  const sortedData = sort.transformData(data);

  let viewedData: T[];
  if (enablePagination) {
    viewedData = sortedData.slice(pageSize * (page - 1), pageSize * page);
  } else {
    viewedData = sortedData;
  }

  // update page to 1 if data changes (common when filter is applied)
  React.useEffect(() => {
    if (viewedData.length === 0) {
      setPage(1);
    }
  }, [viewedData.length]);

  React.useEffect(() => {
    setCurrentSortAndDirection(sort.sortIndex ?? defaultSortColumn, sort.sortDirection ?? defaultSortDirection);
  }, [defaultSortColumn, defaultSortDirection, setCurrentSortAndDirection, sort.sortDirection, sort.sortIndex]);

  return (
    <TableBase
      data={viewedData}
      columns={columns}
      subColumns={subColumns}
      enablePagination={enablePagination}
      itemCount={data.length}
      perPage={pageSize}
      page={page}
      onSetPage={(e, newPage) => setPage(newPage)}
      onPerPageSelect={(e, newSize, newPage) => {
        setPageSize(newSize);
        setPage(newPage);
      }}
      getColumnSort={sort.getColumnSort}
      {...props}
    />
  );
};

export default Table;
