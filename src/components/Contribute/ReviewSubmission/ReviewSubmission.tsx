// src/components/Contribute/ReviewSubmission/ReviewSubmission.tsx
import React from 'react';
import { ContributionFormData, KnowledgeFormData } from '@/types';
import { Flex, DescriptionListGroup, DescriptionListTerm, DescriptionListDescription, FlexItem } from '@patternfly/react-core';
import PageHeader from '@/components/Contribute/PageHeader';
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
      <PageHeader
        title="Review"
        description="Review the information below and click `Submit` to submit your skill contribution. Use the back button to make changes."
      />
    </FlexItem>

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
          ...(!isSkillContribution
            ? [
                <DescriptionListGroup key="domain">
                  <DescriptionListTerm>Domain</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{(contributionFormData as KnowledgeFormData).domain}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]
            : []),
          <DescriptionListGroup key="document-outline">
            <DescriptionListTerm>Document outline</DescriptionListTerm>
            <DescriptionListDescription>
              <div>{contributionFormData.documentOutline}</div>
            </DescriptionListDescription>
          </DescriptionListGroup>
        ]}
      />
    </FlexItem>

    {/* File path */}
    <FlexItem>
      <ReviewSection
        title="File path information"
        descriptionText={`The directory location within taxonomy repository structure for the QnA Yaml${isGithubMode ? ' and Attribution files.' : '.'}`}
        descriptionItems={[
          <DescriptionListGroup key="file-path">
            <DescriptionListTerm>File path</DescriptionListTerm>
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

    {/* Document Information */}
    {!isSkillContribution ? (
      <FlexItem>
        <ReviewSection
          title="Document information"
          descriptionText="Information describing the uploaded documents"
          descriptionItems={[
            <DescriptionListGroup key="repository-url">
              <DescriptionListTerm>Repository URL</DescriptionListTerm>
              <DescriptionListDescription>
                <div>{(contributionFormData as KnowledgeFormData).knowledgeDocumentRepositoryUrl}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>,
            <DescriptionListGroup key="commit-sha">
              <DescriptionListTerm>Commit SHA</DescriptionListTerm>
              <DescriptionListDescription>
                <div>{(contributionFormData as KnowledgeFormData).knowledgeDocumentCommit}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>,
            <DescriptionListGroup key="document-names">
              <DescriptionListTerm>Document names</DescriptionListTerm>
              <DescriptionListDescription>
                <div>{(contributionFormData as KnowledgeFormData).documentName}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ]}
        />
      </FlexItem>
    ) : null}

    {/* Attribution Information */}
    {isGithubMode ? (
      <FlexItem>
        <ReviewSection
          title="Attribution information"
          descriptionItems={[
            ...(!isSkillContribution
              ? [
                  <DescriptionListGroup key="work-link">
                    <DescriptionListTerm>Work link or URL</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{(contributionFormData as KnowledgeFormData).linkWork}</div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ]
              : []),
            <DescriptionListGroup key="title-work">
              <DescriptionListTerm>Title of Work</DescriptionListTerm>
              <DescriptionListDescription>
                <div>{contributionFormData.titleWork}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>,
            ...(!isSkillContribution
              ? [
                  <DescriptionListGroup key="revision">
                    <DescriptionListTerm>Document revision</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{(contributionFormData as KnowledgeFormData).revision}</div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ]
              : []),
            <DescriptionListGroup key="license">
              <DescriptionListTerm>License</DescriptionListTerm>
              <DescriptionListDescription>
                <div>{contributionFormData.licenseWork}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>,
            <DescriptionListGroup key="creators">
              <DescriptionListTerm>Creators name</DescriptionListTerm>
              <DescriptionListDescription>
                <div>{contributionFormData.creators}</div>
              </DescriptionListDescription>
            </DescriptionListGroup>
          ]}
        />
      </FlexItem>
    ) : null}
  </Flex>
);

export default ReviewSubmission;
