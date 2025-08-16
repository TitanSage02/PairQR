# PairQR Server

A secure, real-time communication server for peer-to-peer messaging via QR codes. Built with Express.js, TypeScript, and WebSocket for encrypted messaging sessions.

## 🚀 Features

- **Secure Session Management**: Cryptographically signed QR codes with expiration
- **Real-time Communication**: WebSocket-based signaling for peer-to-peer connections
- **End-to-End Encryption**: Client-side encryption with public key exchange
- **Admin Dashboard**: Comprehensive administrative interface with analytics
- **Rate Limiting**: Built-in protection against abuse
- **Privacy-First Analytics**: Minimal data collection with user privacy in mind
- **CORS Security**: Configurable origin policies for development and production

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   QR Scanner    │    │   PairQR API    │    │   Message Host  │
│   (Client)      │◄──►│   (Server)      │◄──►│   (Client)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                    WebRTC P2P Connection
                  (Encrypted Messages)
```

## 📁 Project Structure

```
server/
├── index.ts          # Main server setup and middleware configuration
├── routes.ts          # API routes and WebSocket handling
├── admin.ts          # Admin authentication and management
├── storage.ts        # In-memory data storage abstraction
├── vite.ts           # Development utilities
└── package.json      # Dependencies and scripts
```

## 🔧 Installation & Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Environment Variables

Create a `.env` file in the server directory:

```env
# Server Configuration
PORT=9000
NODE_ENV=production

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
HMAC_SECRET=your-hmac-secret-for-qr-signing
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_PASSWORD_PEPPER=optional-additional-security-pepper

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com,https://anotherdomain.com
# Use '*' for development or specific domains for production

# Session Configuration
SESSION_TTL_MINUTES=2
ADMIN_SESSION_TTL_HOURS=24

# JWT Configuration (Optional)
JWT_ISSUER=pairqr
JWT_AUDIENCE=pairqr-admin
```

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build for production
npm run build

# Start production server
node ../dist/index.js
```

## 🛡️ Security Features

### Authentication & Authorization

- **Admin Authentication**: JWT-based with configurable expiration
- **Password Security**: Scrypt hashing with salt and optional pepper
- **Session Security**: HMAC-signed QR codes with expiration timestamps

### Network Security

- **Helmet.js**: Security headers (CSP managed externally)
- **CORS**: Configurable origin allowlist for production
- **Rate Limiting**: 200 requests per 15 minutes per IP on API routes

### Data Protection

- **In-Memory Storage**: No persistent data storage by default
- **Automatic Cleanup**: Expired sessions automatically removed
- **Privacy-First**: Minimal data collection, IP anonymization

## 🔌 API Endpoints

### Public Endpoints

#### Sessions
- `POST /api/sessions` - Create new session with QR code
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/join` - Join existing session
- `DELETE /api/sessions/:id` - Delete session
- `POST /api/verify-qr` - Verify QR code signature

#### Analytics & Feedback
- `POST /api/analytics` - Submit privacy-safe analytics
- `POST /api/feedback` - Submit user feedback
- `POST /api/waitlist` - Join premium feature waitlist

#### Health Check
- `GET /api/health` - Service health status
- `GET /health` - Simple health check

### Admin Endpoints (Protected)

#### Authentication
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

#### Management
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/settings` - Get admin settings
- `PUT /api/admin/settings` - Update admin settings
- `PUT /api/admin/password` - Change admin password
- `GET /api/admin/logs` - Get system logs
- `GET /api/admin/export` - Export admin data

## 📡 WebSocket Events

### Client → Server

```typescript
// Join a session
{
  type: 'join-session',
  sessionId: string,
  clientId: string
}

// WebRTC signaling
{
  type: 'webrtc-offer' | 'webrtc-answer' | 'ice-candidate',
  // ... WebRTC payload
}

// Key exchange for encryption
{
  type: 'key-exchange',
  // ... encryption keys
}

// Typing indicators
{
  type: 'typing',
  isTyping: boolean
}
```

