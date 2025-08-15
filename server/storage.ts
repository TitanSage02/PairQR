import { type User, type InsertUser, type Session, type InsertSession } from "@shared/schema";
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

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.peerOffers = new Map();
    this.peerAnswers = new Map();
    this.iceCandidates = new Map();
    
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
    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt <= now) {
        this.sessions.delete(id);
        this.clearPeerData(id);
      }
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
}

export const storage = new MemStorage();
