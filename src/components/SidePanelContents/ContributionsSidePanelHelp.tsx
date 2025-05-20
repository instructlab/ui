import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Content } from '@patternfly/react-core';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import SidePanelHelp from '@/components/SidePanelContents/SidePanelHelp';

const ContributionsSidePanelHelp: React.FC = () => {
  const router = useRouter();
  const {
    featureFlags: { skillFeaturesEnabled }
  } = useFeatureFlags();

  return (
    <SidePanelHelp
      header="About contributions"
      description={`Contributions enable you to teach your model new information.${skillFeaturesEnabled ? ' There are two types of contributions: knowledge and skills.' : ''}`}
      body={
        <div>
          <strong>Knowledge contributions</strong>
          <Content component="p">
            Knowledge contributions enable you to add new facts, data, or references into your model to enhance its ability to accurately answer
            questions. Upload a document such as a textbook, technical manual, or journal, to get started.{' '}
            {skillFeaturesEnabled ? (
              <Button variant="link" isInline onClick={() => router.push('/contribute/knowledge')}>
                Create a knowledge contribution
              </Button>
            ) : null}
          </Content>
          {skillFeaturesEnabled ? (
            <>
              <strong>Skill contributions</strong>
              <Content component="p">
                Skill contributions improve a model’s ability to perform tasks, such as generating a song or summarizing an email. These contributions
                consist of seed data which provide instructions for completing a task.{' '}
                <Button variant="link" isInline onClick={() => router.push('/contribute/skill')}>
                  Create a skill contribution
                </Button>
              </Content>
            </>
          ) : (
            <>
              <strong>Creating a knowledge contribution</strong>
              <Content component="ul">
                <Content component="li">
                  Upload a document containing the desired data to the <strong>Documents</strong> page.
                </Content>
                <Content component="li">
                  From the <strong>My contributions</strong> page, click <strong>Contribute</strong>.
                </Content>
                <Content component="li">
                  Select a portion of the document to use as the context. This is the information that one of your question-and-answer (Q and A) pairs
                  will be based on.
                </Content>
                <Content component="li">Create Q and A pairs that can be answered by the text in the context field.</Content>
              </Content>
            </>
          )}
        </div>
      }
    />
  );
};

export default ContributionsSidePanelHelp;
