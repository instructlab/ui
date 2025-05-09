import { SortableData } from '@/components/Table/types';
import { KnowledgeFile } from '@/types';

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

const lastUpdatedSorter = (a: KnowledgeFile, b: KnowledgeFile) => {
  const aDate = a.commitDate ? Date.parse(a.commitDate) : Date.now();
  const bDate = b.commitDate ? Date.parse(b.commitDate) : Date.now();

  return aDate - bDate;
};

export const DocumentSorter = (sortField: string, sortDir: string) => (a: KnowledgeFile, b: KnowledgeFile) => {
  switch (sortField) {
    case SORT_BY_NAME:
      return nameSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    case SORT_BY_LAST_UPDATE:
      return lastUpdatedSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    default:
      return lastUpdatedSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
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
    sortable: lastUpdatedSorter
  },
  {
    label: ' ',
    field: 'kebab',
    sortable: false
  }
];

export const LastUpdatedDateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  hourCycle: 'h12',
  minute: '2-digit',
  timeZoneName: 'short'
});

export const getFormattedLastUpdatedDate = (date: Date) => LastUpdatedDateFormatter.format(date);
