import { SortableData } from '@/components/Table/types';
import { ContributionInfo } from '@/types';

export const SORT_BY_TITLE = 'title';
export const SORT_BY_TYPE = 'type';
export const SORT_BY_TAXONOMY = 'taxonomy';
export const SORT_BY_STATUS = 'status';
export const SORT_BY_LAST_UPDATE = 'last updated';

export const SortTitles = {
  [SORT_BY_TITLE]: 'Title',
  [SORT_BY_TYPE]: 'Type',
  [SORT_BY_TAXONOMY]: 'Taxonomy',
  [SORT_BY_STATUS]: 'Status',
  [SORT_BY_LAST_UPDATE]: 'Last updated'
};

export const SortByIndex = [SORT_BY_TITLE, SORT_BY_TYPE, SORT_BY_TAXONOMY, SORT_BY_STATUS, SORT_BY_LAST_UPDATE];

export const SORT_ASCENDING = 'asc';
export const SORT_DESCENDING = 'desc';

export const DefaultSort = SORT_BY_LAST_UPDATE;
export const DefaultSortDir = SORT_ASCENDING;

const titleSorter = (a: ContributionInfo, b: ContributionInfo) => {
  return (a.title || '').localeCompare(b.title || '');
};

const typeSorter = (a: ContributionInfo, b: ContributionInfo) => {
  if (a.isKnowledge !== b.isKnowledge) {
    return a.isKnowledge ? -1 : 1;
  }
  return (a.title || '').localeCompare(b.title || '');
};

const taxonomySorter = (a: ContributionInfo, b: ContributionInfo) => {
  const compValue = a.taxonomy.localeCompare(b.taxonomy);
  if (compValue !== 0) {
    return compValue;
  }
  return (a.title || '').localeCompare(b.title || '');
};

const statusSorter = (a: ContributionInfo, b: ContributionInfo) => {
  if (a.isDraft !== b.isDraft) {
    return a.isDraft ? -1 : 1;
  }
  return (a.title || '').localeCompare(b.title || '');
};

const lastUpdatedSorter = (a: ContributionInfo, b: ContributionInfo) => {
  return a.lastUpdated.getTime() - b.lastUpdated.getTime();
};

export const ContributionSorter = (sortField: string, sortDir: string) => (a: ContributionInfo, b: ContributionInfo) => {
  switch (sortField) {
    case 'title':
      return titleSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    case 'type':
      return typeSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    case 'taxonomy':
      return taxonomySorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    case 'status':
      return statusSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    case 'last updated':
      return lastUpdatedSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
    default:
      return titleSorter(a, b) * (sortDir === SORT_ASCENDING ? 1 : -1);
  }
};

export const ContributionColumns: SortableData<ContributionInfo>[] = [
  {
    field: 'title',
    label: 'Title',
    sortable: titleSorter,
    width: 30
  },
  {
    field: 'type',
    label: 'Type',
    sortable: typeSorter
  },
  {
    field: 'taxonomy',
    label: 'Taxonomy',
    sortable: taxonomySorter
  },
  {
    field: 'status',
    label: 'Status',
    sortable: statusSorter
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

export const getTaxonomyDir = (taxonomy: string): string => {
  const parts = taxonomy.split('/');
  if (parts.length === 1) {
    return taxonomy;
  }
  if (parts[parts.length - 1]) {
    return parts[parts.length - 1];
  }

  return parts[parts.length - 2];
};
