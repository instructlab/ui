// src/components/Contribute/Knowledge/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React from 'react';
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Form,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Icon,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ValidatedOptions
} from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon, AngleUpIcon, CaretDownIcon, EllipsisVIcon, ExclamationCircleIcon } from '@patternfly/react-icons';
import {
  t_global_background_color_primary_default as BackgroundColor,
  t_global_color_status_danger_default as RequiredColor,
  t_global_font_size_body_sm as RequiredFontSize,
  t_global_spacer_md as MdSpacerSize
} from '@patternfly/react-tokens';
import type { KnowledgeFile, KnowledgeSeedExample } from '@/types';
import { QuestionAndAnswerPair } from '@/types';
import TruncatedText from '@/components/Common/TruncatedText';
import KnowledgeFileSelectModal from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeFileSelectModal';
import { createEmptyKnowledgeSeedExample, MAX_CONTRIBUTION_Q_AND_A_WORDS, validateContext } from '@/components/Contribute/Utils/seedExampleUtils';
import { getSeedExampleTitle } from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/utils';
import './KnowledgeSeedExamples.scss';
import KnowledgeQuestionAnswerPair from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeQuestionAnswerPair';
import { getWordCount } from '@/components/Contribute/Utils/contributionUtils';

const useForceUpdate = () => {
  const [, setValue] = React.useState(0);
  return () => setValue((value) => value + 1);
};

const getScrollParent = (node: HTMLElement | null): HTMLElement | null => {
  if (node == null) {
    return null;
  }

  if (node.scrollHeight > node.clientHeight) {
    return node;
  }

  return getScrollParent(node.parentElement);
};

interface Props {
  isGithubMode: boolean;
  knowledgeFiles: KnowledgeFile[];
  seedExampleIndex: number;
  seedExample: KnowledgeSeedExample;
  onUpdateSeedExample: (updated: KnowledgeSeedExample) => void;
  onDeleteSeedExample: () => void;
  handleQuestionBlur: (index: number) => void;
  handleAnswerBlur: (index: number) => void;
  bodyRef?: HTMLElement | null;
}

