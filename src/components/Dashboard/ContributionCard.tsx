// src/components/Dashboard/ContributionCard.tsx
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardBody,
  Flex,
  FlexItem,
  CardHeader,
  CardTitle,
  Button,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  GalleryItem
} from '@patternfly/react-core';
import { t_global_color_disabled_100 as DisabledColor } from '@patternfly/react-tokens';
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
}

const ContributionCard: React.FC<Props> = ({ contribution, onUpdateContributions }) => {
  const router = useRouter();

  return (
    <GalleryItem key={contribution.branchName}>
      <Card className="contribution-card">
        <Flex direction={{ default: 'column' }} className="contribution-card__body">
          <FlexItem>
            <CardHeader
              actions={{
                actions: <ContributionActions contribution={contribution} onUpdateContributions={onUpdateContributions} />
              }}
            >
              {contribution.isKnowledge ? <KnowledgeContributionLabel /> : <SkillContributionLabel />}
            </CardHeader>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Flex gap={{ default: 'gapNone' }} alignItems={{ default: 'alignItemsCenter' }} flexWrap={{ default: 'nowrap' }}>
              <FlexItem>
                <CardTitle>
                  <TableRowTitleDescription
                    title={
                      <Button
                        component="a"
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
                    }
                  />
                </CardTitle>
              </FlexItem>
              {!contribution.isSubmitted ? (
                <FlexItem>
                  <NewContributionLabel />
                </FlexItem>
              ) : null}
            </Flex>
          </FlexItem>
          <FlexItem>
            <CardBody>
              <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
                <FlexItem>
                  <DescriptionList isCompact>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Taxonomy</DescriptionListTerm>
                      <DescriptionListDescription>
                        {contribution.taxonomy ? (
                          getTaxonomyDir(contribution.taxonomy)
                        ) : (
                          <span style={{ color: DisabledColor.var }}>Not defined</span>
                        )}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Status</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ContributionStatus contribution={contribution} />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Last updated</DescriptionListTerm>
                      <DescriptionListDescription>{getFormattedLastUpdatedDate(contribution.lastUpdated)}</DescriptionListDescription>
                    </DescriptionListGroup>
                  </DescriptionList>
                </FlexItem>
              </Flex>
            </CardBody>
          </FlexItem>
        </Flex>
      </Card>
    </GalleryItem>
  );
};

export default ContributionCard;
