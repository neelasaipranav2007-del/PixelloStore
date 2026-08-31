export interface HomepageStatsConfig {
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
}

export const DEFAULT_HOMEPAGE_STATS: HomepageStatsConfig = {
  stat1Value: "50K+",
  stat1Label: "Memories Framed",
  stat2Value: "2 Hours",
  stat2Label: "Express Local Delivery",
  stat3Value: "4.9★",
  stat3Label: "Customer Happiness",
};

const STORAGE_KEY = "pixello_homepage_stats_v1";

export function getHomepageStats(): HomepageStatsConfig {
  if (typeof window === "undefined") {
    return DEFAULT_HOMEPAGE_STATS;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        stat1Value: parsed.stat1Value || DEFAULT_HOMEPAGE_STATS.stat1Value,
        stat1Label: parsed.stat1Label || DEFAULT_HOMEPAGE_STATS.stat1Label,
        stat2Value: parsed.stat2Value || DEFAULT_HOMEPAGE_STATS.stat2Value,
        stat2Label: parsed.stat2Label || DEFAULT_HOMEPAGE_STATS.stat2Label,
        stat3Value: parsed.stat3Value || DEFAULT_HOMEPAGE_STATS.stat3Value,
        stat3Label: parsed.stat3Label || DEFAULT_HOMEPAGE_STATS.stat3Label,
      };
    }
  } catch (e) {
    console.error("Error loading homepage stats:", e);
  }
  return DEFAULT_HOMEPAGE_STATS;
}

export function saveHomepageStats(stats: HomepageStatsConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new Event("pixello_homepage_stats_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving homepage stats:", e);
  }
}