const KnowledgeSeedExampleCard: React.FC<Props> = ({
  knowledgeFiles,
  seedExampleIndex,
  seedExample,
  onUpdateSeedExample,
  onDeleteSeedExample,
  handleQuestionBlur,
  handleAnswerBlur,
  bodyRef
}) => {
  const forceUpdate = useForceUpdate();
  const [scrollable, setScrollable] = React.useState<HTMLElement | null>();
  const [amISticky, setSticky] = React.useState<boolean>();
  const [showMore, setShowMore] = React.useState<boolean>(false);
  const [fileSelectOpen, setFileSelectOpen] = React.useState<boolean>(false);
  const [actionsOpen, setActionsOpen] = React.useState<boolean>(false);
  const [showClearConfirmation, setShowClearConfirmation] = React.useState<boolean>(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = React.useState<boolean>(false);
  const [selectContextFile, setSelectContextFile] = React.useState<KnowledgeFile | undefined>(undefined);
  const isEmpty =
    !seedExample.context?.trim().length && seedExample.questionAndAnswers.every((e) => !e.answer?.trim().length && !e.question?.trim().length);
  const topRef = React.useRef<HTMLElement | null>();
  const [headerRef, setHeaderRef] = React.useState<HTMLElement | null>();
  const [anchorRef, setAnchorRef] = React.useState<HTMLElement | null>();
  const [bottomRef, setBottomRef] = React.useState<HTMLElement | null>();
  const [anchorPosition, setAnchorPosition] = React.useState<number>(0);
  const stickyHeader = amISticky && seedExample.isExpanded;
  const areAllQuestionAnswerPairsValid = seedExample.questionAndAnswers.every(
    (pair) => pair.isQuestionValid !== ValidatedOptions.error && pair.isAnswerValid !== ValidatedOptions.error
  );

  const onSetTopRef = (ref: HTMLElement | null) => {
    if (ref) {
      setScrollable(getScrollParent(ref));
      topRef.current = ref;
    }
  };

  React.useEffect(() => {
    const onScroll = () => {
      if (scrollable) {
        const scrolledTo: number = scrollable.scrollTop;
        const cardTop: number = topRef?.current?.offsetTop ?? 0;
        const cardBottom: number = bottomRef?.offsetTop ?? 0;
        const sticky = cardTop < scrolledTo && cardBottom > scrolledTo;

        setSticky(sticky);

        const topParent = topRef?.current?.parentElement;
        if (sticky && anchorRef && topParent) {
          let anchorTop = anchorRef.offsetTop;
          let parent = anchorRef.parentElement?.parentElement;

          while (parent && parent !== topParent) {
            anchorTop += parent.offsetTop;
            parent = parent.parentElement;
          }
          const anchorPos = anchorRef.offsetHeight + anchorTop - cardTop - (headerRef?.offsetHeight ?? 0);

          setAnchorPosition(anchorPos - scrolledTo);
        }
      }
    };

    if (scrollable) {
      scrollable.addEventListener('scroll', onScroll);
    }

    return () => {
      if (scrollable) {
        scrollable.removeEventListener('scroll', onScroll);
        setSticky(false);
      }
    };
  }, [scrollable, seedExampleIndex, bottomRef, headerRef, anchorRef]);

  const wordCount = seedExample.questionAndAnswers.reduce<number>((acc, next) => acc + getWordCount(next.question) + getWordCount(next.answer), 0);

  const handleContextSelection = (contextValue: string): void => {
    const { msg, status } = validateContext(contextValue);
    onUpdateSeedExample({
      ...seedExample,
      context: contextValue,
      knowledgeFile: selectContextFile,
      isContextValid: status,
      validationError: msg
    });
    setSelectContextFile(undefined);
  };

  const handleQuestionInputChange = (questionAndAnswerIndex: number, questionValue: string): void => {
    onUpdateSeedExample({
      ...seedExample,
      questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) =>
        qaIndex === questionAndAnswerIndex
          ? {
              ...questionAndAnswerPair,
              question: questionValue
            }
          : questionAndAnswerPair
      )
    });
  };

  const handleAnswerInputChange = (questionAndAnswerIndex: number, answerValue: string): void => {
    onUpdateSeedExample({
      ...seedExample,
      questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) =>
        qaIndex === questionAndAnswerIndex
          ? {
              ...questionAndAnswerPair,
              answer: answerValue
            }
          : questionAndAnswerPair
      )
    });
  };

  const toggleSeedExampleExpansion = (): void => {
    onUpdateSeedExample({ ...seedExample, isExpanded: !seedExample.isExpanded });
  };

  const toggleHeaderMoreLess = (): void => {
    setShowMore((prev) => !prev);
    requestAnimationFrame(forceUpdate);
  };

  const onFileSelect = (_ev?: React.MouseEvent, value?: number | string) => {
    setFileSelectOpen(false);
    if (value === undefined) {
      return;
    }
    const fileIndex = Number.parseInt(`${value}`);
    setSelectContextFile(knowledgeFiles[fileIndex]);
  };

  const onEdit = () => {
    setActionsOpen(false);
    setSelectContextFile(seedExample.knowledgeFile);
  };

  const clearSeedExample = () => {
    onUpdateSeedExample(createEmptyKnowledgeSeedExample());
    setShowClearConfirmation(false);
  };

  const onClear = () => {
    setActionsOpen(false);
    setShowClearConfirmation(true);
  };

  const onDelete = () => {
    setActionsOpen(false);
    if (isEmpty) {
      onDeleteSeedExample();
      return;
    }
    setShowDeleteConfirmation(true);
  };

  const actions = (
    <>
      {!seedExample.context?.trim().length || !seedExample.knowledgeFile ? (
        <Dropdown
          isOpen={fileSelectOpen}
          onSelect={onFileSelect}
          onOpenChange={(isOpen: boolean) => setFileSelectOpen(isOpen)}
          toggle={(toggleRef: React.Ref<HTMLButtonElement>) => (
            <Button
              ref={toggleRef}
              variant="secondary"
              icon={<CaretDownIcon />}
              iconPosition="end"
              onClick={() => setFileSelectOpen((prev) => !prev)}
              isDisabled={!knowledgeFiles?.length}
            >
              Select file
            </Button>
          )}
          popperProps={{ position: 'right' }}
        >
          <DropdownList>
            {knowledgeFiles.map((file, index) => (
              <DropdownItem value={index} key={file.filename}>
                {file.filename}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      ) : null}
      {!seedExample.immutable || seedExample.context?.trim().length ? (
        <Dropdown
          isOpen={actionsOpen}
          onOpenChange={(isOpen: boolean) => setActionsOpen(isOpen)}
          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
            <MenuToggle
              ref={toggleRef}
              aria-label="more actions"
              variant="plain"
              onClick={() => setActionsOpen((prev) => !prev)}
              isExpanded={actionsOpen}
              icon={<EllipsisVIcon />}
            />
          )}
          popperProps={{ position: 'right' }}
        >
          <DropdownList>
            {seedExample.knowledgeFile ? (
              <>
                <DropdownItem isDisabled={!seedExample.context?.trim().length} onClick={onEdit}>
                  Edit context
                </DropdownItem>
                <Divider component="li" key="separator" />
              </>
            ) : null}
            <DropdownItem isDisabled={isEmpty} onClick={onClear}>
              Clear seed example
            </DropdownItem>
            {!seedExample.immutable ? <DropdownItem onClick={onDelete}>Remove seed example</DropdownItem> : null}
          </DropdownList>
        </Dropdown>
      ) : null}
    </>
  );

  return (
    <>
      <div
        style={{
          marginBottom: MdSpacerSize.var,
          paddingTop: stickyHeader ? (headerRef?.offsetHeight ?? 0) : 0
        }}
        ref={onSetTopRef}
      >
        {stickyHeader && bodyRef ? (
          // Add a background to hide the border of the Q and A card
          <div
            style={{
              position: 'absolute',
              top: Math.min(0, anchorPosition),
              left: bodyRef.offsetLeft - 2,
              width: bodyRef.offsetWidth + 4,
              height: MdSpacerSize.var,
              backgroundColor: BackgroundColor.var,
              zIndex: 999
            }}
          />
        ) : null}
        <Card
          ref={setHeaderRef}
          style={{
            borderBottomLeftRadius: seedExample.isExpanded ? 0 : undefined,
            borderBottomRightRadius: seedExample.isExpanded ? 0 : undefined,
            position: stickyHeader ? 'absolute' : undefined,
            zIndex: stickyHeader ? 999 : undefined,
            top: Math.min(0, anchorPosition),
            left: stickyHeader && bodyRef ? bodyRef.offsetLeft : undefined,
            width: stickyHeader && bodyRef ? bodyRef.offsetWidth : undefined
          }}
        >
          <CardHeader actions={{ actions }}>
            <CardTitle>
              <Flex gap={{ default: 'gapMd' }}>
                <FlexItem>
                  <Button
                    variant="link"
                    isInline
                    onClick={toggleSeedExampleExpansion}
                    aria-label={`Expand seed example ${seedExampleIndex + 1}`}
                    icon={<Icon>{seedExample.isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}</Icon>}
                  />
                </FlexItem>
                <FlexItem>
                  <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsFlexStart' }} flexWrap={{ default: 'nowrap' }}>
                    <FlexItem>
                      <Content component="h4">{getSeedExampleTitle(seedExample, seedExampleIndex)}</Content>
                    </FlexItem>
                    <FlexItem style={{ color: RequiredColor.var, fontSize: RequiredFontSize.var }}>*</FlexItem>
                  </Flex>
                </FlexItem>
              </Flex>
            </CardTitle>
          </CardHeader>
          <CardBody>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                {seedExample.isExpanded ? (
                  seedExample.context?.trim().length ? (
                    <>
                      {showMore ? (
                        <Content style={{ whiteSpace: 'pre-wrap', maxHeight: 225, overflowY: 'auto' }}>{seedExample.context}</Content>
                      ) : (
                        <TruncatedText maxLines={1} content={seedExample.context} useTooltip={false} />
                      )}
                    </>
                  ) : (
                    <Content>Select content from the selected context file</Content>
                  )
                ) : seedExample.context?.trim().length ? (
                  <TruncatedText maxLines={1} content={seedExample.context} useTooltip={false} />
                ) : (
                  <Content>Select content from the selected context file</Content>
                )}
              </FlexItem>
              {seedExample.isExpanded && seedExample.context?.trim().length ? (
                <FlexItem>
                  <Button
                    variant="link"
                    isInline
                    onClick={toggleHeaderMoreLess}
                    icon={showMore ? <AngleUpIcon /> : <AngleRightIcon />}
                    iconPosition="left"
                  >
                    {showMore ? 'Show less' : 'Show more'}
                  </Button>
                </FlexItem>
              ) : null}
              {!seedExample.isExpanded ? (
                <>
                  {wordCount > MAX_CONTRIBUTION_Q_AND_A_WORDS ? (
                    <FormHelperText>
                      <HelperText className="q-and-a-field__text-help">
                        <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.warning}>
                          {`${wordCount}/${MAX_CONTRIBUTION_Q_AND_A_WORDS} words total (${wordCount - MAX_CONTRIBUTION_Q_AND_A_WORDS} over the recommended limit)`}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  ) : !areAllQuestionAnswerPairsValid ? (
                    <FormHelperText>
                      <HelperText className="q-and-a-field__text-help">
                        <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                          3 question-and-answer pairs are required for each seed example
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  ) : null}
                </>
              ) : null}
            </Flex>
          </CardBody>
          {seedExample.isExpanded ? (
            <div className="knowledge-seed-example-card__expanded-alert">
              {areAllQuestionAnswerPairsValid ? (
                wordCount > 0 ? (
                  <Alert
                    title={`${wordCount}/${MAX_CONTRIBUTION_Q_AND_A_WORDS} words total${wordCount > MAX_CONTRIBUTION_Q_AND_A_WORDS ? ` (${wordCount - MAX_CONTRIBUTION_Q_AND_A_WORDS} over the recommended limit)` : ''}`}
                    isPlain
                    isInline
                    variant={wordCount > MAX_CONTRIBUTION_Q_AND_A_WORDS ? 'warning' : 'info'}
                  />
                ) : (
                  <Alert
                    title={`The recommended combined word count of each seed example's question-and-answer pairs is ${MAX_CONTRIBUTION_Q_AND_A_WORDS} words or less.`}
                    isPlain
                    isInline
                    variant="info"
                  />
                )
              ) : (
                <Alert title={`3 question-and-answer pairs are required for each seed example`} isPlain isInline variant="danger" />
              )}
            </div>
          ) : null}
          {selectContextFile ? (
            <KnowledgeFileSelectModal
              initialSelection={seedExample.context}
              knowledgeFile={selectContextFile}
              handleContextInputChange={handleContextSelection}
              handleCloseModal={() => setSelectContextFile(undefined)}
            />
          ) : null}
          {(showClearConfirmation || showDeleteConfirmation) && (
            <Modal
              isOpen
              variant="small"
              aria-labelledby="clear-warning-title"
              aria-describedby="clear-warning-message"
              onClose={() => (showClearConfirmation ? setShowClearConfirmation(false) : setShowDeleteConfirmation(false))}
            >
              <ModalHeader
                title={
                  <span>
                    {showClearConfirmation ? 'Clear' : 'Remove'} <strong>{getSeedExampleTitle(seedExample, seedExampleIndex)}</strong>?
                  </span>
                }
                labelId="clear-warning-title"
                titleIconVariant={showClearConfirmation ? 'warning' : 'danger'}
              />
              <ModalBody id="clear-warning-message">The context selection and it’s 3 associated question-and-answer pairs will be lost.</ModalBody>
              <ModalFooter>
                <Button
                  variant={showClearConfirmation ? 'primary' : 'danger'}
                  onClick={() => (showClearConfirmation ? clearSeedExample() : onDeleteSeedExample())}
                >
                  {showClearConfirmation ? 'Clear' : 'Remove'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => (showClearConfirmation ? setShowClearConfirmation(false) : setShowDeleteConfirmation(false))}
                >
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>
          )}
        </Card>
        {seedExample.isExpanded ? (
          <Card className="knowledge-seed-example-card__q-and-a">
            <CardBody>
              <Form>
                {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex: number) => (
                  <KnowledgeQuestionAnswerPair
                    key={`q-n-a-pair-${questionAnswerIndex}`}
                    questionAndAnswerPair={questionAndAnswerPair}
                    index={questionAnswerIndex}
                    seedExampleIndex={seedExampleIndex}
                    handleQuestionInputChange={handleQuestionInputChange}
                    handleQuestionBlur={handleQuestionBlur}
                    handleAnswerInputChange={handleAnswerInputChange}
                    handleAnswerBlur={handleAnswerBlur}
                    setAnchorRef={questionAnswerIndex === seedExample.questionAndAnswers.length - 1 ? setAnchorRef : undefined}
                  />
                ))}
              </Form>
            </CardBody>
          </Card>
        ) : null}
      </div>
      <span ref={setBottomRef} style={{ visibility: 'hidden', height: 0 }}>
        {' '}
      </span>
    </>
  );
};

export default KnowledgeSeedExampleCard;
