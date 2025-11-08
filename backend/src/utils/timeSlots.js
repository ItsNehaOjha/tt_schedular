// Canonical keys → display labels. Adjust to your institute timings.
export const TIME_SLOTS = {
  TS1: '08:50-09:40',
  TS2: '09:40-10:30',
  TS3: '10:30-11:20',
  TS4: '11:20-12:10',
  LUNCH: '12:10-13:00',
  TS5: '13:00-13:50',
  TS6: '13:50-14:40',
  TS7: '14:40-15:30',
  TS8: '15:30-16:20',
  TS9: '16:20-17:10',
  
};

// Utility (optional) to map display string to key for migration
export const slotKeyFromLabel = (label) => {
  const key = Object.entries(TIME_SLOTS).find(([, v]) => v === label)?.[0];
  return key || null;
};
