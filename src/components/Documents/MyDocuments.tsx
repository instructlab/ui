// src/components/Documents/MyDocuments.tsx
import * as React from 'react';
import {
  PageSection,
  Title,
  Content,
  Button,
  Flex,
  FlexItem,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Spinner,
  EmptyStateVariant
} from '@patternfly/react-core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SORT_ASCENDING, SORT_BY_LAST_UPDATE, SORT_DESCENDING, SortByIndex } from '@/components/Documents/const';
import { SearchIcon } from '@patternfly/react-icons';
import { KnowledgeFile } from '@/types';
import { DocumentColumns, DocumentSorter } from '@/components/Documents/const';
import DocumentsToolbar from '@/components/Documents/DocumentsToolbar';
import Table from '@/components/Table/Table';
import CardView from '@/components/CardView/CardView';
import DocumentCard from '@/components/Documents/DocumentCard';
import DocumentTableRow from '@/components/Documents/DocumentTableRow';
import Image from 'next/image';

const EmptyStateIcon: React.FC = () => <Image src="/Contribution_empty.svg" alt="No documents" width={56} height={56} />;

interface Props {
  documents: KnowledgeFile[];
  isLoading: boolean;
  removeDocument: (document: KnowledgeFile) => void;
}

const Documents: React.FC<Props> = ({ isLoading, documents, removeDocument }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [filter, setFilter] = React.useState<string | undefined>('');

  const viewType = searchParams.get('viewType') || 'table';
  const sort = searchParams.get('sortBy') || SORT_BY_LAST_UPDATE;
  const sortDirParam = searchParams.get('sortDir');
  const sortDirection = sortDirParam === SORT_ASCENDING || sortDirParam === SORT_DESCENDING ? sortDirParam : SORT_ASCENDING;

  const filteredDocuments = React.useMemo(
    () =>
      documents
        .filter((document) => !filter || document.filename.toLowerCase().includes(filter.toLowerCase()))
        .sort(DocumentSorter(sort, sortDirection)),
    [documents, sort, sortDirection, filter]
  );

  const setQueryParam = React.useCallback(
    (name: string, value: string, name2?: string, value2?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      if (name2 && value2) {
        params.set(name2, value2);
      }

      router.replace(pathname + '?' + params.toString());
    },
    [pathname, router, searchParams]
  );

  const setCurrentSortAndDirection = React.useCallback(
    (newSort: number, newDir: string) => {
      setQueryParam('sortBy', SortByIndex[newSort] || SORT_BY_LAST_UPDATE, 'sortDir', newDir);
    },
    [setQueryParam]
  );

  const toolbar = (
    <DocumentsToolbar
      currentFilter={filter}
      onFilterUpdate={setFilter}
      isTableView={viewType === 'table'}
      setIsTableView={(isTableView) => setQueryParam('viewType', isTableView ? 'table' : 'card')}
      currentSort={sort}
      setCurrentSort={(newSort) => setQueryParam('sortBy', newSort)}
      currentSortDirection={sortDirection}
      setCurrentSortDirection={(newDir) => setQueryParam('sortDir', newDir)}
    />
  );

  const filteredEmptyView = (
    <Bullseye>
      <EmptyState headingLevel="h2" titleText="No results found" data-testid="documents-empty-table-state" icon={SearchIcon}>
        <EmptyStateBody>No matching documents found</EmptyStateBody>
        <EmptyStateFooter>
          <Button variant="link" onClick={() => setFilter('')}>
            Clear filter
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    </Bullseye>
  );

  return (
    <PageSection isFilled>
      <Flex
        direction={{ default: 'column' }}
        gap={{ default: 'gapLg' }}
        flexWrap={{ default: 'nowrap' }}
        style={{ height: '100%', overflowY: 'hidden' }}
      >
        <FlexItem>
          <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} gap={{ default: 'gapLg' }} alignItems={{ default: 'alignItemsCenter' }}>
            <FlexItem>
              <Title headingLevel="h1" size="2xl">
                My documents
              </Title>
            </FlexItem>
            {/* TODO: any actions available at the top level? */}
          </Flex>
        </FlexItem>
        <FlexItem>
          <Content component="p">List of documents that have been uploaded.</Content>
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }} style={{ overflowY: 'hidden' }}>
          {isLoading ? (
            <Bullseye>
              <Spinner size="xl" />
            </Bullseye>
          ) : documents.length === 0 ? (
            <Bullseye>
              <EmptyState headingLevel="h1" icon={EmptyStateIcon} titleText="No documents yet" variant={EmptyStateVariant.lg}>
                <EmptyStateBody>To get started, upload external files or files from your device.</EmptyStateBody>
              </EmptyState>
            </Bullseye>
          ) : viewType === 'table' ? (
            <Table
              className="documents-table"
              enablePagination
              defaultSortColumn={SortByIndex.indexOf(sort)}
              defaultSortDirection={sortDirection}
              setCurrentSortAndDirection={setCurrentSortAndDirection}
              emptyTableView={filteredEmptyView}
              data={filteredDocuments}
              columns={DocumentColumns}
              isStickyHeader
              toolbarContent={toolbar}
              rowRenderer={(document) => <DocumentTableRow key={document.filename} document={document} onRemove={() => removeDocument(document)} />}
            />
          ) : (
            <CardView
              enablePagination
              emptyTableView={filteredEmptyView}
              data={filteredDocuments}
              toolbarContent={toolbar}
              cardRenderer={(document) => <DocumentCard key={document.filename} document={document} onRemove={() => removeDocument(document)} />}
            />
          )}
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export default Documents;
