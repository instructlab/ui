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

export function dumpYaml(data: unknown, options: Partial<YamlDumpOptions> = {}): string {
  const mergedOptions: YamlDumpOptions = { ...defaultYamlDumpOptions, ...options };
  const processedData = removeNullValues(data);
  return yaml.dump(processedData, mergedOptions);
}
