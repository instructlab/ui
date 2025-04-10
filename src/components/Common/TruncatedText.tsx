import React from 'react';
import { Tooltip } from '@patternfly/react-core';

type TruncatedTextProps = {
  maxLines: number;
  content: string;
  tooltipMaxWidth?: string;
  useTooltip?: boolean;
} & Omit<React.HTMLProps<HTMLSpanElement>, 'content'>;

const TruncatedText: React.FC<TruncatedTextProps> = ({ maxLines, content, tooltipMaxWidth, useTooltip = true, ...props }) => {
  const outerElementRef = React.useRef<HTMLElement>(null);
  const textElementRef = React.useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = React.useState<boolean>(false);

  let shownContent = content;
  const splits = content.split('\n');
  if (splits.length > maxLines) {
    shownContent = splits.slice(0, maxLines).join('\n') + '...';
  }

  const updateTruncation = React.useCallback(() => {
    if (textElementRef.current && outerElementRef.current) {
      setIsTruncated(shownContent !== content || textElementRef.current.offsetHeight > outerElementRef.current.offsetHeight);
    }
  }, [content, shownContent]);

  const truncateBody = (
    <span
      {...props}
      style={{
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        overflowWrap: 'anywhere',
        overflow: 'hidden',
        WebkitLineClamp: maxLines,
        ...(props.style || {})
      }}
      ref={outerElementRef}
      onMouseEnter={(e) => {
        props.onMouseEnter?.(e);
        updateTruncation();
      }}
      onFocus={(e) => {
        props.onFocus?.(e);
        updateTruncation();
      }}
    >
      <span ref={textElementRef}>{shownContent}</span>
    </span>
  );

  if (useTooltip) {
    return (
      <Tooltip
        isContentLeftAligned
        hidden={!isTruncated ? true : undefined}
        content={<span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>}
        maxWidth={tooltipMaxWidth}
      >
        {truncateBody}
      </Tooltip>
    );
  }

  return truncateBody;
};

export default TruncatedText;
