import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Content } from '@patternfly/react-core';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import SidePanelHelp from '@/components/SidePanelContents/SidePanelHelp';

interface Props {
  knowledgeOnly?: boolean;
}

const ContributionsSidePanelHelp: React.FC<Props> = ({ knowledgeOnly }) => {
  const router = useRouter();
  const {
    featureFlags: { skillFeaturesEnabled }
  } = useFeatureFlags();
  const showSkillsInfo = !knowledgeOnly && skillFeaturesEnabled;

  return (
    <SidePanelHelp
      header="About contributions"
      description={`Contributions enable you to teach your model new information.${showSkillsInfo ? ' There are two types of contributions: knowledge and skills.' : ''}`}
      body={
        <div>
          <strong>Knowledge contributions</strong>
          <Content component="p">
            Knowledge contributions enable you to add new facts, data, or references into your model to enhance its ability to accurately answer
            questions. Upload a document such as a textbook, technical manual, or journal, to get started.{' '}
            {showSkillsInfo ? (
              <Button variant="link" isInline onClick={() => router.push('/contribute/knowledge')}>
                Create a knowledge contribution
              </Button>
            ) : null}
          </Content>
          {knowledgeOnly ? (
            <>
              <strong>Creating seed data</strong>
              <Content component="p">
                Seed data consist of a context, which is a portion of the selected document, and at least 5 question-and-answer (Q and A) pairs that
                represent the knowledge you are trying to teach your model.
              </Content>
              <Content component="p">
                The Q and A pairs that you create should be diverse. Rephrase questions in different ways, and create unique contexts.
              </Content>
              <Content component="p">
                For example, when training a model to answer questions about a context that contains information about different species of birds and
                their visual characteristics, don’t create Q and A pairs that only relate to finches. Doing so might unintentionally prevent the model
                from answering questions about other bird species.
              </Content>
            </>
          ) : null}
          {showSkillsInfo ? (
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
