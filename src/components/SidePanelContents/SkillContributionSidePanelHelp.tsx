import * as React from 'react';
import { Content } from '@patternfly/react-core';
import SidePanelHelp from '@/components/SidePanelContents/SidePanelHelp';

const ContributionsSidePanelHelp: React.FC = () => {
  return (
    <SidePanelHelp
      header="Skill contributions"
      description="Skill contributions improve a model’s ability to perform tasks, such as generating a song or summarizing an email. These contributions consist of seed data which provide instructions for completing a task. There are 2 types of skills: freeform and grounded."
      body={
        <div>
          <strong>Freeform skills</strong>
          <Content component="p">Freeform skills are performative and do not require additional context.</Content>
          <Content component="p">
            For example, if you want to teach a model to summarize, you might provide a long paragraph in the <strong>Context</strong> field. You
            might enter &quot;Can you summarize this paragraph?&quot; as the question, and enter a short summary of the paragraph in the context field
            for the answer.
          </Content>
          <Content>Freeform skill examples:</Content>
          <Content component="ul">
            <Content component="li">Speak like Yoda</Content>
            <Content component="li">Convert text to camel case</Content>
            <Content component="li">Write a haiku</Content>
            <Content component="li">Generate StableDiffusion prompts</Content>
          </Content>
          <strong>Grounded skills</strong>
          <Content component="p">Grounded skills are performative and require additional context.</Content>
          <Content component="p">
            For example, if you want to teach a model to read a Markdown-formatted table layout, the additional context might be an example table
            layout. This additional context is included in the skill contribution YAML.
          </Content>
          <Content>Grounded skill examples:</Content>
          <Content component="ul">
            <Content component="li">Read the value of a cell in a table layout</Content>
            <Content component="li">Parse a JSON file</Content>
          </Content>
          <strong>Creating seed data</strong>
          <Content component="p">
            Seed data consist of at least 5 question-and-answer (Q and A) pairs that represent the skill you are trying to teach your model. If your
            skill is a grounded skill and requires context, you will also add context for each question-and-answer pair.
          </Content>
          <Content component="p">
            The Q and A pairs that you create should be diverse. Rephrase questions in different ways, and create unique contexts.
          </Content>
          <Content component="p">
            For example, when training a model to perform data extraction using Beancount, don’t use the same data repeatedly in your seed examples.
            Doing so might unintentionally teach the model to regurgitate the input data when asked a data extraction question.
          </Content>
          <strong>Creating a skill contribution</strong>
          <Content component="ul">
            <Content component="li">
              From the <strong>My contributions</strong> page, click <strong>Contribute skill</strong>.
            </Content>
            <Content component="li">
              In the <strong>Context</strong> field, provide a piece of content that you can create question-and-answer pairs based on.
            </Content>
            <Content component="ul" className="second-level-list">
              <Content component="li">
                For example, if you want to teach the model how to summarize, you might provide a long paragraph in the context field.
              </Content>
            </Content>
            <Content component="li">
              In the <strong>Question</strong> field, enter a prompt that the model will respond to.
            </Content>
            <Content component="ul" className="second-level-list">
              <Content component="li">For example, the question might be “Can you summarize this text?”</Content>
            </Content>
            <Content component="li">
              In the <strong>Answer</strong> field, enter a response to the question you provided.
            </Content>
            <Content component="ul" className="second-level-list">
              <Content component="li">
                For example, the answer might be a brief summary of the text that you entered in the <strong>Context</strong> field.
              </Content>
            </Content>
          </Content>
        </div>
      }
    />
  );
};

export default ContributionsSidePanelHelp;
