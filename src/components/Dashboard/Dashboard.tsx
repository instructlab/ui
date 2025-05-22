// src/components/Dashboard/Dashboard.tsx
import * as React from 'react';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  PageSection,
  Title,
  Button,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Flex,
  FlexItem,
  Bullseye,
  Dropdown,
  MenuToggleElement,
  DropdownList,
  DropdownItem
} from '@patternfly/react-core';
import { AngleDownIcon, GithubIcon, SearchIcon } from '@patternfly/react-icons';
import { ContributionInfo } from '@/types';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { useTheme } from '@/context/ThemeContext';
import PageDescriptionWithHelp from '@/components/Common/PageDescriptionWithHelp';
import Table from '@/components/Table/Table';
import ContributionsSidePanelHelp from '@/components/SidePanelContents/ContributionsSidePanelHelp';
import CardView from '@/components/CardView/CardView';
import ClearDraftDataButton from '@/components/Contribute/ClearDraftDataButton';
import {
  ContributionColumns,
  ContributionSorter,
  SORT_ASCENDING,
  SORT_BY_LAST_UPDATE,
  SORT_DESCENDING,
  SortByIndex
} from '@/components/Dashboard/const';
import DashboardToolbar from '@/components/Dashboard/DashboardToolbar';
import ContributionTableRow from '@/components/Dashboard/ContributionTableRow';
import ContributionCard from '@/components/Dashboard/ContributionCard';

import './Dashboard.scss';

const EmptyStateLogo: React.FC = () => {
  const { theme } = useTheme();
  const {
    envConfig: { largeLogo, largeLogoDark, productName }
  } = useEnvConfig();
  return <Image src={theme !== 'dark' ? largeLogo : largeLogoDark} alt={`${productName} logo`} width={256} height={256} />;
};

interface Props {
  contributions: ContributionInfo[];
  isLoading: boolean;
  triggerUpdateContributions: () => void;
}

