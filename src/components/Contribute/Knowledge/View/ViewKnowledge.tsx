// src/app/components/Contribute/Knowledge/View/ViewKnowledge.tsx
'use client';

import * as React from 'react';
import { KnowledgeEditFormData } from '@/types';
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
import ViewContributionSection from '@/components/Common/ViewContributionSection';
import ViewKnowledgeSeedExample from '@/components/Contribute/Knowledge/View/ViewKnowledgeSeedExample';

interface ViewKnowledgeProps {
  knowledgeEditFormData: KnowledgeEditFormData;
}

const ViewKnowledge: React.FC<ViewKnowledgeProps> = ({ knowledgeEditFormData }) => {
  const router = useRouter();

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
          <BreadcrumbItem isActive>{knowledgeEditFormData?.formData?.submissionSummary || `Draft knowledge contribution`}</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection className="knowledge-form" style={{ overflowY: 'hidden' }}>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <FlexItem>
                <Flex
                  direction={{ default: 'row' }}
                  gap={{ default: 'gapLg' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                  justifyContent={{ default: 'justifyContentSpaceBetween' }}
                >
                  <FlexItem>
                    <Title headingLevel="h1" size="2xl">
                      {knowledgeEditFormData?.formData?.submissionSummary || `Draft knowledge contribution`}
                    </Title>
                  </FlexItem>
                  {/** TODO: Add actions here */}
                </Flex>
              </FlexItem>
              <FlexItem>
                <Label key="knowledge" variant="outline" icon={<CatalogIcon />}>
                  Knowledge
                </Label>
              </FlexItem>
              {knowledgeEditFormData.isDraft ? (
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
                    <div>{knowledgeEditFormData.formData.name}</div>
                    <div>{knowledgeEditFormData.formData.email}</div>
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
                    <div>{knowledgeEditFormData.formData.submissionSummary}</div>
                  </DescriptionListDescription>
                </DescriptionListGroup>,
                <DescriptionListGroup key="file-path">
                  <DescriptionListTerm>Directory path</DescriptionListTerm>
                  <DescriptionListDescription>
                    <div>{knowledgeEditFormData.formData.filePath}</div>
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
                    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
                      {knowledgeEditFormData.formData.seedExamples?.map((seedExample, index) => (
                        <FlexItem key={`seed-${index}`}>
                          <ViewKnowledgeSeedExample seedExample={seedExample} index={index} />
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

export default ViewKnowledge;
