// /src/components/PathService.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  ValidatedOptions,
  PopperProps,
  List,
  ListItem,
  SearchInput,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Popper
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { t_global_background_color_100 as BackgroundColor } from '@patternfly/react-tokens';

interface PathServiceProps {
  fieldId?: string;
  rootPath: string;
  path?: string;
  handlePathChange: (value: string) => void;
  helperText: string;
}

const PathService: React.FC<PathServiceProps> = ({ fieldId, rootPath, path, handlePathChange, helperText }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [items, setItems] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [validPath, setValidPath] = React.useState<ValidatedOptions>();
  const touchedRef = React.useRef<boolean>();

  const fetchData = React.useCallback(
    async (subpath: string) => {
      try {
        const response = await fetch('/api/tree', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ root_path: rootPath, dir_name: subpath })
        });

        if (!response.ok) {
          console.warn('Failed to get path service tree for subpath ( ' + subpath + ' ) from server.');
        }

        const result = await response.json();
        // set items to be displayed in the dropdown
        if (!result.data?.length) {
          setItems([]);
          return;
        }
        setItems(result.data.map((item: string) => item.valueOf()));
      } catch (error) {
        console.warn('Error fetching path service data:', error);
        setItems([]);
      }
    },
    [rootPath]
  );

  useEffect(() => {
    if (path) {
      setInputValue(path);
      setValidPath(ValidatedOptions.success);
    }
    const handleEsc = (event: { key: string }) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };

    window.addEventListener('keydown', handleEsc);

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [path]);

  useEffect(() => {
    // check if input value is empty or ends with a slash
    if (inputValue.endsWith('/')) {
      fetchData(inputValue);
      setShowDropdown(true);
      handlePathChange(inputValue);
    } else {
      setItems([]);
    }
    if (!touchedRef.current || inputValue.trim().length > 0) {
      setValidPath(ValidatedOptions.success);
      return;
    }
    setValidPath(ValidatedOptions.error);
  }, [fetchData, handlePathChange, inputValue]);

  const handleChange = (value: string) => {
    touchedRef.current = true;
    setInputValue(value);
  };

  const handleFocus = (event: React.FocusEvent<HTMLDivElement, Element>) => {
    setShowDropdown(true);
    setInputValue((event.target as HTMLInputElement).value);
    // check if input value is empty
    if ((event.target as HTMLInputElement).value === '') {
      fetchData('');
    }
  };

  const handleSelect = (item: string) => {
    setShowDropdown(false);
    setInputValue(inputValue + item + '/');
  };

  const handleBlurEvent = () => {
    setShowDropdown(false);
    handlePathChange(inputValue);
  };

  const popperProps: PopperProps = {
    triggerRef: inputRef,
    popper: (
      <List style={{ border: '1px solid #ccc', maxHeight: '20%', overflow: 'auto', background: BackgroundColor.var }}>
        {items.map((item, index) => (
          <ListItem key={index} onClick={() => handleSelect(item)} style={{ padding: '5px 10px', cursor: 'pointer' }}>
            {item}
          </ListItem>
        ))}
      </List>
    ),
    width: 'trigger',
    preventOverflow: true,
    isVisible: showDropdown && !!items.length,
    onPopperClick: () => handleBlurEvent()
  };

  return (
    <div>
      <SearchInput
        id={fieldId}
        ref={inputRef}
        placeholder="Select directory"
        value={inputValue}
        onChange={(_event, value) => handleChange(value)}
        onFocus={(_event) => handleFocus(_event)}
        onClear={() => setInputValue('')}
        onBlur={() => handlePathChange(inputValue)}
      />
      {validPath === 'error' ? (
        <FormHelperText>
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={validPath}>
              Required field and must be a valid file path.
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      ) : helperText ? (
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant="default">{helperText}</HelperTextItem>
          </HelperText>
        </FormHelperText>
      ) : null}

      <Popper {...popperProps} />
    </div>
  );
};

export default PathService;
