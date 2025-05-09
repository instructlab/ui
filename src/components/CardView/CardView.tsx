// src/components/Dashboard/Dashboard.tsx
import * as React from 'react';
import { Gallery, Flex, FlexItem, Toolbar, ToolbarContent, ToolbarItem, ToolbarGroup, Pagination, PaginationProps } from '@patternfly/react-core';

type Props<DataType> = {
  data: DataType[];
  cardRenderer: (data: DataType, rowIndex: number) => React.ReactNode;
  enablePagination?: boolean | 'compact';
  showBottomPagination?: boolean;
  toolbarContent?: React.ReactElement<typeof ToolbarItem | typeof ToolbarGroup>;
  onClearFilters?: () => void;
  emptyTableView?: React.ReactNode;
  bottomToolbarContent?: React.ReactElement<typeof ToolbarItem | typeof ToolbarGroup>;
  caption?: string;
} & Pick<PaginationProps, 'perPageOptions'>;

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
const CardView = <T,>({
  data,
  cardRenderer,
  enablePagination,
  showBottomPagination = false,
  perPageOptions = defaultPerPageOptions,
  toolbarContent,
  onClearFilters,
  emptyTableView
}: Props<T>): React.ReactElement => {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  let viewedData: T[];
  if (enablePagination) {
    viewedData = data.slice(pageSize * (page - 1), pageSize * page);
  } else {
    viewedData = data;
  }

  // update page to 1 if data changes (common when filter is applied)
  React.useEffect(() => {
    if (viewedData.length === 0) {
      setPage(1);
    }
  }, [viewedData.length]);

  const pagination = (variant: 'top' | 'bottom') => (
    <Pagination
      isCompact={enablePagination === 'compact'}
      itemCount={data.length}
      perPage={pageSize}
      page={page}
      onSetPage={(_ev, newPage) => setPage(newPage)}
      onPerPageSelect={(_ev, newSize, newPage) => {
        setPageSize(newSize);
        setPage(newPage);
      }}
      variant={variant}
      widgetId="table-pagination"
      perPageOptions={perPageOptions}
      menuAppendTo="inline"
      titles={{
        paginationAriaLabel: `${variant} pagination`
      }}
    />
  );

  const renderCards = () => data.map((card, cardIndex) => cardRenderer(card, cardIndex));

  const gallery = (
    <Gallery
      hasGutter
      minWidths={{
        default: '350px'
      }}
    >
      {renderCards()}
    </Gallery>
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
        {gallery}
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

export default CardView;
