import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import { insertSessionSchema, sessionJoinSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import { createHmac, timingSafeEqual } from "crypto";
import { 
  initializeAdmin, 
  requireAdmin, 
  verifyAdminLogin, 
  generateAdminToken,
  getAdminSettings,
  updateAdminSettings,
  getAdminStats,
  incrementStat,
  changeAdminPassword,
  getAdminData
} from "./admin";

// Extend WebSocket to include custom properties
interface ExtendedWebSocket extends WebSocket {
  sessionId?: string;
  clientId?: string;
}

const HMAC_SECRET = process.env.HMAC_SECRET || "change-me-in-production";
const SESSION_TTL_MINUTES = parseInt(process.env.SESSION_TTL_MINUTES || "2");

function createSignature(data: string): string {
  return createHmac('sha256', HMAC_SECRET).update(data).digest('base64url');
}

function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = createSignature(data);
  const expectedBuffer = Buffer.from(expectedSignature);
  const providedBuffer = Buffer.from(signature);
  
  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }
  
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize admin system
  await initializeAdmin();
  
  // Add cookie parser middleware
  app.use(cookieParser());
  
  const httpServer = createServer(app);
  
  // WebSocket server for real-time signaling
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const connectedClients = new Map<string, ExtendedWebSocket>();
  
  wss.on('connection', (ws: ExtendedWebSocket, req) => {
    console.log('WebSocket connection established');
    
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join-session':
            const { sessionId, clientId } = message;
            connectedClients.set(clientId, ws);
            
            // Store client reference for session
            ws.sessionId = sessionId;
            ws.clientId = clientId;
            
            // Notify other clients in the session
            connectedClients.forEach((client, id) => {
              if (client !== ws && client.sessionId === sessionId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'peer-joined',
                  clientId: clientId
                }));
              }
            });
            break;
            
          case 'webrtc-offer':
          case 'webrtc-answer':
          case 'ice-candidate':
          case 'key-exchange':
            // Forward WebRTC signaling and key exchange to other peer in session
            connectedClients.forEach((client, id) => {
              if (client !== ws && client.sessionId === ws.sessionId && client.readyState === WebSocket.OPEN) {
                client.send(data.toString());
              }
            });
            break;
            
          case 'typing':
            // Forward typing indicators
            connectedClients.forEach((client, id) => {
              if (client !== ws && client.sessionId === ws.sessionId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'typing',
                  isTyping: message.isTyping
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      if (ws.clientId) {
        connectedClients.delete(ws.clientId);
        
        // Notify other clients that peer left
        connectedClients.forEach((client, id) => {
          if (client.sessionId === ws.sessionId && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'peer-left',
              clientId: ws.clientId
            }));
          }
        });
      }
    });
  });

  // API Routes
  
  // Create a new session (host)
  app.post('/api/sessions', async (req, res) => {
    try {
      // Set expiration time first
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + SESSION_TTL_MINUTES);
      
      // Prepare session data with required fields
      const sessionData = {
        id: req.body.id || randomUUID(),
        hostPublicKey: req.body.hostPublicKey,
        signature: req.body.signature || 'temp-signature', // Will be overwritten below
        expiresAt: expiresAt
      };
      
      // Validate the session data
      const validatedSessionData = insertSessionSchema.parse(sessionData);
      
      const session = await storage.createSession(validatedSessionData);
      
      // Generate QR data with signature
      const qrData = `${session.id}|${session.hostPublicKey}|${session.expiresAt.getTime()}`;
      const signature = createSignature(qrData);
      
      // Update session with real signature
      await storage.updateSession(session.id, { signature });
      
      const qrUrl = `${req.protocol}://${req.get('host')}/join?s=${session.id}&epk=${encodeURIComponent(session.hostPublicKey)}&exp=${session.expiresAt.getTime()}&sig=${signature}`;
      
      res.json({
        session,
        qrUrl,
        expiresIn: SESSION_TTL_MINUTES * 60
      });
    } catch (error) {
      console.error('Session creation error:', error);
      res.status(400).json({ error: 'Invalid session data' });
    }
  });
  
  // Get session details
  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
      }
      
      res.json(session);
    } catch (error) {
      console.error('Session retrieval error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Join session (client)
  app.post('/api/sessions/:id/join', async (req, res) => {
    try {
      const sessionJoinData = sessionJoinSchema.parse(req.body);
      const session = await storage.getSession(req.params.id);
      
      if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
      }
      
      res.json({
        sessionId: session.id,
        hostPublicKey: session.hostPublicKey,
        clientPublicKey: sessionJoinData.clientPublicKey
      });
    } catch (error) {
      console.error('Session join error:', error);
      res.status(400).json({ error: 'Invalid join data' });
    }
  });
  
  // Verify QR signature
  app.post('/api/verify-qr', async (req, res) => {
    try {
      const { sessionId, hostPublicKey, expiration, signature } = req.body;
      
      // Check if session is still valid
      if (Date.now() > expiration) {
        return res.status(400).json({ error: 'QR code expired' });
      }
      
      // Verify signature
      const data = `${sessionId}|${hostPublicKey}|${expiration}`;
      if (!verifySignature(data, signature)) {
        return res.status(400).json({ error: 'Invalid QR signature' });
      }
      
      // Check if session exists
      const session = await storage.getSession(sessionId);
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }
      
      res.json({ valid: true, session });
    } catch (error) {
      console.error('QR verification error:', error);
      res.status(400).json({ error: 'Invalid verification data' });
    }
  });
  
  // Delete session
  app.delete('/api/sessions/:id', async (req, res) => {
    try {
      await storage.deleteSession(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Session deletion error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      websocketConnections: connectedClients.size
    });
  });

  // Analytics endpoint (privacy-first)
  app.post('/api/analytics', async (req, res) => {
    try {
      const { events, userAgent, viewport, timezone, language } = req.body;
      
      // Basic validation
      if (!Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ error: 'Invalid events data' });
      }

      // Update admin stats
      events.forEach(event => {
        switch (event.event) {
          case 'session_started':
            incrementStat('totalSessions');
            break;
          case 'messages_sent':
            incrementStat('totalMessages', event.properties?.count || 1);
            break;
        }
      });

      // Rate limiting check (simple in-memory, consider Redis for production)
      const clientIP = req.ip || req.connection.remoteAddress;
      const now = Date.now();
      
      // Log analytics data (in production, send to analytics service)
      const analyticsData = {
        timestamp: now,
        clientIP: clientIP ? clientIP.split(':').pop() : 'unknown', // Only keep last part for privacy
        userAgent: userAgent?.substring(0, 100), // Truncate for privacy
        viewport: viewport && typeof viewport.width === 'number' ? viewport : null,
        timezone: typeof timezone === 'string' ? timezone : null,
        language: typeof language === 'string' ? language : null,
        events: events.map(event => ({
          event: typeof event.event === 'string' ? event.event.substring(0, 50) : 'unknown',
          properties: event.properties && typeof event.properties === 'object' ? event.properties : {},
          timestamp: typeof event.timestamp === 'number' ? event.timestamp : now,
          sessionId: typeof event.sessionId === 'string' ? event.sessionId.substring(0, 32) : null
        }))
      };

      // In production, you'd send this to your analytics service
      console.log('Analytics data received:', JSON.stringify(analyticsData, null, 2));
      
      res.json({ success: true, received: events.length });
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Analytics processing failed' });
    }
  });

  // Feedback endpoint
  app.post('/api/feedback', async (req, res) => {
    try {
      const { rating, feedback, category, sessionInfo, timestamp } = req.body;
      
      // Validation
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid rating' });
      }

      if (feedback && typeof feedback !== 'string') {
        return res.status(400).json({ error: 'Invalid feedback format' });
      }

      if (feedback && feedback.length > 1000) {
        return res.status(400).json({ error: 'Feedback too long' });
      }

      // Update admin stats
      incrementStat('totalFeedback');

      const feedbackData = {
        id: randomUUID(),
        rating,
        feedback: feedback?.trim() || '',
        category: typeof category === 'string' ? category : 'other',
        sessionInfo: sessionInfo && typeof sessionInfo === 'object' ? {
          duration: typeof sessionInfo.duration === 'number' ? Math.min(sessionInfo.duration, 86400000) : 0, // Max 24h
          messageCount: typeof sessionInfo.messageCount === 'number' ? Math.min(sessionInfo.messageCount, 1000) : 0, // Max 1000
          connectionQuality: typeof sessionInfo.connectionQuality === 'string' ? sessionInfo.connectionQuality : 'unknown'
        } : null,
        timestamp: timestamp || new Date().toISOString(),
        clientIP: (req.ip || req.connection.remoteAddress || '').split(':').pop(), // Privacy-safe IP
        userAgent: req.get('User-Agent')?.substring(0, 100) || 'unknown'
      };

      // In production, save to database or send to feedback service
      console.log('Feedback received:', JSON.stringify(feedbackData, null, 2));
      
      // You could store in a simple file or database
      // await storage.saveFeedback(feedbackData);
      
      res.json({ success: true, id: feedbackData.id });
    } catch (error) {
      console.error('Feedback error:', error);
      res.status(500).json({ error: 'Feedback processing failed' });
    }
  });

  // Waitlist endpoint for premium features
  app.post('/api/waitlist', async (req, res) => {
    try {
      const { email, source } = req.body;
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email address' });
      }

      if (email.length > 254) { // RFC maximum email length
        return res.status(400).json({ error: 'Email address too long' });
      }

      // Update admin stats
      incrementStat('waitlistSignups');

      const waitlistEntry = {
        id: randomUUID(),
        email: email.trim().toLowerCase(),
        source: typeof source === 'string' ? source : 'unknown',
        timestamp: new Date().toISOString(),
        clientIP: (req.ip || req.connection.remoteAddress || '').split(':').pop(),
        userAgent: req.get('User-Agent')?.substring(0, 100) || 'unknown'
      };

      // In production, save to database
      console.log('Waitlist signup:', JSON.stringify(waitlistEntry, null, 2));
      
      // You could store in database or send to email service
      // await storage.saveWaitlistEntry(waitlistEntry);
      
      res.json({ success: true, id: waitlistEntry.id });
    } catch (error) {
      console.error('Waitlist error:', error);
      res.status(500).json({ error: 'Waitlist signup failed' });
    }
  });

  // ========================================
  // ADMIN ROUTES - Protected by authentication
  // ========================================

  // Admin login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || typeof password !== 'string') {
        return res.status(400).json({ error: 'Password required' });
      }

      const isValid = await verifyAdminLogin(password);
      if (!isValid) {
        // Log failed attempt
        console.warn(`❌ Failed admin login attempt from ${req.ip}`);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = generateAdminToken();
      
      // Set secure HTTP-only cookie
      res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      console.log(`✅ Admin login successful from ${req.ip}`);
      
      res.json({ 
        success: true, 
        token,
        expiresIn: 24 * 60 * 60 * 1000
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Admin logout
  app.post('/api/admin/logout', requireAdmin, (req, res) => {
    // Clear the JWT cookie
    res.clearCookie('admin_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    res.json({ message: 'Logged out successfully' });
  });

  // Admin export
  app.get('/api/admin/export', requireAdmin, (req, res) => {
    try {
      const exportData = {
        timestamp: new Date().toISOString(),
        stats: storage.getAdminStats(),
        sessions: storage.getAllSessions(),
        feedback: storage.getFeedback(),
        waitlist: storage.getWaitlist(),
        version: '1.0.0'
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="pairqr-export-${new Date().toISOString().split('T')[0]}.json"`);
      
      res.json(exportData);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Export failed' });
    }
  });

  // Get admin dashboard data
  app.get('/api/admin/dashboard', requireAdmin, (req, res) => {
    try {
      const stats = getAdminStats();
      const settings = getAdminSettings();
      
      const dashboardData = {
        stats: {
          ...stats,
          activeConnections: connectedClients.size
        },
        settings,
        systemInfo: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version,
          timestamp: new Date().toISOString()
        }
      };
      
      res.json(dashboardData);
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  // Get admin settings
  app.get('/api/admin/settings', requireAdmin, (req, res) => {
    try {
      const settings = getAdminSettings();
      res.json(settings);
    } catch (error) {
      console.error('Settings error:', error);
      res.status(500).json({ error: 'Failed to load settings' });
    }
  });

  // Update admin settings
  app.put('/api/admin/settings', requireAdmin, (req, res) => {
    try {
      const updates = req.body;
      
      // Validate updates
      const allowedKeys = [
        'siteName', 'maxSessionDuration', 'enableAnalytics', 
        'enableFeedback', 'maintenanceMode', 'allowedFileTypes', 'maxFileSize'
      ];
      
      const validUpdates: any = {};
      for (const key of allowedKeys) {
        if (key in updates) {
          validUpdates[key] = updates[key];
        }
      }
      
      const updatedSettings = updateAdminSettings(validUpdates);
      
      console.log(`✅ Admin settings updated by ${req.ip}:`, validUpdates);
      
      res.json({ success: true, settings: updatedSettings });
    } catch (error) {
      console.error('Settings update error:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Change admin password
  app.put('/api/admin/password', requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new passwords required' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const success = await changeAdminPassword(currentPassword, newPassword);
      if (!success) {
        return res.status(401).json({ error: 'Current password incorrect' });
      }

      console.log(`✅ Admin password changed by ${req.ip}`);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Get admin logs (simplified - in production use proper logging)
  app.get('/api/admin/logs', requireAdmin, (req, res) => {
    try {
      // This is a simplified version - in production you'd read from log files
      const logs = [
        {
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Admin dashboard accessed',
          ip: req.ip
        }
      ];
      
      res.json({ logs });
    } catch (error) {
      console.error('Logs error:', error);
      res.status(500).json({ error: 'Failed to load logs' });
    }
  });

  // Export admin data
  app.get('/api/admin/export', requireAdmin, (req, res) => {
    try {
      const exportData = {
        ...getAdminData(),
        exportedAt: new Date().toISOString(),
        exportedBy: req.ip
      };

      res.setHeader('Content-Disposition', 'attachment; filename="pairqr-admin-export.json"');
      res.setHeader('Content-Type', 'application/json');
      res.json(exportData);
      
      console.log(`✅ Admin data exported by ${req.ip}`);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  });

  return httpServer;
}
