// components/PathService.tsx
import React, { useState, useEffect, useRef } from 'react';
import { SearchInput } from '@patternfly/react-core/dist/dynamic/components/SearchInput';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { Popper, PopperProps, ValidatedOptions } from '@patternfly/react-core/dist/dynamic/helpers';
import { FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';

interface PathServiceProps {
  reset?: boolean;
  rootPath: string;
  handlePathChange: (value: string) => void;
}

const PathService: React.FC<PathServiceProps> = ({ reset, rootPath, handlePathChange }) => {
  const [inputValue, setInputValue] = useState<string>('');
  const [items, setItems] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [validPath, setValidPath] = React.useState<ValidatedOptions>();

  const validatePath = () => {
    console.log('validating path' + inputValue);
    if (inputValue.length > 0) {
      setValidPath(ValidatedOptions.success);
      return;
    }
    setValidPath(ValidatedOptions.error);
    return;
  };

  const fetchData = async (subpath: string) => {
    try {
      const response = await fetch('/api/tree', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ root_path: rootPath, dir_name: subpath })
      });

      if (!response.ok) {
        throw new Error('Failed to get tree for subpath ( ' + subpath + ' ) from server.');
      }

      const result = await response.json();
      console.log(result);
      // set items to be displayed in the dropdown
      if (result.data === null || result.data.length === 0) {
        setItems([]);
        return;
      }
      setItems(result.data.map((item: string) => item.valueOf()));
    } catch (error) {
      console.error('Error fetching data:', error);
      setItems([]);
    }
  };

  useEffect(() => {
    const handleEsc = (event: { key: string }) => {
      if (event.key === 'Escape') {
        setShowDropdown(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    setInputValue('');
    setShowDropdown(false);
  }, [reset]);

  useEffect(() => {
    // check if input value is empty or ends with a slash
    if (inputValue.endsWith('/')) {
      fetchData(inputValue);
      setShowDropdown(true);
      handlePathChange(inputValue);
    } else {
      setItems([]);
    }
    if (items.length > 0) {
      validatePath();
    }
  }, [inputValue]);

  const handleChange = (value: string) => {
    console.log('handleChange: ' + value);
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
    console.log('handleSelect: ' + item);
    setShowDropdown(false);
    setInputValue(inputValue + item + '/');
  };

  const handleBlurEvent = () => {
    console.log('handleBlurEvent');
    setShowDropdown(false);
    handlePathChange(inputValue);
    validatePath();
  };

  const popperProps: PopperProps = {
    triggerRef: inputRef,
    popper: (
      <List style={{ border: '1px solid #ccc', backgroundColor: 'white', maxHeight: '20%', overflow: 'auto' }}>
        {items.map((item, index) => (
          <ListItem key={index} onClick={() => handleSelect(item)} style={{ padding: '5px 10px', cursor: 'pointer' }}>
            {item}
          </ListItem>
        ))}
      </List>
    ),
    width: 'trigger',
    preventOverflow: true,
    isVisible: showDropdown,
    onPopperClick: () => handleBlurEvent()
  };

  return (
    <div>
      <SearchInput
        ref={inputRef}
        placeholder="Type to find taxonomy path"
        value={inputValue}
        onChange={(_event, value) => handleChange(value)}
        onFocus={(_event) => handleFocus(_event)}
        onClear={() => setInputValue('')}
        onBlur={() => handlePathChange(inputValue)}
      />
      {validPath === 'error' && (
        <FormHelperText>
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={validPath}>
              Please select a valid file path.
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}

      <Popper {...popperProps} />
    </div>
  );
};

export default PathService;
