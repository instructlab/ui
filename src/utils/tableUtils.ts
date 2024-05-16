import { ThProps } from '@patternfly/react-table';

export const getSortParams = (
  columnIndex: number,
  activeSortIndex: number | null,
  activeSortDirection: 'asc' | 'desc',
  setActiveSortIndex: React.Dispatch<React.SetStateAction<number | null>>,
  setActiveSortDirection: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>
): ThProps['sort'] => {
  // Only apply sorting functionality for column index 0, e.g. Job ID
  const isSortable = columnIndex === 0;

  return {
    sortBy: {
      index: activeSortIndex !== null ? activeSortIndex : undefined,
      direction: activeSortDirection,
      defaultDirection: 'desc',
    },
    onSort: isSortable
      ? (_event, index, direction) => {
          setActiveSortIndex(index);
          setActiveSortDirection(direction);
        }
      : undefined,
    columnIndex,
  };
};
