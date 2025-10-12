// Canonical keys → display labels. Adjust to your institute timings.
export const TIME_SLOTS = {
  TS1: '09:00-10:00',
  TS2: '10:00-11:00',
  TS3: '11:00-12:00',
  TS4: '12:00-13:00',
  LUNCH: '13:00-14:00',
  TS5: '14:00-15:00',
  TS6: '15:00-16:00',
  TS7: '16:00-17:00'
};

// Utility (optional) to map display string to key for migration
export const slotKeyFromLabel = (label) => {
  const key = Object.entries(TIME_SLOTS).find(([, v]) => v === label)?.[0];
  return key || null;
};
