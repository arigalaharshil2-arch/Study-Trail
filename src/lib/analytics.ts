import { Subject, Chapter, Topic } from "../types";

export type StreakInfo = {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
};

export type PaceInfo = {
  remainingTopics: number;
  completedTopics: number;
  totalTopics: number;
  estimatedDaysRemaining: number | null;
  dailyRate: number;
  message: string;
};

export function calculateSubjectProgress(topics: Topic[], subjectId: string): number {
  const subjTopics = topics.filter((t) => t.subjectId === subjectId);
  if (subjTopics.length === 0) return 0;
  const done = subjTopics.filter((t) => t.completed).length;
  return done / subjTopics.length;
}

export function calculateChapterProgress(topics: Topic[], chapterId: string): number {
  const chapTopics = topics.filter((t) => t.chapterId === chapterId);
  if (chapTopics.length === 0) return 0;
  const done = chapTopics.filter((t) => t.completed).length;
  return done / chapTopics.length;
}

export function calculateOverallProgress(topics: Topic[]): number {
  if (topics.length === 0) return 0;
  const done = topics.filter((t) => t.completed).length;
  return done / topics.length;
}

export function calculateStreak(topics: Topic[], referenceDateStr?: string): StreakInfo {
  const completedTopics = topics.filter((t) => t.completed && t.completedAt);
  if (completedTopics.length === 0) {
    return { currentStreak: 0, longestStreak: 0, completedToday: false };
  }

  // Set of dates (YYYY-MM-DD) with at least 1 topic completed
  const activeDates = new Set<string>();
  completedTopics.forEach((t) => {
    if (t.completedAt) {
      // Format to YYYY-MM-DD
      const dateKey = t.completedAt.split("T")[0];
      activeDates.add(dateKey);
    }
  });

  const refDateObj = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const todayStr = refDateObj.toISOString().split("T")[0];

  const getPrevDateStr = (dateStr: string, daysAgo: number): string => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split("T")[0];
  };

  const completedToday = activeDates.has(todayStr);

  let currentStreak = 0;
  // If completed today, start counting from today backwards
  // If not completed today, check if completed yesterday. If yes, count starting yesterday backwards.
  let startDaysAgo = 0;
  if (!completedToday) {
    const yesterdayStr = getPrevDateStr(todayStr, 1);
    if (activeDates.has(yesterdayStr)) {
      startDaysAgo = 1;
    } else {
      currentStreak = 0;
    }
  }

  if (completedToday || startDaysAgo === 1) {
    let daysAgo = startDaysAgo;
    while (true) {
      const checkDate = getPrevDateStr(todayStr, daysAgo);
      if (activeDates.has(checkDate)) {
        currentStreak++;
        daysAgo++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across all recorded active dates
  const sortedDates = Array.from(activeDates).sort();
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDateObj: Date | null = null;

  sortedDates.forEach((dStr) => {
    const curDateObj = new Date(dStr);
    if (!prevDateObj) {
      tempStreak = 1;
    } else {
      const diffDays = Math.round((curDateObj.getTime() - prevDateObj.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
    prevDateObj = curDateObj;
  });

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    completedToday,
  };
}

export function calculatePace(topics: Topic[]): PaceInfo {
  const totalTopics = topics.length;
  const completedTopicsList = topics.filter((t) => t.completed && t.completedAt);
  const completedTopics = completedTopicsList.length;
  const remainingTopics = totalTopics - completedTopics;

  if (totalTopics === 0) {
    return {
      remainingTopics: 0,
      completedTopics: 0,
      totalTopics: 0,
      estimatedDaysRemaining: null,
      dailyRate: 0,
      message: "No topics uploaded yet",
    };
  }

  if (remainingTopics === 0) {
    return {
      remainingTopics: 0,
      completedTopics,
      totalTopics,
      estimatedDaysRemaining: 0,
      dailyRate: 0,
      message: "All topics completed! 🎉",
    };
  }

  if (completedTopics === 0) {
    return {
      remainingTopics,
      completedTopics: 0,
      totalTopics,
      estimatedDaysRemaining: null,
      dailyRate: 0,
      message: `${remainingTopics} topics left · Start completing topics to estimate your pace`,
    };
  }

  // Look at history over active window (e.g., last 14 days)
  const now = new Date();
  const windowDays = 14;
  const windowStart = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const topicsInWindow = completedTopicsList.filter((t) => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d >= windowStart;
  });

  // Calculate rate based on completed topics count / active window or total completed count
  const windowCount = topicsInWindow.length;

  let dailyRate = 0;
  if (windowCount > 0) {
    dailyRate = windowCount / windowDays;
  } else {
    // Fallback: total completed over total span of completion
    const timestamps = completedTopicsList.map((t) => new Date(t.completedAt!).getTime());
    const minTime = Math.min(...timestamps);
    const maxTime = Math.max(...timestamps, now.getTime());
    const totalDaysSpan = Math.max(1, Math.ceil((maxTime - minTime) / (1000 * 60 * 60 * 24)));
    dailyRate = completedTopics / totalDaysSpan;
  }

  if (dailyRate <= 0) {
    return {
      remainingTopics,
      completedTopics,
      totalTopics,
      estimatedDaysRemaining: null,
      dailyRate: 0,
      message: `${remainingTopics} topics left · Complete more topics to calculate pace`,
    };
  }

  const estimatedDaysRemaining = Math.ceil(remainingTopics / dailyRate);

  return {
    remainingTopics,
    completedTopics,
    totalTopics,
    estimatedDaysRemaining,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    message: `${remainingTopics} topics left · ~${estimatedDaysRemaining} days at your current pace`,
  };
}
