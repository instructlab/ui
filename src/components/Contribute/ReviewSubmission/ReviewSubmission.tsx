// src/components/Contribute/ReviewSubmission/ReviewSubmission.tsx
import React from 'react';
import { ContributionFormData, KnowledgeFormData } from '@/types';
import { Flex, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, FlexItem } from '@patternfly/react-core';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import ReviewSection from '@/components/Contribute/ReviewSubmission/ReviewSection';

interface ReviewSubmissionProps {
  contributionFormData: ContributionFormData;
  seedExamples: React.ReactNode;
  isSkillContribution: boolean;
  isGithubMode: boolean;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ contributionFormData, seedExamples, isSkillContribution, isGithubMode }) => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
    <FlexItem>
      <WizardPageHeader
        title="Review submission"
        description="Review the information below and click `Submit` to submit your skill contribution. Use the back button to make changes."
      />
    </FlexItem>
    <FlexItem>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapXl' }}>
        {/* Author Information */}
        <FlexItem>
          <ReviewSection
            title="Contributor Information"
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
            title={`${isSkillContribution ? 'Skill' : 'Knowledge'} Information`}
            descriptionText={`Brief information about the ${isSkillContribution ? 'skill' : 'knowledge'}`}
            descriptionItems={[
              <DescriptionListGroup key="submission-summary">
                <DescriptionListTerm>Submission summary</DescriptionListTerm>
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

        {/* Attribution Information */}
        {isGithubMode ? (
          <FlexItem>
            <ReviewSection
              title="Attribution information"
              descriptionItems={[
                <DescriptionListGroup key="title-work">
                  <DescriptionListTerm>Title</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{contributionFormData.titleWork}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>,
                ...(!isSkillContribution
                  ? [
                      <DescriptionListGroup key="work-link">
                        <DescriptionListTerm>Link to work</DescriptionListTerm>
                        <DescriptionListDescription>
                          <div>{(contributionFormData as KnowledgeFormData).linkWork}</div>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    ]
                  : []),
                ...(!isSkillContribution
                  ? [
                      <DescriptionListGroup key="revision">
                        <DescriptionListTerm>Revision</DescriptionListTerm>
                        <DescriptionListDescription>
                          <div>{(contributionFormData as KnowledgeFormData).revision}</div>
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    ]
                  : []),
                <DescriptionListGroup key="license">
                  <DescriptionListTerm>License of the work</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{contributionFormData.licenseWork}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>,
                <DescriptionListGroup key="creators">
                  <DescriptionListTerm>Author(s)</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{contributionFormData.creators}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>
        ) : null}

        {/* Seed Examples */}
        <FlexItem>
          <ReviewSection
            title="Seed examples"
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

export default ReviewSubmission;
