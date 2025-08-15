// Simple privacy-first analytics
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  timestamp: number;
  sessionId: string;
}

class PrivacyFirstAnalytics {
  private sessionId: string;
  private queue: AnalyticsEvent[] = [];
  private isEnabled: boolean = true;

  constructor() {
    // Generate anonymous session ID
    this.sessionId = this.generateSessionId();
    
    // Check if user has opted out
    this.isEnabled = localStorage.getItem('analytics-opt-out') !== 'true';
    
    // Send queued events periodically
    this.startPeriodicSync();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private startPeriodicSync() {
    // Send analytics data every 30 seconds
    setInterval(() => {
      this.flush();
    }, 30000);

    // Send on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  track(event: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return;

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: this.sanitizeProperties(properties),
      timestamp: Date.now(),
      sessionId: this.sessionId
    };

    this.queue.push(analyticsEvent);

    // Auto-flush if queue gets large
    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> {
    if (!properties) return {};

    // Remove any potentially sensitive data
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip sensitive keys
      if (this.isSensitiveKey(key)) continue;
      
      // Sanitize values
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'ip', 'email', 'phone', 'address', 'name', 'id', 
      'sessionid', 'userid', 'token', 'password', 'secret'
    ];
    return sensitiveKeys.includes(key.toLowerCase());
  }

  private sanitizeString(value: string): string {
    // Remove potential PII patterns
    return value
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[phone]')
      .replace(/\b\d{1,5}\s\w+\s(?:street|st|avenue|ave|road|rd|drive|dr)\b/gi, '[address]');
  }

  private async flush() {
    if (this.queue.length === 0 || !this.isEnabled) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      // Send to our privacy-focused analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          userAgent: this.sanitizeUserAgent(navigator.userAgent),
          viewport: {
            width: Math.round(window.innerWidth / 100) * 100, // Round to nearest 100
            height: Math.round(window.innerHeight / 100) * 100
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language.split('-')[0], // Just language, not region
        })
      });
    } catch (error) {
      console.warn('Analytics sync failed:', error);
      // Re-queue events for retry
      this.queue.unshift(...events);
    }
  }

  private sanitizeUserAgent(userAgent: string): string {
    // Extract only browser type and version, remove specific system info
    const patterns = [
      /Chrome\/[\d.]+/,
      /Firefox\/[\d.]+/,
      /Safari\/[\d.]+/,
      /Edge\/[\d.]+/,
      /Opera\/[\d.]+/
    ];

    for (const pattern of patterns) {
      const match = userAgent.match(pattern);
      if (match) return match[0];
    }

    return 'Unknown';
  }

  // Allow users to opt out
  optOut() {
    this.isEnabled = false;
    localStorage.setItem('analytics-opt-out', 'true');
    this.queue = []; // Clear any queued events
  }

  optIn() {
    this.isEnabled = true;
    localStorage.removeItem('analytics-opt-out');
  }

  isOptedOut(): boolean {
    return !this.isEnabled;
  }
}

// Create global analytics instance
export const analytics = new PrivacyFirstAnalytics();

// Common event tracking functions
export const trackEvent = {
  sessionStarted: () => analytics.track('session_started'),
  
  sessionCreated: (method: 'host' | 'join') => 
    analytics.track('session_created', { method }),
  
  connectionEstablished: (duration: number) => 
    analytics.track('connection_established', { 
      duration: Math.round(duration / 1000) // Round to seconds
    }),
  
  messagesSent: (count: number) => 
    analytics.track('messages_sent', { 
      count: Math.min(count, 100) // Cap for privacy
    }),
  
  sessionEnded: (duration: number, messageCount: number) => 
    analytics.track('session_ended', {
      duration: Math.round(duration / 1000),
      messageCount: Math.min(messageCount, 100)
    }),
  
  errorOccurred: (errorType: string) => 
    analytics.track('error_occurred', { errorType }),
  
  featureUsed: (feature: string) => 
    analytics.track('feature_used', { feature }),
  
  pageView: (path: string) => 
    analytics.track('page_view', { 
      path: path.split('?')[0] // Remove query params for privacy
    })
};
