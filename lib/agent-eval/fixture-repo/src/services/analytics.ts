import analytics from '../legacy/analytics';

export interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: number;
}

export interface UserProfile {
  id: string;
  email: string;
  plan?: string;
}

export function trackSignup(user: UserProfile): AnalyticsEvent {
  const normalized = analytics.normalizeUser(user);
  return analytics.trackEvent('user.signup', {
    plan: normalized.plan,
    email: normalized.email,
  });
}
