export interface HomepageBadgeItem {
  id: string;
  value: string;
  label: string;
}

export interface HomepageStatsConfig {
  badges: HomepageBadgeItem[];
  stat1Value?: string;
  stat1Label?: string;
  stat2Value?: string;
  stat2Label?: string;
  stat3Value?: string;
  stat3Label?: string;
}

export const DEFAULT_HOMEPAGE_BADGES: HomepageBadgeItem[] = [
  { id: "badge-1", value: "50K+", label: "Memories Framed" },
  { id: "badge-2", value: "2 Hours", label: "Express Local Delivery" },
  { id: "badge-3", value: "4.9★", label: "Customer Happiness" },
];

export const DEFAULT_HOMEPAGE_STATS: HomepageStatsConfig = {
  badges: DEFAULT_HOMEPAGE_BADGES,
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
      let badges: HomepageBadgeItem[] = [];
      if (Array.isArray(parsed.badges)) {
        badges = parsed.badges;
      } else if (parsed.stat1Value || parsed.stat2Value || parsed.stat3Value) {
        badges = [
          { id: "badge-1", value: parsed.stat1Value || "50K+", label: parsed.stat1Label || "Memories Framed" },
          { id: "badge-2", value: parsed.stat2Value || "2 Hours", label: parsed.stat2Label || "Express Local Delivery" },
          { id: "badge-3", value: parsed.stat3Value || "4.9★", label: parsed.stat3Label || "Customer Happiness" },
        ];
      } else {
        badges = DEFAULT_HOMEPAGE_BADGES;
      }

      return {
        badges,
        stat1Value: badges[0]?.value || "",
        stat1Label: badges[0]?.label || "",
        stat2Value: badges[1]?.value || "",
        stat2Label: badges[1]?.label || "",
        stat3Value: badges[2]?.value || "",
        stat3Label: badges[2]?.label || "",
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
    const badges = stats.badges || [];
    const payload: HomepageStatsConfig = {
      badges,
      stat1Value: badges[0]?.value || "",
      stat1Label: badges[0]?.label || "",
      stat2Value: badges[1]?.value || "",
      stat2Label: badges[1]?.label || "",
      stat3Value: badges[2]?.value || "",
      stat3Label: badges[2]?.label || "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event("pixello_homepage_stats_updated"));
    window.dispatchEvent(new Event("storage"));
  } catch (e) {
    console.error("Error saving homepage stats:", e);
  }
}