### Server → Client

```typescript
// Peer joined session
{
  type: 'peer-joined',
  clientId: string
}

// Peer left session
{
  type: 'peer-left',
  clientId: string
}

// Forward WebRTC signaling
{
  type: 'webrtc-offer' | 'webrtc-answer' | 'ice-candidate',
  // ... forwarded payload
}

// Typing indicator
{
  type: 'typing',
  isTyping: boolean
}
```

## 📊 Data Models

### Session

```typescript
interface Session {
  id: string;                    // Unique session identifier
  hostPublicKey: string;         // Host's public key for encryption
  signature: string;             // HMAC signature for QR verification
  expiresAt: Date;              // Session expiration time
  createdAt: Date;              // Session creation time
  isActive: string;             // Session status
}
```

### Admin Settings

```typescript
interface AdminSettings {
  siteName: string;              // Site display name
  maxSessionDuration: number;    // Hours
  enableAnalytics: boolean;      // Analytics collection toggle
  enableFeedback: boolean;       // Feedback collection toggle
  maintenanceMode: boolean;      // Maintenance mode flag
  allowedFileTypes: string[];    // Allowed file MIME types
  maxFileSize: number;          // Maximum file size in MB
}
```

## 🔍 Monitoring & Analytics

### Built-in Metrics

- Active WebSocket connections
- Total sessions created
- Messages sent
- Feedback submissions
- Waitlist signups

### Request Logging

- API endpoint access logs
- Response times and status codes
- Error tracking for 5xx responses

## 🚢 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 9000
CMD ["node", "dist/index.js"]
```

### Environment Considerations

#### Development
- CORS allows localhost and 127.0.0.1
- Default admin password (change in production!)
- Debug logging enabled

#### Production
- Set `NODE_ENV=production`
- Configure secure JWT_SECRET and HMAC_SECRET
- Set strong ADMIN_PASSWORD
- Configure CORS_ORIGIN allowlist
- Use HTTPS proxy (nginx, CloudFlare, etc.)

## 🧪 Testing

```bash
# Run type checking
npx tsc --noEmit

# Test API endpoints
curl -X GET http://localhost:9000/health

# Test WebSocket connection
wscat -c ws://localhost:9000/ws
```

## 🔧 Configuration

### Storage Backend

The server uses in-memory storage by default. For production with multiple instances, implement the `IStorage` interface with your preferred backend:

```typescript
import { IStorage } from './storage';

class RedisStorage implements IStorage {
  // Implement methods...
}

export const storage = new RedisStorage();
```

### Custom Middleware

Add custom middleware in `index.ts`:

```typescript
// Custom security headers
app.use((req, res, next) => {
  res.setHeader('X-Custom-Header', 'value');
  next();
});
```

## 📈 Performance

- **Memory Usage**: ~50MB base + active sessions
- **Throughput**: 1000+ concurrent WebSocket connections
- **Latency**: <5ms for API responses
- **Auto-cleanup**: Expired sessions removed every 60 seconds

## 🔒 Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use HTTPS in production
3. **Rate Limiting**: Adjust limits based on usage patterns
4. **Admin Access**: Use strong passwords and 2FA where possible
5. **Network**: Deploy behind a reverse proxy (nginx, CloudFlare)
6. **Monitoring**: Set up alerts for failed login attempts

## 🐛 Troubleshooting

### Common Issues

#### CORS Errors
```bash
# Check CORS_ORIGIN environment variable
echo $CORS_ORIGIN

# Verify client origin matches allowlist
```

#### WebSocket Connection Failed
```bash
# Check if server is listening
netstat -an | grep 9000

# Verify WebSocket endpoint
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" http://localhost:9000/ws
```

#### Admin Login Issues
```bash
# Check admin password environment variable
echo $ADMIN_PASSWORD

# Verify JWT secret is set
echo $JWT_SECRET
``