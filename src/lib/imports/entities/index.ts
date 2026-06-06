import type { ImportEntityDefinition } from '$lib/imports/types';
import { customerImportDefinition } from './customers';
import { productImportDefinition } from './products';

const definitions: ImportEntityDefinition[] = [customerImportDefinition, productImportDefinition];

export function getImportEntityDefinitions() {
  return definitions;
}
