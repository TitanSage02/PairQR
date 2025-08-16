import { type User, type InsertUser, type Session, type InsertSession, sessions } from "./schema.js";
import { db } from "./db.js";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session management
  createSession(session: InsertSession): Promise<Session>;
  getSession(id: string): Promise<Session | undefined>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<void>;
  cleanupExpiredSessions(): Promise<void>;
  
  // Peer signaling data (ephemeral)
  storePeerOffer(sessionId: string, offer: any): Promise<void>;
  getPeerOffer(sessionId: string): Promise<any>;
  storePeerAnswer(sessionId: string, answer: any): Promise<void>;
  getPeerAnswer(sessionId: string): Promise<any>;
  storeIceCandidate(sessionId: string, candidate: any): Promise<void>;
  getIceCandidates(sessionId: string): Promise<any[]>;
  clearPeerData(sessionId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private sessions: Map<string, Session>;
  private peerOffers: Map<string, any>;
  private peerAnswers: Map<string, any>;
  private iceCandidates: Map<string, any[]>;
  
  // Admin and analytics data
  private feedback: Array<{
    id: string;
    rating: number;
    comment?: string;
    timestamp: string;
    sessionId?: string;
  }>;
  
  private waitlist: string[];
  
  private analytics: {
    totalMessages: number;
    events: Array<{
      type: string;
      timestamp: string;
      sessionId?: string;
      data?: any;
    }>;
  };

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.peerOffers = new Map();
    this.peerAnswers = new Map();
    this.iceCandidates = new Map();
    this.feedback = [];
    this.waitlist = [];
    this.analytics = {
      totalMessages: 0,
      events: []
    };
    
    // Cleanup expired sessions every minute
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60000);
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createSession(session: InsertSession): Promise<Session> {
    const newSession: Session = {
      ...session,
      createdAt: new Date(),
      isActive: session.isActive || "true"
    };
    this.sessions.set(session.id, newSession);
    return newSession;
  }

  async getSession(id: string): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    if (session) {
      this.sessions.delete(id);
    }
    return undefined;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates };
      this.sessions.set(id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  async deleteSession(id: string): Promise<void> {
    this.sessions.delete(id);
    this.clearPeerData(id);
  }

  async cleanupExpiredSessions(): Promise<void> {
    const now = new Date();
    const sessionsToDelete: string[] = [];
    
    this.sessions.forEach((session, id) => {
      if (session.expiresAt <= now) {
        sessionsToDelete.push(id);
      }
    });
    
    for (const id of sessionsToDelete) {
      this.sessions.delete(id);
      this.clearPeerData(id);
    }
  }

  async storePeerOffer(sessionId: string, offer: any): Promise<void> {
    this.peerOffers.set(sessionId, offer);
  }

  async getPeerOffer(sessionId: string): Promise<any> {
    return this.peerOffers.get(sessionId);
  }

  async storePeerAnswer(sessionId: string, answer: any): Promise<void> {
    this.peerAnswers.set(sessionId, answer);
  }

  async getPeerAnswer(sessionId: string): Promise<any> {
    return this.peerAnswers.get(sessionId);
  }

  async storeIceCandidate(sessionId: string, candidate: any): Promise<void> {
    if (!this.iceCandidates.has(sessionId)) {
      this.iceCandidates.set(sessionId, []);
    }
    this.iceCandidates.get(sessionId)!.push(candidate);
  }

  async getIceCandidates(sessionId: string): Promise<any[]> {
    return this.iceCandidates.get(sessionId) || [];
  }

  async clearPeerData(sessionId: string): Promise<void> {
    this.peerOffers.delete(sessionId);
    this.peerAnswers.delete(sessionId);
    this.iceCandidates.delete(sessionId);
  }

  // Admin methods
  getAdminStats() {
    return {
      totalSessions: this.sessions.size,
      activeConnections: Array.from(this.sessions.values()).filter(s => s.isActive).length,
      totalMessages: this.analytics.totalMessages || 0,
      totalFeedback: this.feedback.length,
      waitlistSignups: this.waitlist.length,
      totalAnalyticsEvents: this.analytics.events.length
    };
  }

  getAllSessions() {
    return Array.from(this.sessions.values()).map(session => ({
      id: session.id,
      createdAt: session.createdAt,
      isActive: session.isActive,
      expiresAt: session.expiresAt
    }));
  }

  getFeedback() {
    return this.feedback;
  }

  getWaitlist() {
    return this.waitlist;
  }

  getAnalytics() {
    return this.analytics;
  }

  addFeedback(rating: number, comment?: string, sessionId?: string) {
    this.feedback.push({
      id: randomUUID(),
      rating,
      comment,
      timestamp: new Date().toISOString(),
      sessionId
    });
  }

  addWaitlistEmail(email: string) {
    if (!this.waitlist.includes(email)) {
      this.waitlist.push(email);
    }
  }

  incrementMessageCount() {
    this.analytics.totalMessages++;
  }

  addAnalyticsEvent(type: string, sessionId?: string, data?: any) {
    this.analytics.events.push({
      type,
      timestamp: new Date().toISOString(),
      sessionId,
      data
    });
  }
}

