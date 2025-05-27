// /src/components/PathService.tsx
import React from 'react';
import {
  TreeViewDataItem,
  Select,
  MenuToggleElement,
  MenuToggle,
  TreeView,
  Flex,
  FlexItem,
  Button,
  FormHelperText,
  HelperText,
  HelperTextItem,
  ValidatedOptions,
  SearchInput,
  Truncate
} from '@patternfly/react-core';
import { CheckIcon, ExclamationCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import {
  t_global_color_brand_default as DefaultBrandColor,
  t_global_icon_color_status_success_default as SuccessIconColor,
  t_global_spacer_xl as XlSpacer
} from '@patternfly/react-tokens';
import AddDirectoryModal from '@/components/PathService/AddDirectoryModal';

import './PathService.css';

interface PathItem {
  name: string;
  fullPath: string;
  children: PathItem[];
  childrenFetched: boolean;
  isNew?: boolean;
}

const getPathItem = (pathItems: PathItem[], fullPath: string): PathItem | undefined => {
  let foundItem: PathItem | undefined = undefined;

  for (let i = 0; i < pathItems.length && !foundItem; i++) {
    if (pathItems[i].fullPath === fullPath) {
      foundItem = pathItems[i];
      continue;
    }
    foundItem = getPathItem(pathItems[i].children, fullPath);
  }
  return foundItem;
};

const getNearestParent = (pathItems: PathItem[], fullPath: string): PathItem | undefined => {
  let foundItem: PathItem | undefined = undefined;

  for (let i = 0; i < pathItems.length && !foundItem; i++) {
    if (pathItems[i].fullPath === fullPath) {
      foundItem = pathItems[i];
      continue;
    }
    if (fullPath.startsWith(`${pathItems[i].fullPath}/`)) {
      return getNearestParent(pathItems[i].children, fullPath) || pathItems[i];
    }
  }
  return foundItem;
};

interface PathServiceProps {
  fieldId?: string;
  rootPath: string;
  path?: string;
  handlePathChange: (value: string) => void;
  helperText: string;
}

const PathService: React.FC<PathServiceProps> = ({ fieldId, rootPath, path, handlePathChange, helperText }) => {
  const [topLevelItems, setTopLevelItems] = React.useState<PathItem[]>([]);
  const [treeData, setTreeData] = React.useState<PathItem[]>([]);
  const [addDirectoryPath, setAddDirectoryPath] = React.useState<PathItem | undefined | null>(null);
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState<string>('');
  const toggleWidthRef = React.useRef<number | undefined>();
  const selectedItemRef = React.useRef<HTMLSpanElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const [touched, setTouched] = React.useState<boolean>();

  const fetchChildren = React.useCallback(
    async (subpath: string = ''): Promise<PathItem[]> => {
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
          return [];
        }
        return result.data.map((item: string) => ({
          name: item,
          fullPath: subpath ? `${subpath}/${item}` : item,
          children: []
        }));
      } catch (error) {
        console.warn('Error fetching path service data:', error);
        return [];
      }
    },
    [rootPath]
  );

  React.useEffect(() => {
    fetchChildren('').then(setTopLevelItems);
  }, [fetchChildren]);

  React.useEffect(() => {
    const fetchExpandedItems = async (items: PathItem[]) => {
      if (!items.length) {
        return;
      }
      for (const item of items) {
        if (!item.childrenFetched && path && path.startsWith(`${item.fullPath}/`)) {
          item.children = await fetchChildren(item.fullPath);
          item.childrenFetched = true;
          await fetchExpandedItems(item.children);
        }
      }
    };

    const fetchInitialData = async () => {
      const items = [...topLevelItems];
      for (const item of items) {
        if (!item.childrenFetched) {
          item.children = await fetchChildren(item.fullPath);
          item.childrenFetched = true;
        }
      }
      if (path) {
        fetchExpandedItems(items);
        const parentItem = getNearestParent(items, path);
        if (parentItem?.fullPath !== path) {
          const newPathItem = {
            fullPath: path,
            name: path.replace(parentItem ? `${parentItem.fullPath}/` : '', ''),
            children: [],
            childrenFetched: true,
            isNew: true
          };
          if (parentItem) {
            parentItem.children.push(newPathItem);
          } else {
            items.push(newPathItem);
          }
        }
      }
      setTreeData(items);
    };

    fetchInitialData();
  }, [fetchChildren, topLevelItems, path]);

  const fetchAllDescendants = async (item: PathItem): Promise<void> => {
    if (!item.childrenFetched) {
      item.children = await fetchChildren(item.fullPath);
      item.childrenFetched = true;
    }
    for (const child of item.children) {
      await fetchAllDescendants(child);
    }
  };

  const handleSelect = React.useCallback(
    (item: PathItem) => {
      setIsSelectOpen(false);
      handlePathChange(item.fullPath);
    },
    [handlePathChange]
  );

  const handleExpand = async (path?: string) => {
    if (!path) {
      return;
    }

    const treeItem = getPathItem(treeData, path);
    if (!treeItem || treeItem.children.length) {
      return;
    }

    treeItem.children = await fetchChildren(path);
    treeItem.childrenFetched = true;

    setTreeData([...treeData]);
  };

  const treeDataItems = React.useMemo(() => {
    const doesItemMatch = (treeItem: PathItem): boolean => !searchValue || treeItem.name.toLowerCase().includes(searchValue.toLowerCase());

    const isItemVisible = (treeItem: PathItem): boolean => {
      if (doesItemMatch(treeItem)) {
        return true;
      }
      if (treeItem.children) {
        const visibleChild = treeItem.children.find((child) => isItemVisible(child));
        if (visibleChild) {
          return true;
        }
      }
      return false;
    };

    const toTreeDataItem = (treeItem: PathItem): TreeViewDataItem => {
      const children: PathItem[] = treeItem.children.filter((item) => isItemVisible(item));

      return {
        id: treeItem.fullPath,
        name: (
          <Flex
            id={treeItem.fullPath}
            onClick={() => handleSelect(treeItem)}
            key={treeItem.name}
            justifyContent={{ default: 'justifyContentSpaceBetween' }}
            gap={{ default: 'gapMd' }}
            flexWrap={{ default: 'nowrap' }}
          >
            <FlexItem style={treeItem.isNew ? { color: DefaultBrandColor.var } : undefined}>{treeItem.name}</FlexItem>
            <FlexItem>
              {treeItem.fullPath === path ? (
                <span ref={selectedItemRef}>
                  <CheckIcon style={{ color: SuccessIconColor.var }} />
                </span>
              ) : null}
            </FlexItem>
          </Flex>
        ),
        defaultExpanded: !!searchValue || (!!path && path.startsWith(`${treeItem.fullPath}/`)),
        children: [
          ...children.filter((child) => isItemVisible(child)).map(toTreeDataItem),
          {
            id: `${treeItem.fullPath}-new-folder`,
            name: (
              <Button
                variant="link"
                component="a"
                isInline
                icon={<PlusCircleIcon />}
                style={{ marginLeft: `calc(-1 * ${XlSpacer.var}` }}
                onClick={() => setAddDirectoryPath(treeItem)}
              >
                Add new
              </Button>
            )
          }
        ]
      };
    };

    const topLevelItems = treeData.filter((item) => isItemVisible(item));

    return [
      ...topLevelItems.map(toTreeDataItem),
      {
        id: 'root-new-folder',
        name: (
          <Button
            variant="link"
            isInline
            component="a"
            icon={<PlusCircleIcon />}
            style={{ marginLeft: `calc(-1 * ${XlSpacer.var}` }}
            onClick={() => setAddDirectoryPath(undefined)}
          >
            Add new
          </Button>
        )
      }
    ];
  }, [handleSelect, path, searchValue, treeData]);

  React.useEffect(() => {
    if (isSelectOpen) {
      searchRef.current && searchRef.current.focus();
      selectedItemRef.current?.scrollIntoView();
    } else {
      setSearchValue('');
    }
  }, [isSelectOpen]);

  const handleNewDirectory = (newDirectory: string) => {
    const fullPath = `${addDirectoryPath?.fullPath ?? ''}/${newDirectory}`;

    const newPathItem = {
      fullPath,
      name: newDirectory,
      children: [],
      childrenFetched: true,
      isNew: true
    };

    if (addDirectoryPath) {
      addDirectoryPath.children.push(newPathItem);
    }
    setTreeData([...treeData, ...(!addDirectoryPath ? [newPathItem] : [])]);

    handlePathChange(fullPath);

    // Make the new item visible
    requestAnimationFrame(() => {
      selectedItemRef.current?.scrollIntoView();
    });
  };

  const handleNewSearchValue = async (newValue: string) => {
    if (!searchValue && newValue) {
      // Now we need to fetch all the data
      for (const item of treeData) {
        await fetchAllDescendants(item);
      }
    }
    setSearchValue(newValue);
  };

  if (!treeDataItems.length) {
    return null;
  }

  const toggle = (toggleRef: React.RefObject<MenuToggleElement>) => {
    toggleWidthRef.current = toggleRef.current?.clientWidth;
    return (
      <MenuToggle
        onClick={() => setIsSelectOpen(!isSelectOpen)}
        isExpanded={isSelectOpen && addDirectoryPath === null}
        style={{ width: '100%' }}
        ref={toggleRef}
      >
        {path ? <Truncate content={path} position="middle" /> : 'Select directory'}
      </MenuToggle>
    );
  };

  return (
    <>
      <Select
        id={fieldId}
        toggle={toggle}
        isOpen={isSelectOpen && addDirectoryPath === null}
        selected={path}
        onOpenChange={(isOpen) => {
          setIsSelectOpen(isOpen);
          setTouched(true);
        }}
        shouldFocusToggleOnSelect
        popperProps={{ direction: 'up', width: 'trigger' }}
      >
        <div>
          <TreeView className="path-service-tree" data={treeDataItems} hasGuides onExpand={(_ev, item) => handleExpand(item.id)} />
          <SearchInput
            ref={searchRef}
            placeholder="Search"
            value={searchValue}
            onChange={(_ev, value) => handleNewSearchValue(value)}
            onClear={(e) => {
              e.stopPropagation();
              setSearchValue('');
            }}
          />
        </div>
      </Select>
      <FormHelperText>
        <HelperText>
          <HelperTextItem
            icon={!path && touched ? <ExclamationCircleIcon /> : undefined}
            variant={!path && touched ? ValidatedOptions.error : ValidatedOptions.default}
          >
            {!path && touched ? 'Required field' : helperText}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
      {addDirectoryPath !== null ? (
        <AddDirectoryModal
          parentPath={addDirectoryPath?.fullPath || ''}
          onClose={(newDirectory) => {
            if (newDirectory) {
              handleNewDirectory(newDirectory);
            }
            setAddDirectoryPath(null);
          }}
        />
      ) : null}
    </>
  );
};

export default PathService;
