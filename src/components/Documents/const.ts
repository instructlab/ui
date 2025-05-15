import { SortableData } from '@/components/Table/types';
import { KnowledgeFile } from '@/types';
import { compareKnowledgeFileDates } from '@/components/Contribute/Utils/contributionUtils';

export const SORT_BY_NAME = 'File name';
export const SORT_BY_LAST_UPDATE = 'last updated';

export const SortTitles = {
  [SORT_BY_NAME]: 'File name',
  [SORT_BY_LAST_UPDATE]: 'Last updated'
};

export const SortByIndex = [SORT_BY_NAME, SORT_BY_LAST_UPDATE];

export const SORT_ASCENDING = 'asc';
export const SORT_DESCENDING = 'desc';

export const DefaultSort = SORT_BY_LAST_UPDATE;
export const DefaultSortDir = SORT_ASCENDING;

const nameSorter = (a: KnowledgeFile, b: KnowledgeFile) => {
  return (b.filename || '').localeCompare(a.filename || '');
};

export const DocumentSorter = (sortField: string, sortDir: string) => (a: KnowledgeFile, b: KnowledgeFile) => {
  switch (sortField) {
    case SORT_BY_NAME:
      return nameSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    case SORT_BY_LAST_UPDATE:
      return compareKnowledgeFileDates(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    default:
      return compareKnowledgeFileDates(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
  }
};

export const DocumentColumns: SortableData<KnowledgeFile>[] = [
  {
    field: 'fileName',
    label: 'File name',
    sortable: nameSorter,
    width: 50
  },
  {
    field: 'lastUpdated',
    label: 'Last updated',
    sortable: compareKnowledgeFileDates
  },
  {
    label: ' ',
    field: 'kebab',
    sortable: false
  }
];
