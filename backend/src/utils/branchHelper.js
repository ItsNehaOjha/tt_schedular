export const normalizeBranch = (branch) => {
  if (!branch || typeof branch !== 'string') return branch;
  const upper = branch.toUpperCase().trim();
  const map = {
    'CSE': 'CSE',
    'CS': 'CS',
    'BT': 'BT',
    'CE': 'CE',
    'IT': 'IT',
    'EC': 'EC',
    'EE': 'EE',
    'ME': 'ME',
    'MBA': 'MBA',
    'MCA': 'MCA'
  };
  return map[upper] || branch;
};