const Dashboard: React.FC<Props> = ({ contributions, isLoading, triggerUpdateContributions }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    featureFlags: { skillFeaturesEnabled, playgroundFeaturesEnabled }
  } = useFeatureFlags();
  const {
    envConfig: { isDevMode }
  } = useEnvConfig();
  const [isActionsOpen, setIsActionsOpen] = React.useState<boolean>(false);
  const [filter, setFilter] = React.useState<string | undefined>('');

  const viewType = searchParams.get('viewType') || 'table';
  const sort = searchParams.get('sortBy') || SORT_BY_LAST_UPDATE;
  const sortDirParam = searchParams.get('sortDir');
  const sortDirection = sortDirParam === SORT_ASCENDING || sortDirParam === SORT_DESCENDING ? sortDirParam : SORT_DESCENDING;

  const filteredContributions = React.useMemo(
    () =>
      contributions
        .filter((contribution) => skillFeaturesEnabled || contribution.isKnowledge)
        .filter((contribution) => !filter || contribution.title.toLowerCase().includes(filter.toLowerCase()))
        .sort(ContributionSorter(sort, sortDirection)),
    [contributions, sort, sortDirection, skillFeaturesEnabled, filter]
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
    <DashboardToolbar
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
      <EmptyState headingLevel="h2" titleText="No results found" data-testid="dashboard-empty-table-state" icon={SearchIcon}>
        <EmptyStateBody>No matching contributions found</EmptyStateBody>
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
          <Flex
            direction={{ default: 'column' }}
            gap={{ default: 'gapMd' }}
            flexWrap={{ default: 'nowrap' }}
            style={{ height: '100%', overflowY: 'hidden' }}
          >
            <FlexItem>
              <Flex
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                gap={{ default: 'gapLg' }}
                alignItems={{ default: 'alignItemsCenter' }}
              >
                <FlexItem>
                  <Title headingLevel="h1" size="2xl">
                    My contributions
                  </Title>
                </FlexItem>
                <FlexItem>
                  {skillFeaturesEnabled ? (
                    <Dropdown
                      isOpen={isActionsOpen}
                      onSelect={() => setIsActionsOpen(false)}
                      onOpenChange={(isOpen: boolean) => setIsActionsOpen(isOpen)}
                      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                        <Button
                          ref={toggleRef}
                          variant="primary"
                          icon={<AngleDownIcon />}
                          onClick={() => setIsActionsOpen((prev) => !prev)}
                          iconPosition="right"
                        >
                          Contribute
                        </Button>
                      )}
                      shouldFocusToggleOnSelect
                    >
                      <DropdownList>
                        <DropdownItem onClick={() => router.push('/contribute/knowledge/')}>Contribute knowledge</DropdownItem>
                        <DropdownItem onClick={() => router.push('/contribute/skill/')}>Contribute skill</DropdownItem>
                      </DropdownList>
                    </Dropdown>
                  ) : (
                    <Button variant="primary" onClick={() => router.push('/contribute/knowledge/')}>
                      Contribute
                    </Button>
                  )}
                  {isDevMode ? <ClearDraftDataButton onCleared={triggerUpdateContributions} /> : null}
                </FlexItem>
              </Flex>
            </FlexItem>
            <FlexItem>
              <PageDescriptionWithHelp
                description="View and manage your contributions. By contributing your own data, you can help train and refine your language models."
                helpText="Learn more about contributions"
                sidePanelContent={<ContributionsSidePanelHelp />}
              />
            </FlexItem>
          </Flex>
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }} style={{ overflowY: 'hidden' }}>
          {isLoading ? (
            <Bullseye>
              <Spinner size="xl" />
            </Bullseye>
          ) : contributions.length === 0 ? (
            <EmptyState headingLevel="h4" titleText="Welcome to InstructLab" icon={EmptyStateLogo}>
              <EmptyStateBody>
                <div style={{ maxWidth: '60ch' }}>
                  InstructLab is a powerful and accessible tool for advancing generative AI through community collaboration and open-source
                  principles. By contributing your own data, you can help train and refine the language model. <br />
                  <br />
                  To get started, contribute {skillFeaturesEnabled ? 'a skill or contribute ' : ''}knowledge.
                </div>
              </EmptyStateBody>
              <EmptyStateFooter>
                <EmptyStateActions>
                  {skillFeaturesEnabled ? (
                    <Button variant="primary" onClick={() => router.push('/contribute/skill/')}>
                      Contribute skill
                    </Button>
                  ) : null}
                  <Button variant="primary" onClick={() => router.push('/contribute/knowledge/')}>
                    Contribute knowledge
                  </Button>
                  {playgroundFeaturesEnabled ? (
                    <Button variant="primary" onClick={() => router.push('/playground/chat')}>
                      Chat with the models
                    </Button>
                  ) : null}
                </EmptyStateActions>
                <EmptyStateActions>
                  <Button
                    variant="link"
                    icon={<GithubIcon />}
                    iconPosition="left"
                    component="a"
                    href="https://github.com/instructlab"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View the project on GitHub
                  </Button>
                </EmptyStateActions>
              </EmptyStateFooter>
            </EmptyState>
          ) : viewType === 'table' ? (
            <Table
              className="contributions-table"
              enablePagination
              defaultSortColumn={SortByIndex.indexOf(sort)}
              defaultSortDirection={sortDirection}
              setCurrentSortAndDirection={setCurrentSortAndDirection}
              emptyTableView={filteredEmptyView}
              data={filteredContributions}
              columns={ContributionColumns}
              isStickyHeader
              toolbarContent={toolbar}
              rowRenderer={(contribution) => (
                <ContributionTableRow key={contribution.branchName} contribution={contribution} onUpdateContributions={triggerUpdateContributions} />
              )}
            />
          ) : (
            <CardView
              enablePagination
              emptyTableView={filteredEmptyView}
              data={filteredContributions}
              toolbarContent={toolbar}
              cardRenderer={(contribution) => (
                <ContributionCard key={contribution.branchName} contribution={contribution} onUpdateContributions={triggerUpdateContributions} />
              )}
            />
          )}
        </FlexItem>
      </Flex>
    </PageSection>
  );
};

export default Dashboard;
