import store from './store.js';

export function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export function formatMinutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Computes live operational status for Kannu ki Chai based on:
 * - Current server time (or passed date for simulation)
 * - Auto schedule timings (morning and evening shifts)
 * - Manual overrides from shopkeeper
 */
export function computeLiveStatus(now = new Date()) {
  const state = store.getState();
  const { settings, status } = state;
  const { shifts } = settings;

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();
  const currentDay = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

  // Check manual override expiration (e.g., "Back in 15 mins")
  if (status.manualOverrideExpiresAt) {
    const expiresAt = new Date(status.manualOverrideExpiresAt);
    if (now >= expiresAt) {
      // Override expired, automatically revert to auto
      store.updateStatus({
        mode: 'auto',
        manualOverrideExpiresAt: null
      }, 'Auto Engine (Timer Expired)');
      return computeLiveStatus(now);
    }
  }

  // Handle Manual Overrides
  if (status.mode === 'manual_open') {
    let countdownText = 'Manual Open Mode';
    let targetTime = null;
    let secondsLeft = null;

    if (status.manualOverrideExpiresAt) {
      const expiresAt = new Date(status.manualOverrideExpiresAt);
      secondsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      countdownText = `Manual open ends in ${mins}m ${secs}s`;
      targetTime = expiresAt.toISOString();
    }

    return {
      isOpen: true,
      mode: 'manual_open',
      statusText: 'OPEN NOW',
      badgeText: 'Manual Override',
      accentColor: 'emerald',
      countdownText,
      targetTime,
      secondsLeft,
      currentShift: 'Manual Open Shift',
      nextAction: 'Reverts to Auto schedule when reset',
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  if (status.mode === 'manual_closed') {
    let countdownText = 'Temporarily Closed';
    let targetTime = null;
    let secondsLeft = null;

    if (status.manualOverrideExpiresAt) {
      const expiresAt = new Date(status.manualOverrideExpiresAt);
      secondsLeft = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000));
      const mins = Math.floor(secondsLeft / 60);
      const secs = secondsLeft % 60;
      countdownText = `Opening in ${mins}m ${secs}s`;
      targetTime = expiresAt.toISOString();
    }

    return {
      isOpen: false,
      mode: 'manual_closed',
      statusText: 'CLOSED',
      badgeText: 'Tapri Break / Paused',
      accentColor: 'rose',
      countdownText,
      targetTime,
      secondsLeft,
      currentShift: 'Manual Paused',
      nextAction: 'Tapri is taking a break or closed early',
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  // --- AUTO MODE ---
  const morningStart = parseTimeToMinutes(shifts.morning.start);
  const morningEnd = parseTimeToMinutes(shifts.morning.end);
  const eveningStart = parseTimeToMinutes(shifts.evening.start);
  const eveningEnd = parseTimeToMinutes(shifts.evening.end);

  const isDayActive = !shifts.daysActive || shifts.daysActive.includes(currentDay);

  if (!isDayActive) {
    return {
      isOpen: false,
      mode: 'auto',
      statusText: 'CLOSED TODAY',
      badgeText: 'Off Day Schedule',
      accentColor: 'rose',
      countdownText: 'Closed on Sundays / Off Days',
      targetTime: null,
      secondsLeft: null,
      currentShift: 'Closed',
      nextAction: `Opens next active day at ${formatMinutesToTime(morningStart)}`,
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  // Check Morning Shift
  if (currentMinutes >= morningStart && currentMinutes < morningEnd) {
    const minutesLeft = morningEnd - currentMinutes;
    const hours = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;
    const targetDate = new Date(now);
    targetDate.setHours(Math.floor(morningEnd / 60), morningEnd % 60, 0, 0);

    const secondsLeft = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

    return {
      isOpen: true,
      mode: 'auto',
      statusText: 'OPEN NOW',
      badgeText: 'Morning Shift Active',
      accentColor: 'emerald',
      countdownText: hours > 0 ? `Closes in ${hours}h ${mins}m` : `Closes in ${mins}m`,
      targetTime: targetDate.toISOString(),
      secondsLeft,
      currentShift: `${shifts.morning.label} (${formatMinutesToTime(morningStart)} - ${formatMinutesToTime(morningEnd)})`,
      nextAction: `Next shift opens at ${formatMinutesToTime(eveningStart)}`,
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  // Check Evening Shift
  if (currentMinutes >= eveningStart && currentMinutes < eveningEnd) {
    const minutesLeft = eveningEnd - currentMinutes;
    const hours = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;
    const targetDate = new Date(now);
    targetDate.setHours(Math.floor(eveningEnd / 60), eveningEnd % 60, 0, 0);

    const secondsLeft = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

    return {
      isOpen: true,
      mode: 'auto',
      statusText: 'OPEN NOW',
      badgeText: 'Evening Shift Active',
      accentColor: 'emerald',
      countdownText: hours > 0 ? `Closes in ${hours}h ${mins}m` : `Closes in ${mins}m`,
      targetTime: targetDate.toISOString(),
      secondsLeft,
      currentShift: `${shifts.evening.label} (${formatMinutesToTime(eveningStart)} - ${formatMinutesToTime(eveningEnd)})`,
      nextAction: `Closes at ${formatMinutesToTime(eveningEnd)}`,
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  // Before Morning Shift
  if (currentMinutes < morningStart) {
    const minutesUntilOpen = morningStart - currentMinutes;
    const hours = Math.floor(minutesUntilOpen / 60);
    const mins = minutesUntilOpen % 60;
    const targetDate = new Date(now);
    targetDate.setHours(Math.floor(morningStart / 60), morningStart % 60, 0, 0);

    const secondsLeft = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

    return {
      isOpen: false,
      mode: 'auto',
      statusText: 'CLOSED',
      badgeText: 'Early Morning Pause',
      accentColor: 'rose',
      countdownText: hours > 0 ? `Opens in ${hours}h ${mins}m` : `Opens in ${mins}m`,
      targetTime: targetDate.toISOString(),
      secondsLeft,
      currentShift: 'Between Shifts',
      nextAction: `Morning shift begins at ${formatMinutesToTime(morningStart)}`,
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  // Between Morning and Evening Shift (Afternoon lull)
  if (currentMinutes >= morningEnd && currentMinutes < eveningStart) {
    const minutesUntilOpen = eveningStart - currentMinutes;
    const hours = Math.floor(minutesUntilOpen / 60);
    const mins = minutesUntilOpen % 60;
    const targetDate = new Date(now);
    targetDate.setHours(Math.floor(eveningStart / 60), eveningStart % 60, 0, 0);

    const secondsLeft = Math.max(0, Math.floor((targetDate.getTime() - now.getTime()) / 1000));

    return {
      isOpen: false,
      mode: 'auto',
      statusText: 'CLOSED',
      badgeText: 'Afternoon Chai Prep',
      accentColor: 'rose',
      countdownText: hours > 0 ? `Opens in ${hours}h ${mins}m` : `Opens in ${mins}m`,
      targetTime: targetDate.toISOString(),
      secondsLeft,
      currentShift: 'Afternoon Break',
      nextAction: `Evening shift begins at ${formatMinutesToTime(eveningStart)}`,
      currentNote: status.currentNote,
      updatedAt: status.updatedAt,
      updatedBy: status.updatedBy
    };
  }

  // After Evening Shift (Night time, until tomorrow morning)
  const tomorrowMorning = new Date(now);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(Math.floor(morningStart / 60), morningStart % 60, 0, 0);

  const secondsLeft = Math.max(0, Math.floor((tomorrowMorning.getTime() - now.getTime()) / 1000));
  const totalMins = Math.floor(secondsLeft / 60);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  return {
    isOpen: false,
    mode: 'auto',
    statusText: 'CLOSED FOR TODAY',
    badgeText: 'Shop Closed for Night',
    accentColor: 'rose',
    countdownText: `Opens tomorrow at ${formatMinutesToTime(morningStart)} (${hours}h ${mins}m)`,
    targetTime: tomorrowMorning.toISOString(),
    secondsLeft,
    currentShift: 'Closed for the Day',
    nextAction: `Opens tomorrow morning at ${formatMinutesToTime(morningStart)}`,
    currentNote: status.currentNote,
    updatedAt: status.updatedAt,
    updatedBy: status.updatedBy
  };
}

