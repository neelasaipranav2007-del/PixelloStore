/**
 * PixelloStore — Birthday Celebration & 72-Hour Milestone Window Helper
 * 
 * Computes whether a customer's birthday or their loved ones' birthdays are within the 72-hour window,
 * manages birthday milestone discounts (BDAY25), and handles pop-up and homepage reminder states.
 */

export interface BirthdayStatus {
  hasBirthday: boolean;
  birthdayStr: string;
  formattedBirthday: string;
  isToday: boolean;
  isWithin72Hours: boolean;
  hoursUntil: number;
  daysUntil: number;
  hoursLeftInWindow: number;
  countdownText: string;
  couponCode: string;
  discountPercent: number;
}

export interface LovedOneBirthday {
  id: string;
  name: string;
  relationship: string; // e.g. "Partner", "Spouse", "Mother", "Father", "Brother", "Sister", "Best Friend", "Child", "Other"
  birthday: string;     // YYYY-MM-DD
  notes?: string;
  createdAt?: string;
}

export interface LovedOneBirthdayStatus {
  lovedOne: LovedOneBirthday;
  status: BirthdayStatus;
}

export interface ActiveCelebrationTarget {
  type: 'self' | 'loved_one';
  name: string;
  relationship?: string;
  birthdayStr: string;
  status: BirthdayStatus;
  lovedOneId?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`;
  switch (day % 10) {
    case 1: return `${day}st`;
    case 2: return `${day}nd`;
    case 3: return `${day}rd`;
    default: return `${day}th`;
  }
}

export function getBirthdayStatus(birthdayInput?: string | null): BirthdayStatus {
  const defaultStatus: BirthdayStatus = {
    hasBirthday: false,
    birthdayStr: '',
    formattedBirthday: '',
    isToday: false,
    isWithin72Hours: false,
    hoursUntil: -1,
    daysUntil: -1,
    hoursLeftInWindow: 0,
    countdownText: '',
    couponCode: 'BDAY25',
    discountPercent: 25,
  };

  if (!birthdayInput || typeof birthdayInput !== 'string') {
    return defaultStatus;
  }

  const clean = birthdayInput.trim();
  if (!clean) return defaultStatus;

  // Expected format: YYYY-MM-DD or MM-DD
  const parts = clean.split('-');
  let bMonth = 0;
  let bDay = 0;

  if (parts.length === 3) {
    // YYYY-MM-DD
    bMonth = parseInt(parts[1], 10);
    bDay = parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    // MM-DD
    bMonth = parseInt(parts[0], 10);
    bDay = parseInt(parts[1], 10);
  }

  if (!bMonth || !bDay || isNaN(bMonth) || isNaN(bDay) || bMonth < 1 || bMonth > 12 || bDay < 1 || bDay > 31) {
    return defaultStatus;
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  // Next birthday midnight
  let nextBday = new Date(currentYear, bMonth - 1, bDay, 0, 0, 0, 0);
  // End of birthday (23:59:59)
  const bdayEnd = new Date(currentYear, bMonth - 1, bDay, 23, 59, 59, 999);

  // If today is the birthday
  const isToday = now.getMonth() === bMonth - 1 && now.getDate() === bDay;

  // If this year's birthday already passed (and is not today)
  if (now > bdayEnd) {
    nextBday = new Date(currentYear + 1, bMonth - 1, bDay, 0, 0, 0, 0);
  }

  const diffMs = nextBday.getTime() - now.getTime();
  const hoursUntil = isToday ? 0 : Math.max(0, diffMs / (1000 * 60 * 60));
  const daysUntil = isToday ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // 72-Hour Celebration Window:
  // Active if today is birthday OR if birthday is strictly within 72 hours (<= 72.0 hours away)
  const isWithin72Hours = isToday || (hoursUntil > 0 && hoursUntil <= 72);

  // Remaining celebration window hours (from now until the end of birthday day)
  const celebrationEndMs = isToday 
    ? bdayEnd.getTime() - now.getTime()
    : (nextBday.getTime() + 24 * 60 * 60 * 1000) - now.getTime();
  const hoursLeftInWindow = Math.max(0, Math.round(celebrationEndMs / (1000 * 60 * 60)));

  let countdownText = '';
  if (isToday) {
    countdownText = 'Today is Birthday! 🎉';
  } else if (hoursUntil <= 72) {
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    countdownText = `${h}h ${m}m away (${daysUntil === 1 ? 'Tomorrow' : `in ${daysUntil} days`})`;
  } else {
    countdownText = `in ${daysUntil} days (${MONTH_NAMES[bMonth - 1]} ${getOrdinalSuffix(bDay)})`;
  }

  return {
    hasBirthday: true,
    birthdayStr: clean,
    formattedBirthday: `${getOrdinalSuffix(bDay)} ${MONTH_NAMES[bMonth - 1]}`,
    isToday,
    isWithin72Hours,
    hoursUntil: Math.round(hoursUntil * 10) / 10,
    daysUntil,
    hoursLeftInWindow,
    countdownText,
    couponCode: 'BDAY25',
    discountPercent: 25,
  };
}

/**
 * Calculates birthday status for all saved loved ones
 */
export function getLovedOnesStatus(lovedOnes?: LovedOneBirthday[] | null): LovedOneBirthdayStatus[] {
  if (!lovedOnes || !Array.isArray(lovedOnes)) return [];
  return lovedOnes.map((lo) => ({
    lovedOne: lo,
    status: getBirthdayStatus(lo.birthday),
  }));
}

/**
 * Filters loved ones whose birthday is within 72 hours or today
 */
export function getUpcomingLovedOnesBirthdays(lovedOnes?: LovedOneBirthday[] | null): LovedOneBirthdayStatus[] {
  const statuses = getLovedOnesStatus(lovedOnes);
  return statuses.filter((s) => s.status.isWithin72Hours);
}

/**
 * Finds the currently active celebration target.
 * Priority:
 * 1. Customer's own birthday if active within 72h
 * 2. Loved ones' birthdays if active within 72h (sorted by soonest)
 */
export function getActiveCelebrationTarget(
  userBirthday?: string | null,
  userName?: string,
  lovedOnes?: LovedOneBirthday[] | null
): ActiveCelebrationTarget | null {
  // 1. Check self birthday
  if (userBirthday) {
    const selfStatus = getBirthdayStatus(userBirthday);
    if (selfStatus.isWithin72Hours) {
      return {
        type: 'self',
        name: userName || 'You',
        birthdayStr: userBirthday,
        status: selfStatus,
      };
    }
  }

  // 2. Check loved ones
  const upcomingLovedOnes = getUpcomingLovedOnesBirthdays(lovedOnes);
  if (upcomingLovedOnes.length > 0) {
    // Sort so the soonest birthday is first
    upcomingLovedOnes.sort((a, b) => a.status.hoursUntil - b.status.hoursUntil);
    const primary = upcomingLovedOnes[0];
    return {
      type: 'loved_one',
      name: primary.lovedOne.name,
      relationship: primary.lovedOne.relationship,
      birthdayStr: primary.lovedOne.birthday,
      status: primary.status,
      lovedOneId: primary.lovedOne.id,
    };
  }

  return null;
}

/**
 * Determines whether to show the celebration modal popup.
 */
export function shouldShowBirthdayCelebration(
  userBirthday?: string | null,
  userName?: string,
  lovedOnes?: LovedOneBirthday[] | null
): { shouldShow: boolean; target: ActiveCelebrationTarget | null } {
  if (typeof window === 'undefined') return { shouldShow: false, target: null };

  const target = getActiveCelebrationTarget(userBirthday, userName, lovedOnes);
  if (!target) return { shouldShow: false, target: null };

  try {
    const key = target.type === 'self' ? 'self' : `loved_${target.lovedOneId}`;
    
    // Check if dismissed in this browser session
    const sessionDismissed = sessionStorage.getItem(`pixello_bday_popup_${key}_dismissed`);
    if (sessionDismissed === 'true') return { shouldShow: false, target };

    // Check if dismissed within the last 12 hours
    const lastDismissedStr = localStorage.getItem(`pixello_bday_popup_${key}_last_dismissed`);
    if (lastDismissedStr) {
      const lastDismissed = parseInt(lastDismissedStr, 10);
      const hoursSince = (Date.now() - lastDismissed) / (1000 * 60 * 60);
      if (hoursSince < 12) {
        return { shouldShow: false, target };
      }
    }

    return { shouldShow: true, target };
  } catch (e) {
    return { shouldShow: true, target };
  }
}

export function dismissBirthdayCelebration(targetKey?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = targetKey || 'self';
    sessionStorage.setItem(`pixello_bday_popup_${key}_dismissed`, 'true');
    localStorage.setItem(`pixello_bday_popup_${key}_last_dismissed`, Date.now().toString());
    // Also set global dismissal flag
    sessionStorage.setItem('pixello_bday_popup_session_dismissed', 'true');
    localStorage.setItem('pixello_bday_popup_last_dismissed', Date.now().toString());
  } catch (e) {}
}

export function shouldShowBirthdayPopup(birthdayInput?: string | null): boolean {
  if (typeof window === 'undefined') return false;
  const status = getBirthdayStatus(birthdayInput);
  if (!status.isWithin72Hours) return false;

  try {
    const sessionDismissed = sessionStorage.getItem('pixello_bday_popup_session_dismissed');
    if (sessionDismissed === 'true') return false;

    const lastDismissedStr = localStorage.getItem('pixello_bday_popup_last_dismissed');
    if (lastDismissedStr) {
      const lastDismissed = parseInt(lastDismissedStr, 10);
      const hoursSince = (Date.now() - lastDismissed) / (1000 * 60 * 60);
      if (hoursSince < 12) return false;
    }
    return true;
  } catch (e) {
    return true;
  }
}

export function dismissBirthdayPopup(): void {
  dismissBirthdayCelebration('self');
}

/**
 * Validates if the customer is eligible for the BDAY25 exclusive discount.
 * Must be signed in with a birthday within the 72-hour celebration window.
 */
export function isCustomerEligibleForBirthdayDiscount(birthdayInput?: string | null): boolean {
  if (!birthdayInput) return false;
  const status = getBirthdayStatus(birthdayInput);
  return status.isWithin72Hours;
}
