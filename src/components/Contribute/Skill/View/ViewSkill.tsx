// src/app/components/contribute/Skill/view/ViewSkill.tsx
'use client';

import * as React from 'react';
import { SkillEditFormData } from '@/types';
import { useRouter } from 'next/navigation';
import {
  PageSection,
  Flex,
  FlexItem,
  Title,
  Content,
  PageBreadcrumb,
  Breadcrumb,
  BreadcrumbItem,
  PageGroup,
  Label,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription
} from '@patternfly/react-core';
import { CatalogIcon, PficonTemplateIcon } from '@patternfly/react-icons';
import { useEnvConfig } from '@/context/EnvConfigContext';
import ViewContributionSection from '@/components/Common/ViewContributionSection';
import ViewSkillSeedExample from '@/components/Contribute/Skill/View/ViewSkillSeedExample';

interface ViewKnowledgeProps {
  skillEditFormData: SkillEditFormData;
}

const ViewKnowledgeNative: React.FC<ViewKnowledgeProps> = ({ skillEditFormData }) => {
  const router = useRouter();
  const {
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <PageGroup isFilled style={{ overflowY: 'hidden', flex: 1 }}>
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
          <BreadcrumbItem isActive>{skillEditFormData?.formData?.submissionSummary || `Draft skill contribution`}</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection className="knowledge-form" style={{ overflowY: 'hidden' }}>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl">
                  {skillEditFormData?.formData?.submissionSummary || `Draft knowledge contribution`}
                </Title>
              </FlexItem>
              <FlexItem>
                <Label key="knowledge" variant="outline" icon={<CatalogIcon />}>
                  Skills
                </Label>
              </FlexItem>
              {skillEditFormData.isDraft ? (
                <FlexItem>
                  <Label key="draft" variant="outline" icon={<PficonTemplateIcon />}>
                    Draft
                  </Label>
                </FlexItem>
              ) : null}
            </Flex>
          </FlexItem>
          <FlexItem>
            <Content component="p">
              Knowledge contributions improve a model’s ability to answer questions accurately. They consist of questions and answers, and documents
              which back up that data.
            </Content>
          </FlexItem>
        </Flex>
      </PageSection>
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

          {/* Attribution Information */}
          {isGithubMode ? (
            <FlexItem>
              <ViewContributionSection
                title="Source attribution"
                descriptionItems={[
                  <DescriptionListGroup key="title-work">
                    <DescriptionListTerm>Title</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{skillEditFormData.formData.titleWork}</div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>,
                  <DescriptionListGroup key="license">
                    <DescriptionListTerm>License of the work</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{skillEditFormData.formData.licenseWork}</div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>,
                  <DescriptionListGroup key="creators">
                    <DescriptionListTerm>Authors</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{skillEditFormData.formData.creators}</div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ]}
              />
            </FlexItem>
          ) : null}

          {/* Seed Examples */}
          <FlexItem>
            <ViewContributionSection
              title="Seed data"
              descriptionText="Data that will be used to start teaching your model."
              descriptionItems={[
                <DescriptionListGroup key="examples">
                  <DescriptionListTerm>Examples</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                      {skillEditFormData.formData.seedExamples?.map((seedExample, index) => (
                        <FlexItem key={`seed-${index}`}>
                          <ViewSkillSeedExample seedExample={seedExample} index={index} />
                        </FlexItem>
                      ))}
                    </Flex>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ]}
            />
          </FlexItem>
        </Flex>
      </PageSection>
    </PageGroup>
  );
};

export default ViewKnowledgeNative;
