// src/app/components/contribute/ContributePageHeader.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { PageSection, Flex, FlexItem, Title, PageBreadcrumb, Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { EditFormData, KnowledgeFormData, SkillFormData } from '@/types';
import PageDescriptionWithHelp from '@/components/Common/PageDescriptionWithHelp';
import {
  DraftContributionLabel,
  KnowledgeContributionLabel,
  NewContributionLabel,
  SkillContributionLabel
} from '@/components/Contribute/ContributionLabels';

interface Props {
  editFormData?: EditFormData<SkillFormData | KnowledgeFormData>;
  isEdit?: boolean;
  isSkill?: boolean;
  description: React.ReactNode;
  helpText: React.ReactNode;
  sidePanelContent: React.ReactNode;
  actions: React.ReactNode;
}

const ContributePageHeader: React.FC<Props> = ({
  editFormData,
  isEdit = false,
  isSkill = false,
  description,
  helpText,
  sidePanelContent,
  actions
}) => {
  const router = useRouter();
  const contributionType = isSkill ? 'skill' : 'knowledge';
  const viewUrl = `/contribute/${isSkill ? 'skill' : 'knowledge'}/${editFormData?.formData.branchName}${editFormData?.isDraft ? '/isDraft' : ''}`;
  const contributionTitle = editFormData?.formData?.submissionSummary || `Draft ${contributionType} contribution`;

  return (
    <>
      <PageBreadcrumb stickyOnBreakpoint={{ default: 'top' }}>
        <Breadcrumb>
          <BreadcrumbItem
            to="/"
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard');
            }}
          >
            My contributions
          </BreadcrumbItem>
          {editFormData && isEdit ? (
            <BreadcrumbItem
              to={viewUrl}
              onClick={(e) => {
                e.preventDefault();
                router.push(viewUrl);
              }}
            >
              {!editFormData
                ? `Contribute ${contributionType}`
                : editFormData?.formData?.submissionSummary || `Draft ${contributionType} contribution`}
            </BreadcrumbItem>
          ) : null}
          <BreadcrumbItem isActive>
            {!editFormData ? `Contribute ${contributionType}` : isEdit ? `Edit contribution` : contributionTitle}
          </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection>
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem>
            <Flex direction={{ default: 'column' }}>
              <FlexItem>
                <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                  <FlexItem>
                    <Title headingLevel="h1" size="2xl">
                      {!editFormData
                        ? `Submit ${contributionType} contribution`
                        : editFormData?.formData?.submissionSummary || `Draft ${isSkill ? 'skill' : 'knowledge'} contribution`}
                    </Title>
                  </FlexItem>
                  <FlexItem>{isSkill ? <SkillContributionLabel /> : <KnowledgeContributionLabel />}</FlexItem>
                  {editFormData?.isDraft ? (
                    <FlexItem>
                      <DraftContributionLabel />
                    </FlexItem>
                  ) : null}
                  {editFormData && !editFormData.isSubmitted ? (
                    <FlexItem>
                      <NewContributionLabel isCompact={false} />
                    </FlexItem>
                  ) : null}
                </Flex>
              </FlexItem>
              <FlexItem>
                <PageDescriptionWithHelp description={description} helpText={helpText} sidePanelContent={sidePanelContent} />
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>{actions}</FlexItem>
        </Flex>
      </PageSection>
    </>
  );
};

export default ContributePageHeader;
