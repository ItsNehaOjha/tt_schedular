// frontend/src/utils/timeUtils.js

export const parseTime = (timeStr) => {
  const cleanTime = timeStr.replace(/\s*(AM|PM)\s*/i, '');
  const [hours, minutes] = cleanTime.split(':').map(Number);
  const isPM = /PM/i.test(timeStr);
  const isAM = /AM/i.test(timeStr);

  let adjustedHours = hours;
  if (isPM && hours !== 12) adjustedHours = hours + 12;
  else if (isAM && hours === 12) adjustedHours = 0;

  return adjustedHours * 60 + minutes;
};

export const minutesToTime = (minutes) => {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  let hours12 = hours24 % 12;
  if (hours12 === 0) hours12 = 12;
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  return `${hours12}:${mins.toString().padStart(2, '0')} ${ampm}`;
};

export const parseTimeSlot = (slot) => {
  const [start, end] = slot.split('-');
  return {
    start: parseTime(start),
    end: parseTime(end),
    duration: parseTime(end) - parseTime(start)
  };
};

export const createTimeSlot = (startMinutes, endMinutes) => 
  `${minutesToTime(startMinutes)}-${minutesToTime(endMinutes)}`;

export const convertTo24Hour = (time12h) => {
  if (!time12h) return '';
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  if (hours === '12') hours = '00';
  if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

export const convertTo12Hour = (time24h) => {
  if (!time24h) return '';
  const [hours, minutes] = time24h.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};
