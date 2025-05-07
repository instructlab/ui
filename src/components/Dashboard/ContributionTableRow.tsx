import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { Tr, Td } from '@patternfly/react-table';
import { t_global_color_disabled_100 as DisabledColor } from '@patternfly/react-tokens/dist/esm/t_global_color_disabled_100';
import { ContributionInfo } from '@/types';
import TruncatedText from '@/components/Common/TruncatedText';
import TableRowTitleDescription from '@/components/Table/TableRowTitleDescription';
import { getTaxonomyDir, getFormattedLastUpdatedDate } from '@/components/Dashboard/const';
import ContributionActions from '@/components/Dashboard/ContributionActions';
import ContributionStatus from '@/components/Dashboard/ContributionStatus';
import { NewContributionLabel, KnowledgeContributionLabel, SkillContributionLabel } from '@/components/Contribute/ContributionLabels';

interface Props {
  contribution: ContributionInfo;
  onUpdateContributions: () => void;
  addAlert: (message: string, status: 'success' | 'danger') => void;
}

const ContributionTableRow: React.FC<Props> = ({ contribution, onUpdateContributions, addAlert }) => {
  const router = useRouter();

  return (
    <Tr>
      <Td modifier="truncate" dataLabel="Title">
        <TableRowTitleDescription
          title={
            <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
              <FlexItem>
                <Button
                  variant="link"
                  isInline
                  onClick={() =>
                    router.push(
                      `/contribute/${contribution.isKnowledge ? 'knowledge' : 'skill'}/${contribution.branchName}${contribution.isDraft ? '/isDraft' : ''}`
                    )
                  }
                >
                  <TruncatedText maxLines={2} content={contribution.title} />
                </Button>
              </FlexItem>
              {!contribution.isSubmitted ? (
                <FlexItem>
                  <NewContributionLabel />
                </FlexItem>
              ) : null}
            </Flex>
          }
        />
      </Td>
      <Td dataLabel="Type">{contribution.isKnowledge ? <KnowledgeContributionLabel /> : <SkillContributionLabel />}</Td>
      <Td dataLabel="Taxonomy">
        {contribution.taxonomy ? getTaxonomyDir(contribution.taxonomy) : <span style={{ color: DisabledColor.var }}>Not defined</span>}
      </Td>
      <Td dataLabel="Status">
        <ContributionStatus contribution={contribution} />
      </Td>
      <Td dataLabel="Last updated">{getFormattedLastUpdatedDate(contribution.lastUpdated)}</Td>
      <Td isActionCell>
        <ContributionActions contribution={contribution} onUpdateContributions={onUpdateContributions} addAlert={addAlert} />
      </Td>
    </Tr>
  );
};

export default ContributionTableRow;
