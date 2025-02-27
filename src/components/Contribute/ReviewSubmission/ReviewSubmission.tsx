// src/components/Contribute/ReviewSubmission/ReviewSubmission.tsx
import React from 'react';
import { ContributionFormData, KnowledgeFormData } from '@/types';
import { Content, ContentVariants, Form, Accordion, AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
import './submission.css';

interface ReviewSubmissionProps {
  contributionFormData: ContributionFormData;
  isSkillContribution: boolean;
  isGithubMode: boolean;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ contributionFormData, isSkillContribution, isGithubMode }) => {
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
            Review the information below and click `Submit` to submit your skill contribution. Use the back button to make changes.
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
              <Content component={ContentVariants.p}>{contributionFormData.name}</Content>
              <Content component={ContentVariants.p}>{contributionFormData.email}</Content>
            </div>
          </article>

          {/* Information */}
          <article>
            <div className="info-wrapper">
              <Content component={ContentVariants.p} className="submission-titles">
                {isSkillContribution ? 'Skill' : 'Knowledge'} Information
              </Content>
              <Content component={ContentVariants.p} className="submission-subtitles">
                Brief information about the Knowledge and the directory path for the QnA and Attribution files.
              </Content>
            </div>

            <Content component={ContentVariants.h5} className="category-titles">
              Submission summary
            </Content>
            <Content component={ContentVariants.p}>{contributionFormData.submissionSummary}</Content>
            <Content component={ContentVariants.h5} className="category-titles">
              Domain
            </Content>
            {!isSkillContribution ? (
              <>
                <Content component={ContentVariants.p}>{(contributionFormData as KnowledgeFormData).domain}</Content>
                <Content component={ContentVariants.h5} className="category-titles">
                  Document Outline
                </Content>
                <Content component={ContentVariants.p}>{(contributionFormData as KnowledgeFormData).documentOutline}</Content>
              </>
            ) : null}
          </article>

          <article>
            {/* Directory path */}
            <Content component={ContentVariants.h5} className="category-titles">
              Directory path
            </Content>

            <Content component={ContentVariants.p}>{contributionFormData.filePath}</Content>
          </article>

          {/* Seed Examples */}
          <article>
            <div className="info-wrapper">
              <Content component={ContentVariants.p}>Seed Examples</Content>
              <Content component={ContentVariants.p} className="submission-subtitles">
                Data that will be used to start teaching your model.
              </Content>
            </div>

            {contributionFormData.seedExamples?.map((seedExample, index) => (
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

          {!isSkillContribution ? (
            <>
              {/* Document Information */}
              <article>
                <Content component={ContentVariants.p} className="category-titles">
                  Document Information
                </Content>
                <Content component={ContentVariants.h5} className="category-titles">
                  Repository URL
                </Content>
                <Content component={ContentVariants.p}>{(contributionFormData as KnowledgeFormData).knowledgeDocumentRepositoryUrl}</Content>
                <Content component={ContentVariants.h5} className="category-titles">
                  Commit
                </Content>
                <Content component={ContentVariants.p}>{(contributionFormData as KnowledgeFormData).knowledgeDocumentCommit}</Content>
                <Content component={ContentVariants.h5} className="category-titles">
                  Name
                </Content>
                <Content component={ContentVariants.p}>{(contributionFormData as KnowledgeFormData).documentName}</Content>
              </article>
            </>
          ) : null}

          <article className="info-wrapper">
            {/* Attribution Information */}
            {isGithubMode && (
              <div>
                <Content component={ContentVariants.p}>
                  <strong>Attribution Information</strong>
                </Content>
                <Content component={ContentVariants.p}>
                  <i>Title of Work:</i> {contributionFormData.titleWork}
                </Content>
                {!isSkillContribution ? (
                  <>
                    <Content component={ContentVariants.p}>
                      <i>Link to Work:</i> {(contributionFormData as KnowledgeFormData).linkWork}
                    </Content>
                    <Content component={ContentVariants.p}>
                      <i>Revision:</i> {(contributionFormData as KnowledgeFormData).revision}
                    </Content>
                  </>
                ) : null}
                <Content component={ContentVariants.p}>
                  <i>License of Work:</i> {contributionFormData.licenseWork}
                </Content>
                <Content component={ContentVariants.p}>
                  <i>Creators:</i> {contributionFormData.creators}
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
