// src/app/utils/yamlConfig.ts
import yaml from 'js-yaml';

export const YamlLineLength = 80;

export const EmptyStringYamlType = new yaml.Type('!empty', {
  kind: 'scalar',
  resolve: (data: unknown): boolean => data === '' || data === null,
  represent: (): string => '',
  predicate: (object: unknown): boolean => object === '' || object === null
});

export const CustomYamlSchema = yaml.DEFAULT_SCHEMA.extend({ implicit: [EmptyStringYamlType] });

export interface YamlDumpOptions extends yaml.DumpOptions {
  schema: typeof CustomYamlSchema;
  lineWidth: number;
  noQuotes?: boolean;
}

export const defaultYamlDumpOptions: YamlDumpOptions = {
  schema: CustomYamlSchema,
  lineWidth: YamlLineLength,
  noQuotes: true
};

function removeNullValues(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(removeNullValues);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([key, value]) => [key, removeNullValues(value)])
        .filter(([, value]) => value !== null)
    );
  }
  return obj === null ? '' : obj;
}

// If the Context field is empty, omit the key from the output
function filterEmptyContext(data: unknown): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => filterEmptyContext(item));
  } else if (data !== null && typeof data === 'object') {
    const filteredEntries = Object.entries(data)
      .map(([key, value]) => {
        if (key === 'context' && value === '') {
          return null;
        }
        return [key, filterEmptyContext(value)];
      })
      .filter((entry): entry is [string, unknown] => entry !== null);
    return Object.fromEntries(filteredEntries);
  }
  return data;
}

function trimTrailingSpaces(yamlString: string): string {
  const hasTrailingNewline = yamlString.endsWith('\n');
  const lines = yamlString.split('\n');
  const trimmedLines = lines
    .map((line, index) => {
      if (index === lines.length - 1 && line === '' && hasTrailingNewline) {
        return undefined;
      }
      // Preserve empty lines
      if (line.trim() === '') return '';
      // Trim trailing spaces, preserving indentation
      const match = line.match(/^(\s*)(.*)$/);
      if (match) {
        const [, indent, content] = match;
        return indent + content.trimEnd();
      }
      return line;
    })
    .filter((line) => line !== undefined);

  return trimmedLines.join('\n');
}

export function dumpYaml(data: unknown, options: Partial<YamlDumpOptions> = {}): string {
  const mergedOptions: YamlDumpOptions = { ...defaultYamlDumpOptions, ...options };
  const filteredData = filterEmptyContext(data);
  const processedData = removeNullValues(filteredData);
  const yamlString = yaml.dump(processedData, mergedOptions);
  return trimTrailingSpaces(yamlString);
}
