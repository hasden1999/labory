/**
 * @lab-manager/forms
 * Data-driven form definitions and generic renderer
 */

export const MODULE_NAME = 'forms';

// Types & Renderers
export * from './renderer/types';
export * from './renderer/FormInput';
export * from './renderer/GenericFormRenderer';

// Form Schemas (Pure JSON Data)
import urineSchema from '../definitions/urine.json';
import stoolSchema from '../definitions/stool.json';
import cbcSchema from '../definitions/cbc.json';

export { urineSchema, stoolSchema, cbcSchema };
