// src/components/Contribute/Knowledge/ReviewSubmission/ReviewSubmission.tsx
import { KnowledgeFormData } from '@/types';
import { Content, ContentVariants, Accordion, AccordionContent, AccordionItem, AccordionToggle } from '@patternfly/react-core';
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
      <section className="review-submission-container">
        <Content component={ContentVariants.h2}>Review</Content>
        <p>Review the information below and click finish to submit your skill contribution. Use the back button to make changes.</p>
        {/* Author Information */}
        <article>
          <div className="info-wrapper">
            <p className="submission-titles">Contributor Information</p>
            <p className="submission-subtitles">Information required for a Github Developer Certificate of Origin (DCO) sign-off.</p>
          </div>

          <div className="contributors-wrapper">
            <h5 className="category-titles">Contributors</h5>
            <p>{knowledgeFormData.name}</p>
            <p>{knowledgeFormData.email}</p>
          </div>
        </article>

        {/* Knowledge Information */}
        <article>
          <div className="info-wrapper">
            <p className="submission-titles">Knowledge Information</p>
            <p className="submission-subtitles">Brief information about the Knowledge and the directory path for the QnA and Attribution files.</p>
          </div>
          <h5 className="category-titles">Submission summary</h5>
          <p>{knowledgeFormData.submissionSummary}</p>
          <h5 className="category-titles">Domain</h5>
          <p>{knowledgeFormData.domain}</p>
          <h5 className="category-titles">Document Outline</h5>
          <p>{knowledgeFormData.documentOutline}</p>
        </article>

        <article>
          {/* Directory path */}
          <h5 className="category-titles">Directory path</h5>

          <p>{knowledgeFormData.filePath}</p>
        </article>

        {/* Seed Examples */}
        <article>
          <div className="info-wrapper">
            <p>Seed Examples</p>
            <p className="submission-subtitles">Data that will be used to start teaching your model.</p>
          </div>

          {knowledgeFormData.seedExamples?.map((seedExample, index) => (
            <Accordion asDefinitionList={false} className="accordion-wrapper" key={`seed-${index}`}>
              <AccordionItem isExpanded={!!expanded[index]} key={`accordion-item-${index}`}>
                <AccordionToggle onClick={() => onToggle(index)} id={`seed-example-toggle-${index}`} className="accordion-toggle-item">
                  Sample {index + 1}
                </AccordionToggle>
                <AccordionContent id={`seed-example-content-${index}`}>
                  <div className="accordion-content">
                    <h5 className="seed-category-titles">Context:</h5> {seedExample.context}
                  </div>
                  {seedExample.questionAndAnswers.map((qa, qaIndex) => (
                    <React.Fragment key={`qa-${index}-${qaIndex}`}>
                      <div className="accordion-content">
                        <h5 className="seed-category-titles">Question:</h5> {qa.question}
                      </div>
                      <div className="accordion-content">
                        <h5 className="seed-category-titles">Answer:</h5> {qa.answer}
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
          <h5 className="category-titles">Document Information</h5>
          <h5 className="category-titles">Repository URL</h5>
          <p>{knowledgeFormData.knowledgeDocumentRepositoryUrl}</p>
          <h5 className="category-titles">Commit</h5>
          <p>{knowledgeFormData.knowledgeDocumentCommit}</p>
          <h5 className="category-titles">Name</h5>
          <p>{knowledgeFormData.documentName}</p>
        </article>

        <article className="info-wrapper">
          {/* Attribution Information */}
          {isGithubMode && (
            <div>
              <p>
                <strong>Attribution Information</strong>
              </p>
              <p>
                <i>Title of Work:</i> {knowledgeFormData.titleWork}
              </p>
              <p>
                <i>Link to Work:</i> {knowledgeFormData.linkWork}
              </p>
              <p>
                <i>Revision:</i> {knowledgeFormData.revision}
              </p>
              <p>
                <i>License of Work:</i> {knowledgeFormData.licenseWork}
              </p>
              <p>
                <i>Creators:</i> {knowledgeFormData.creators}
              </p>
            </div>
          )}
        </article>
      </section>
    </>
  );
};

export default ReviewSubmission;
