// src/components/Contribute/Skill/ReviewSubmission/ReviewSubmission.tsx
import { SkillFormData } from '@/types';
import React from 'react';
import './submission.css';
import { Content, ContentVariants, Accordion, AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';

interface ReviewSubmissionProps {
  skillFormData: SkillFormData;
  isGithubMode: boolean;
}

export const ReviewSubmission: React.FC<ReviewSubmissionProps> = ({ skillFormData, isGithubMode }) => {
  const [expanded, setExpanded] = React.useState<{ [key: string]: boolean }>({});

  const onToggle = (id: number) => {
    setExpanded((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  return (
    <>
      <section className="review-submission-container">
        <Content component={ContentVariants.h3}>Review</Content>
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

            <div className="contributors-wrapper">
              <Content component={ContentVariants.h5} className="category-titles">
                Contributors
              </Content>
              <Content component={ContentVariants.p}>{skillFormData.name}</Content>
              <Content component={ContentVariants.p}>{skillFormData.email}</Content>
            </div>
          </div>
        </article>

        {/* Skill Information */}
        <article>
          <div className="info-wrapper">
            <Content component={ContentVariants.p} className="submission-titles">
              Skill Information
            </Content>
            <Content component={ContentVariants.p} className="submission-subtitles">
              Brief information about the Skill and the directory path for the QnA and Attribution files.
            </Content>
          </div>

          <Content component={ContentVariants.h5} className="category-titles">
            Submission summary
          </Content>
          <Content component={ContentVariants.p}>{skillFormData.submissionSummary}</Content>

          <Content component={ContentVariants.h5} className="category-titles">
            Directory path
          </Content>
          <Content component={ContentVariants.p}>{skillFormData.filePath}</Content>
        </article>

        {/* Seed Examples */}
        <article>
          <div className="info-wrapper">
            <Content component={ContentVariants.p}>Seed Examples</Content>
            <Content component={ContentVariants.p} className="submission-subtitles">
              Data that will be used to start teaching your model.
            </Content>
          </div>

          {skillFormData.seedExamples?.map((seedExample, index) => (
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
                  <div className="accordion-content">
                    <Content component={ContentVariants.h5} className="seed-category-titles">
                      Question:
                    </Content>{' '}
                    {seedExample.question}
                  </div>
                  <div className="accordion-content">
                    <Content component={ContentVariants.h5} className="seed-category-titles">
                      Answer:
                    </Content>{' '}
                    {seedExample.answer}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ))}
        </article>

        <article className="info-wrapper">
          {/* Attribution Information */}
          {isGithubMode && (
            <div>
              <Content component={ContentVariants.p}>
                <strong>Attribution Information</strong>
              </Content>
              <Content component={ContentVariants.p}>
                <i>Title of Work:</i> {skillFormData.titleWork}
              </Content>
              <Content component={ContentVariants.p}>
                <i>License of Work:</i> {skillFormData.licenseWork}
              </Content>
              <Content component={ContentVariants.p}>
                <i>Creators:</i> {skillFormData.creators}
              </Content>
            </div>
          )}
        </article>
      </section>
    </>
  );
};

export default ReviewSubmission;
