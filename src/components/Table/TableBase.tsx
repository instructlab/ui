import * as React from 'react';
import { Flex, FlexItem, Pagination, PaginationProps, Toolbar, ToolbarContent, ToolbarGroup, ToolbarItem, Tooltip } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, TableProps, Caption, Tbody, Td, TbodyProps } from '@patternfly/react-table';
import { GetColumnSort, SortableData } from './types';
import { CHECKBOX_FIELD_ID } from './const';

type Props<DataType> = {
  data: DataType[];
  columns: SortableData<DataType>[];
  subColumns?: SortableData<DataType>[];
  hasNestedHeader?: boolean;
  defaultSortColumn?: number;
  rowRenderer: (data: DataType, rowIndex: number) => React.ReactNode;
  enablePagination?: boolean | 'compact';
  showBottomPagination?: boolean;
  toolbarContent?: React.ReactElement<typeof ToolbarItem | typeof ToolbarGroup>;
  onClearFilters?: () => void;
  emptyTableView?: React.ReactNode;
  caption?: string;
  footerRow?: (pageNumber: number) => React.ReactElement<typeof Tr> | null;
  selectAll?: {
    onSelect: (value: boolean) => void;
    selected: boolean;
    disabled?: boolean;
    tooltip?: string;
  };
  getColumnSort?: GetColumnSort;
  disableItemCount?: boolean;
  tbodyProps?: TbodyProps & { ref?: React.Ref<HTMLTableSectionElement> };
} & Omit<TableProps, 'ref' | 'data'> &
  Pick<
    PaginationProps,
    'itemCount' | 'onPerPageSelect' | 'onSetPage' | 'page' | 'perPage' | 'perPageOptions' | 'toggleTemplate' | 'onNextClick' | 'onPreviousClick'
  >;

const defaultPerPageOptions = [
  {
    title: '10',
    value: 10
  },
  {
    title: '20',
    value: 20
  },
  {
    title: '30',
    value: 30
  }
];

const TableBase = <T,>({
  data,
  columns,
  subColumns,
  hasNestedHeader,
  rowRenderer,
  enablePagination,
  showBottomPagination = false,
  toolbarContent,
  onClearFilters,
  emptyTableView,
  caption,
  selectAll,
  footerRow,
  tbodyProps,
  perPage = 10,
  page = 1,
  perPageOptions = defaultPerPageOptions,
  onSetPage,
  onNextClick,
  onPreviousClick,
  onPerPageSelect,
  getColumnSort,
  itemCount = 0,
  toggleTemplate,
  ...props
}: Props<T>): React.ReactElement => {
  const selectAllRef = React.useRef(null);

  const pagination = (variant: 'top' | 'bottom') => (
    <Pagination
      isCompact={enablePagination === 'compact'}
      itemCount={itemCount}
      perPage={perPage}
      page={page}
      onSetPage={onSetPage}
      onNextClick={onNextClick}
      onPreviousClick={onPreviousClick}
      onPerPageSelect={onPerPageSelect}
      toggleTemplate={toggleTemplate}
      variant={variant}
      widgetId="table-pagination"
      perPageOptions={perPageOptions}
      menuAppendTo="inline"
      titles={{
        paginationAriaLabel: `${variant} pagination`
      }}
    />
  );

  // Use a reference to store the heights of table rows once loaded
  const tableRef = React.useRef<HTMLTableElement>(null);
  const rowHeightsRef = React.useRef<number[] | undefined>();

  React.useLayoutEffect(() => {
    const heights: number[] = [];
    const rows = tableRef.current?.querySelectorAll<HTMLTableRowElement>(':scope > tbody > tr');
    rows?.forEach((r) => heights.push(r.offsetHeight));
    rowHeightsRef.current = heights;
  }, []);

  const renderColumnHeader = (col: SortableData<T>, i: number, isSubheader?: boolean) => {
    if (col.field === CHECKBOX_FIELD_ID && selectAll) {
      return (
        <React.Fragment key={`checkbox-${i}`}>
          <Tooltip key="select-all-checkbox" content={selectAll.tooltip ?? 'Select all page items'} triggerRef={selectAllRef} />
          <Th
            ref={selectAllRef}
            colSpan={col.colSpan}
            rowSpan={col.rowSpan}
            select={{
              isSelected: selectAll.selected,
              onSelect: (e, value) => selectAll.onSelect(value),
              isDisabled: selectAll.disabled
            }}
            // TODO: Log PF bug -- when there are no rows this gets truncated
            style={{ minWidth: '45px' }}
            isSubheader={isSubheader}
            aria-label="Select all"
          />
        </React.Fragment>
      );
    }

    return col.label ? (
      <Th
        key={col.field + i}
        colSpan={col.colSpan}
        rowSpan={col.rowSpan}
        sort={getColumnSort && col.sortable ? getColumnSort(i) : undefined}
        width={col.width}
        info={col.info}
        isSubheader={isSubheader}
        hasRightBorder={col.hasRightBorder}
        modifier={col.modifier}
        visibility={col.visibility}
        className={col.className}
      >
        {col.label}
      </Th>
    ) : (
      // Table headers cannot be empty for a11y, table cells can -- https://dequeuniversity.com/rules/axe/4.0/empty-table-header
      <Td key={col.field + i} width={col.width} />
    );
  };

  const renderRows = () => data.map((row, rowIndex) => rowRenderer(row, rowIndex));

  const table = (
    <Table {...props} ref={tableRef}>
      {caption && <Caption>{caption}</Caption>}
      <Thead noWrap hasNestedHeader={hasNestedHeader}>
        {/* Note from PF: following custom style can be removed when we can resolve misalignment issue natively */}
        <Tr>{columns.map((col, i) => renderColumnHeader(col, i))}</Tr>
        {subColumns?.length ? <Tr>{subColumns.map((col, i) => renderColumnHeader(col, columns.length + i, true))}</Tr> : null}
      </Thead>
      <Tbody {...tbodyProps}>{renderRows()}</Tbody>
      {footerRow && footerRow(page)}
    </Table>
  );

  return (
    <Flex direction={{ default: 'column' }} style={{ height: '100%' }}>
      {(toolbarContent || enablePagination) && (
        <FlexItem>
          <Toolbar
            inset={{ default: 'insetNone' }}
            className="pf-v6-u-w-100"
            customLabelGroupContent={onClearFilters ? undefined : <></>}
            clearAllFilters={onClearFilters}
          >
            <ToolbarContent>
              {toolbarContent}
              {enablePagination && (
                <ToolbarItem variant="pagination" align={{ default: 'alignEnd' }} className="pf-v6-u-pr-lg">
                  {pagination('top')}
                </ToolbarItem>
              )}
            </ToolbarContent>
          </Toolbar>
        </FlexItem>
      )}
      <FlexItem flex={{ default: data.length > 0 || !emptyTableView ? 'flex_1' : 'flexDefault' }} style={{ overflowY: 'auto' }}>
        {table}
      </FlexItem>
      {emptyTableView && data.length === 0 ? (
        <FlexItem flex={{ default: 'flex_1' }}>
          <div style={{ padding: 'var(--pf-global--spacer--2xl) 0', textAlign: 'center' }}>{emptyTableView}</div>
        </FlexItem>
      ) : null}
      {enablePagination && showBottomPagination ? <FlexItem>{pagination('bottom')}</FlexItem> : null}
    </Flex>
  );
};

export default TableBase;
