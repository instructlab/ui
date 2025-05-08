// src/components/Contribute/ReviewSubmission/ReviewSubmission.tsx
import React from 'react';
import { ContributionFormData, KnowledgeFormData, KnowledgeSeedExample, SkillFormData, SkillSeedExample } from '@/types';
import { Flex, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, FlexItem } from '@patternfly/react-core';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import ReviewSection from '@/components/Contribute/ContributionWizard/ReviewSubmission/ReviewSection';
import { getValidatedKnowledgeSeedExamples, getValidatedSkillSeedExamples } from '@/components/Contribute/Utils/validationUtils';

interface ReviewSubmissionProps {
  contributionFormData: ContributionFormData;
  seedExamples: React.ReactNode;
  isSkillContribution: boolean;
  onUpdateSeedExamples: (seedExamples: KnowledgeSeedExample[] | SkillSeedExample[]) => void;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({
  contributionFormData,
  seedExamples,
  isSkillContribution,
  onUpdateSeedExamples
}) => {
  React.useEffect(() => {
    if (!isSkillContribution) {
      onUpdateSeedExamples(getValidatedKnowledgeSeedExamples(contributionFormData as KnowledgeFormData));
      return;
    }
    onUpdateSeedExamples(getValidatedSkillSeedExamples(contributionFormData as SkillFormData));
    // Don't update on form data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSkillContribution]);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <WizardPageHeader title="Review" description={`Confirm the details of your ${isSkillContribution ? 'skill' : 'knowledge'} contribution.`} />
      </FlexItem>
      <FlexItem>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapXl' }}>
          {/* Author Information */}
          <FlexItem>
            <ReviewSection
              title="Contributor details"
              descriptionText="Information required for a Github Developer Certificate of Origin (DCO) sign-off."
              descriptionItems={[
                <DescriptionListGroup key="contributors">
                  <DescriptionListTerm>Contributors</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{contributionFormData.name}</div>
                    <div>{contributionFormData.email}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>

          {/* Knowledge/Skill Information */}
          <FlexItem>
            <ReviewSection
              title="Contribution information"
              descriptionText="Brief summary of your contribution, and the directory path for your reference documents."
              descriptionItems={[
                <DescriptionListGroup key="submission-summary">
                  <DescriptionListTerm>Contribution summary</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{contributionFormData.submissionSummary}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>,
                <DescriptionListGroup key="file-path">
                  <DescriptionListTerm>Directory path</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{contributionFormData.filePath}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>

          {/* Seed Examples */}
          <FlexItem>
            <ReviewSection
              title="Seed data"
              descriptionText="Data that will be used to start teaching your model."
              descriptionItems={[
                <DescriptionListGroup key="examples">
                  <DescriptionListTerm>Examples</DescriptionListTerm>
                  <DescriptionListDescription>{seedExamples}</DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );
};

export default ReviewSubmission;
