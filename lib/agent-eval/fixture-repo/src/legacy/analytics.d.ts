export type AnalyticsPropertyValue = string | number | boolean;

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, AnalyticsPropertyValue>;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  plan?: string;
}

export interface NormalizedUser {
  id: string;
  email: string;
  plan: string;
}

declare const analytics: {
  trackEvent<TEventName extends string>(
    name: TEventName,
    properties?: Record<string, AnalyticsPropertyValue>
  ): AnalyticsEvent & { name: TEventName };
  normalizeUser(user: UserProfile): NormalizedUser;
};

export default analytics;
