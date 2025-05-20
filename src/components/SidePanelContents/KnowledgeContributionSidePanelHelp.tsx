import * as React from 'react';
import { Content } from '@patternfly/react-core';
import SidePanelHelp from '@/components/SidePanelContents/SidePanelHelp';

const KnowledgeContributionsSidePanelHelp: React.FC = () => (
  <SidePanelHelp
    header="About contributions"
    description="Contributions enable you to teach your model new information."
    body={
      <div>
        <strong>Knowledge contributions</strong>
        <Content component="p">
          Knowledge contributions enable you to add new facts, data, or references into your model to enhance its ability to accurately answer
          questions. Upload a document such as a textbook, technical manual, or journal, to get started.
        </Content>
        <Content component="p">
          The Q and A pairs that you create should be diverse. Rephrase questions in different ways, and create unique contexts.
        </Content>
        For example, when training a model to answer questions about a context that contains information about different species of birds and their
        visual characteristics, don’t create Q and A pairs that only relate to finches. Doing so might unintentionally prevent the model from
        answering questions about other bird species.
        <Content component="p"></Content>
        <strong>Creating a knowledge contribution</strong>
        <Content component="ul">
          <Content component="li">
            Upload a document containing the desired data to the <strong>Documents</strong> page.
          </Content>
          <Content component="li">
            From the <strong>My contributions</strong> page, click <strong>Contribute</strong>.
          </Content>
          <Content component="li">
            Select a portion of the document to use as the context. This is the information that one of your question-and-answer (Q and A) pairs will
            be based on.
          </Content>
          <Content component="li">Create Q and A pairs that can be answered by the text in the context field.</Content>
        </Content>
      </div>
    }
  />
);

export default KnowledgeContributionsSidePanelHelp;