// PostgreSQL Storage Implementation
export class PostgreSQLStorage implements IStorage {
  private peerOffers: Map<string, any>;
  private peerAnswers: Map<string, any>;
  private iceCandidates: Map<string, any[]>;
  private feedback: Array<{
    id: string;
    rating: number;
    comment?: string;
    timestamp: string;
    sessionId?: string;
  }>;

  constructor() {
    this.peerOffers = new Map();
    this.peerAnswers = new Map();
    this.iceCandidates = new Map();
    this.feedback = [];
  }

  // User management (PostgreSQL)
  async getUser(id: string): Promise<User | undefined> {
    try {
      // For now, return undefined since we don't have users implemented yet
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      // For now, return undefined since we don't have users implemented yet
      return undefined;
    } catch (error) {
      console.error('Error getting user by username:', error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // For now, create in memory
      const id = randomUUID();
      const user: User = { ...insertUser, id };
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Session management (PostgreSQL) - Simple implementation first
  async createSession(session: InsertSession): Promise<Session> {
    try {
      console.log('Creating session in PostgreSQL:', session);
      
      const newSession: Session = {
        ...session,
        createdAt: new Date(),
        isActive: session.isActive || "true"
      };
      
      console.log('Inserting session:', newSession);
      await db.insert(sessions).values(newSession);
      console.log('Session inserted successfully');
      
      return newSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(id: string): Promise<Session | undefined> {
    try {
      // Simple query without complex operators for now
      const result = await db.select().from(sessions);
      return result.find((s: Session) => s.id === id && s.expiresAt > new Date());
    } catch (error) {
      console.error('Error getting session:', error);
      return undefined;
    }
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    try {
      // For now, just get the session
      return this.getSession(id);
    } catch (error) {
      console.error('Error updating session:', error);
      return undefined;
    }
  }

  async deleteSession(id: string): Promise<void> {
    try {
      // For now, just log
      console.log('Delete session requested:', id);
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  }

  async cleanupExpiredSessions(): Promise<void> {
    try {
      // For now, just log
      console.log('Cleanup expired sessions requested');
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }

  // Peer signaling data (still in memory for performance)
  async storePeerOffer(sessionId: string, offer: any): Promise<void> {
    this.peerOffers.set(sessionId, offer);
  }

  async getPeerOffer(sessionId: string): Promise<any> {
    return this.peerOffers.get(sessionId);
  }

  async storePeerAnswer(sessionId: string, answer: any): Promise<void> {
    this.peerAnswers.set(sessionId, answer);
  }

  async getPeerAnswer(sessionId: string): Promise<any> {
    return this.peerAnswers.get(sessionId);
  }

  async storeIceCandidate(sessionId: string, candidate: any): Promise<void> {
    const existing = this.iceCandidates.get(sessionId) || [];
    existing.push(candidate);
    this.iceCandidates.set(sessionId, existing);
  }

  async getIceCandidates(sessionId: string): Promise<any[]> {
    return this.iceCandidates.get(sessionId) || [];
  }

  async clearPeerData(sessionId: string): Promise<void> {
    this.peerOffers.delete(sessionId);
    this.peerAnswers.delete(sessionId);
    this.iceCandidates.delete(sessionId);
  }

  // Analytics and feedback (still in memory for now)
  getAnalytics() {
    return {
      totalSessions: 0, // We'll implement this with a DB query later
      activeSessions: 0,
      totalFeedback: this.feedback.length,
      averageRating: this.feedback.length > 0 
        ? this.feedback.reduce((sum, f) => sum + f.rating, 0) / this.feedback.length 
        : 0
    };
  }

  getFeedback() {
    return this.feedback;
  }

  addFeedback(rating: number, comment?: string, sessionId?: string) {
    this.feedback.push({
      id: randomUUID(),
      rating,
      comment,
      sessionId,
      timestamp: new Date().toISOString()
    });
  }
}

export const storage = new PostgreSQLStorage();
