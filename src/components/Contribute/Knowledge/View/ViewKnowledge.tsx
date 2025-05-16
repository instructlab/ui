// src/app/components/Contribute/Knowledge/View/ViewKnowledge.tsx
'use client';

import * as React from 'react';
import { KnowledgeEditFormData, KnowledgeFormData } from '@/types';
import {
  PageSection,
  Flex,
  FlexItem,
  PageGroup,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription
} from '@patternfly/react-core';
import KnowledgeContributionSidePanelHelp from '@/components/SidePanelContents/KnowledgeContributionSidePanelHelp';
import ViewContributionSection from '@/components/Common/ViewContributionSection';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { isDraftDataExist } from '@/components/Contribute/Utils/autoSaveUtils';
import ContributePageHeader from '@/components/Contribute/ContributePageHeader';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import KnowledgeFormActions from '@/components/Contribute/Knowledge/KnowledgeFormActions';
import KnowledgeSeedExampleCard from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExampleCard';

import '../knowledge.css';

interface ViewKnowledgeProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
  draftData?: KnowledgeFormData;
}

const ViewKnowledge: React.FC<ViewKnowledgeProps> = ({ knowledgeEditFormData, draftData }) => {
  const [actionGroupAlertContent, setActionGroupAlertContent] = React.useState<ActionGroupAlertContent | undefined>();
  const [scrollableRef, setScrollableRef] = React.useState<HTMLElement | null>();
  const [bodyRef, setBodyRef] = React.useState<HTMLElement | null>();
  const currentData = draftData || knowledgeEditFormData?.formData;

  if (!currentData) {
    return null;
  }

  return (
    <PageGroup isFilled style={{ overflowY: 'hidden', flex: 1 }}>
      <ContributePageHeader
        editFormData={knowledgeEditFormData}
        draftData={draftData}
        description="Knowledge contributions improve a model’s ability to answer questions accurately. They consist of questions and answers, and documents
              which back up that data."
        sidePanelContent={<KnowledgeContributionSidePanelHelp />}
        helpText="Learn more about knowledge contributions"
        actions={
          <KnowledgeFormActions
            contributionTitle={currentData.submissionSummary}
            knowledgeFormData={currentData}
            isDraft={isDraftDataExist(currentData.branchName)}
            isSubmitted={!!knowledgeEditFormData}
            setActionGroupAlertContent={setActionGroupAlertContent}
          />
        }
      />
      <div className="knowledge-form">
        <PageSection ref={setScrollableRef} isFilled>
          <Flex direction={{ default: 'column' }} gap={{ default: 'gapXl' }}>
            {/* Author Information */}
            <FlexItem>
              <ViewContributionSection
                title="Contributor details"
                descriptionText="Information required for a GitHub Developer Certificate of Origin (DCO) sign-off."
                descriptionItems={[
                  <DescriptionListGroup key="contributors">
                    <DescriptionListTerm>Contributors</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{currentData.name}</div>
                      <div>{currentData.email}</div>
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
                      <div>{currentData.submissionSummary}</div>
                    </DescriptionListDescription>
                  </DescriptionListGroup>,
                  <DescriptionListGroup key="file-path">
                    <DescriptionListTerm>Directory path</DescriptionListTerm>
                    <DescriptionListDescription>
                      <div>{currentData.filePath}</div>
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
                      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} ref={setBodyRef}>
                        {currentData.seedExamples?.map((seedExample, index) => (
                          <FlexItem key={`seed-${index}`}>
                            <KnowledgeSeedExampleCard
                              isReadOnly
                              scrollable={scrollableRef || null}
                              bodyRef={bodyRef || null}
                              seedExampleIndex={index}
                              seedExample={seedExample}
                            />
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
      </div>
      <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={() => setActionGroupAlertContent(undefined)} />
    </PageGroup>
  );
};

export default ViewKnowledge;
