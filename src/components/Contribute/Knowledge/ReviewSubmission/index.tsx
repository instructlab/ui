// src/components/Contribute/Knowledge/ReviewSubmission/ReviewSubmission.tsx
import { KnowledgeFormData } from '@/types';
import { Content, ContentVariants, Form, Accordion, AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
import React from 'react';
import '../../Skill/ReviewSubmission/submission.css';

interface ReviewSubmissionProps {
  knowledgeFormData: KnowledgeFormData;
  isGithubMode: boolean;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ knowledgeFormData, isGithubMode }) => {
  const [expanded, setExpanded] = React.useState<{ [key: string]: boolean }>({});

  const onToggle = (id: number) => {
    setExpanded((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  return (
    <>
      <Form>
        <section className="review-submission-container">
          <Content component={ContentVariants.h2}>Review</Content>
          <Content component={ContentVariants.p}>
            Review the information below and click finish to submit your skill contribution. Use the back button to make changes.
          </Content>
          {/* Author Information */}
          <article>
            <div className="info-wrapper">
              <Content component={ContentVariants.p} className="submission-titles">
                Contributor Information
              </Content>
              <Content component={ContentVariants.p} className="submission-subtitles">
                Information required for a Github Developer Certificate of Origin (DCO) sign-off.
              </Content>
            </div>

            <div className="contributors-wrapper">
              <Content component={ContentVariants.h5} className="category-titles">
                Contributors
              </Content>
              <Content component={ContentVariants.p}>{knowledgeFormData.name}</Content>
              <Content component={ContentVariants.p}>{knowledgeFormData.email}</Content>
            </div>
          </article>

          {/* Knowledge Information */}
          <article>
            <div className="info-wrapper">
              <Content component={ContentVariants.p} className="submission-titles">
                Knowledge Information
              </Content>
              <Content component={ContentVariants.p} className="submission-subtitles">
                Brief information about the Knowledge and the directory path for the QnA and Attribution files.
              </Content>
            </div>

            <Content component={ContentVariants.h5} className="category-titles">
              Submission summary
            </Content>
            <Content component={ContentVariants.p}>{knowledgeFormData.submissionSummary}</Content>
            <Content component={ContentVariants.h5} className="category-titles">
              Domain
            </Content>
            <Content component={ContentVariants.p}>{knowledgeFormData.domain}</Content>
            <Content component={ContentVariants.h5} className="category-titles">
              Document Outline
            </Content>
            <Content component={ContentVariants.p}>{knowledgeFormData.documentOutline}</Content>
          </article>

          <article>
            {/* Directory path */}
            <Content component={ContentVariants.h5} className="category-titles">
              Directory path
            </Content>

            <Content component={ContentVariants.p}>{knowledgeFormData.filePath}</Content>
          </article>

          {/* Seed Examples */}
          <article>
            <div className="info-wrapper">
              <Content component={ContentVariants.p}>Seed Examples</Content>
              <Content component={ContentVariants.p} className="submission-subtitles">
                Data that will be used to start teaching your model.
              </Content>
            </div>

            {knowledgeFormData.seedExamples?.map((seedExample, index) => (
              <Accordion asDefinitionList={false} className="accordion-wrapper" key={`seed-${index}`}>
                <AccordionItem isExpanded={!!expanded[index]} key={`accordion-item-${index}`}>
                  <AccordionToggle onClick={() => onToggle(index)} id={`seed-example-toggle-${index}`} className="accordion-toggle-item">
                    Sample {index + 1}
                  </AccordionToggle>
                  <AccordionContent id={`seed-example-content-${index}`}>
                    <div className="accordion-content">
                      <Content component={ContentVariants.h5} className="seed-category-titles">
                        Context:
                      </Content>{' '}
                      {seedExample.context}
                    </div>
                    {seedExample.questionAndAnswers.map((qa, qaIndex) => (
                      <React.Fragment key={`qa-${index}-${qaIndex}`}>
                        <div className="accordion-content">
                          <Content component={ContentVariants.h5} className="seed-category-titles">
                            Question:
                          </Content>{' '}
                          {qa.question}
                        </div>
                        <div className="accordion-content">
                          <Content component={ContentVariants.h5} className="seed-category-titles">
                            Answer:
                          </Content>{' '}
                          {qa.answer}
                        </div>
                      </React.Fragment>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
          </article>

          {/* Document Information */}
          <article>
            <Content component={ContentVariants.p} className="category-titles">
              Document Information
            </Content>
            <Content component={ContentVariants.h5} className="category-titles">
              Repository URL
            </Content>
            <Content component={ContentVariants.p}>{knowledgeFormData.knowledgeDocumentRepositoryUrl}</Content>
            <Content component={ContentVariants.h5} className="category-titles">
              Commit
            </Content>
            <Content component={ContentVariants.p}>{knowledgeFormData.knowledgeDocumentCommit}</Content>
            <Content component={ContentVariants.h5} className="category-titles">
              Name
            </Content>
            <Content component={ContentVariants.p}>{knowledgeFormData.documentName}</Content>
          </article>

          <article className="info-wrapper">
            {/* Attribution Information */}
            {isGithubMode && (
              <div>
                <Content component={ContentVariants.p}>
                  <strong>Attribution Information</strong>
                </Content>
                <Content component={ContentVariants.p}>
                  <i>Title of Work:</i> {knowledgeFormData.titleWork}
                </Content>
                <Content component={ContentVariants.p}>
                  <i>Link to Work:</i> {knowledgeFormData.linkWork}
                </Content>
                <Content component={ContentVariants.p}>
                  <i>Revision:</i> {knowledgeFormData.revision}
                </Content>
                <Content component={ContentVariants.p}>
                  <i>License of Work:</i> {knowledgeFormData.licenseWork}
                </Content>
                <Content component={ContentVariants.p}>
                  <i>Creators:</i> {knowledgeFormData.creators}
                </Content>
              </div>
            )}
          </article>
        </section>
      </Form>
    </>
  );
};

export default ReviewSubmission;
