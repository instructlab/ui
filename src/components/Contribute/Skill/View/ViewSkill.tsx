// src/app/components/contribute/Skill/view/ViewSkill.tsx
'use client';

import * as React from 'react';
import { SkillEditFormData } from '@/types';
import {
  PageSection,
  Flex,
  FlexItem,
  PageGroup,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription
} from '@patternfly/react-core';
import ViewContributionSection from '@/components/Common/ViewContributionSection';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import ContributePageHeader from '@/components/Contribute/ContributePageHeader';
import SkillFormActions from '@/components/Contribute/Skill/SkillFormActions';
import SkillSeedExamples from '@/components/Contribute/Skill/View/SkillSeedExamples/SkillSeedExamples';

interface ViewSkillProps {
  skillEditFormData: SkillEditFormData;
}

const ViewSkill: React.FC<ViewSkillProps> = ({ skillEditFormData }) => {
  const [actionGroupAlertContent, setActionGroupAlertContent] = React.useState<ActionGroupAlertContent | undefined>();

  return (
    <PageGroup isFilled style={{ overflowY: 'hidden', flex: 1 }}>
      <ContributePageHeader
        editFormData={skillEditFormData}
        isSkill
        description="Skill contributions improve a model’s ability to perform tasks. They consist of seed data which provide instructions for completing a task."
        actions={
          <SkillFormActions
            contributionTitle={skillEditFormData.formData.submissionSummary}
            skillFormData={skillEditFormData.formData}
            isDraft={skillEditFormData?.isDraft}
            isSubmitted={skillEditFormData?.isDraft}
            setActionGroupAlertContent={setActionGroupAlertContent}
          />
        }
      />
      <PageSection isFilled style={{ flex: 1, overflowY: 'auto' }}>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapXl' }}>
          {/* Author Information */}
          <FlexItem>
            <ViewContributionSection
              title="Contributor details"
              descriptionText="Information required for a Github Developer Certificate of Origin (DCO) sign-off."
              descriptionItems={[
                <DescriptionListGroup key="contributors">
                  <DescriptionListTerm>Contributors</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{skillEditFormData.formData.name}</div>
                    <div>{skillEditFormData.formData.email}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>

          <FlexItem>
            <ViewContributionSection
              title="Contribution information"
              descriptionText="Brief summary of your contribution, and the directory path for your reference documents."
              descriptionItems={[
                <DescriptionListGroup key="submission-summary">
                  <DescriptionListTerm>Contribution summary</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{skillEditFormData.formData.submissionSummary}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>,
                <DescriptionListGroup key="file-path">
                  <DescriptionListTerm>Directory path</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{skillEditFormData.formData.filePath}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>

          {/* Seed Examples */}
          <FlexItem>
            <ViewContributionSection
              title="Seed data"
              descriptionText="Data that will be used to start teaching your model."
              descriptionItems={[
                <DescriptionListGroup key="examples">
                  <DescriptionListTerm>Examples</DescriptionListTerm>
                  <DescriptionListDescription>
                    <SkillSeedExamples seedExamples={skillEditFormData.formData.seedExamples} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={() => setActionGroupAlertContent(undefined)} />
    </PageGroup>
  );
};

export default ViewSkill;
