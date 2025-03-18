/**
 * @param {string} doctype 
 * @returns {Array} 
 */
export function getHiddenFields(doctype) {
  const commonHiddenFields = [
    'naming_series',
    'amended_from',
    'amendment_date',
    '_user_tags',
    '_comments',
    '_assign',
    '_liked_by',
  ];

  const doctypeHiddenFields = {
    'Issue': [
    ],
 
  };

  return [
    ...commonHiddenFields,
    ...(doctype && doctypeHiddenFields[doctype] ? doctypeHiddenFields[doctype] : [])
  ];
}

export default {
  getHiddenFields
};