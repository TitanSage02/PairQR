# PairQR - Secure Instant Communication

> 🔒 Instant secure file and text sharing with QR code pairing

PairQR is a privacy-first communication platform that enables secure peer-to-peer messaging and file sharing through QR code pairing. Built with modern web technologies and end-to-end encryption.

## ✨ Features

- **� End-to-End Encryption**: All messages encrypted client-side
- **📱 QR Code Pairing**: Instant session creation via QR scanning
- **⚡ Real-time Communication**: WebRTC peer-to-peer messaging
- **🎯 Privacy-First**: No data persistence, ephemeral sessions
- **📁 File Sharing**: Secure file transfer between devices
- **👨‍💼 Admin Dashboard**: Comprehensive management interface
- **🌐 Cross-Platform**: Works on all modern browsers

## �️ Architecture

This project follows a clean separation between frontend and backend:

```
PairQR/
├── client/           # React + Vite Frontend
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── server/           # Express.js Backend
│   ├── admin.ts
│   ├── index.ts
│   ├── routes.ts
│   ├── storage.ts
│   ├── package.json
│   ├── drizzle.config.ts
│   └── tsconfig.json
├── shared/           # Shared TypeScript schemas
│   └── schema.ts
```

### 📱 Client (Frontend)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query
- **WebRTC**: Native browser APIs
- **QR Code**: jsqr library

### 🖥️ Server (Backend)
- **Runtime**: Node.js + Express
- **Database**: PostgreSQL with Drizzle ORM
- **WebSocket**: ws library for real-time communication
- **Authentication**: JWT for admin sessions
- **Security**: Helmet, CORS, Rate limiting

### 🔄 Shared
- **Schema Validation**: Zod schemas
- **Type Safety**: Shared TypeScript interfaces
## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL (for database features)
- npm or yarn



## 🔧 Configuration

### Client Configuration

The client uses Vite for building and development:
- `vite.config.ts` - Build configuration
- `tailwind.config.ts` - Styling configuration  
- `tsconfig.json` - TypeScript configuration

### Server Configuration

The server uses standard Node.js tooling:
- `drizzle.config.ts` - Database ORM configuration
- `tsconfig.json` - TypeScript configuration
- Environment variables for runtime configuration

## 🚢 Deployment

### Client Deployment (Vercel/Netlify)

```bash
cd client
npm run build
# Deploy the dist/ folder
```

### Server Deployment (Railway/Heroku/VPS)

```bash
cd server  
npm run build
# Deploy with npm start or PM2
```

### Docker Deployment

```dockerfile
# Example Dockerfile for server
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/ ./
COPY shared/ ./shared/
EXPOSE 9000
CMD ["npm", "start"]
```

## 🔒 Security

- **End-to-End Encryption**: Messages encrypted client-side before transmission
- **Ephemeral Sessions**: No persistent data storage by default
- **CORS Protection**: Configurable origin allowlists
- **Rate Limiting**: API protection against abuse
- **Secure Headers**: Helmet.js security headers
- **Input Validation**: Zod schema validation on all inputs

## 📈 Monitoring

### Built-in Analytics

- Session creation metrics
- Message throughput tracking  
- Error rate monitoring
- Admin dashboard with real-time stats

### Health Checks

- `GET /health` - Server health status
- `GET /api/health` - Detailed API health with metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes in the appropriate directory (`client/` or `server/`)
4. Run type checking: `npm run check`
5. Test your changes locally
6. Submit a pull request

### Development Guidelines

- Keep client and server completely separate
- Use shared schemas for data validation
- Follow TypeScript best practices
- Add appropriate error handling
- Update documentation for new features

## 📝 License

This project is open source. See the LICENSE file for details.

## � Links

- **Live Demo**: [pairqr.vercel.app](https://pairqr.vercel.app)
- **Repository**: [github.com/TitanSage02/PairQR](https://github.com/TitanSage02/PairQR)
- **Issues**: [GitHub Issues](https://github.com/TitanSage02/PairQR/issues)

---

Built with ❤️ for secure, privacy-first communication.
- **HMAC Signatures**: Tamper-proof session verification  
- **No Data Persistence**: Messages never stored on servers
- **WebRTC Direct Connection**: Bypasses server for data transfer
- **Content Security Policy**: Protects against XSS attacks

## 📊 Analytics & Privacy

PairQR includes privacy-first analytics that:

- ✅ Collects anonymous usage statistics
- ✅ Helps improve the product
- ✅ Respects user privacy (GDPR compliant)
- ❌ Never collects personal information
- ❌ Never stores messages or files
- ❌ Never tracks users across sessions

Users can opt-out of analytics at any time.

## 🛠 Development

### Local Development

```bash
# Start development servers
npm run dev

# Run type checking
npm run check

# Build for production
npm run build
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📈 Roadmap

### Current (Free Forever)
- ✅ Text sharing
- ✅ Basic file transfer
- ✅ QR code connections
- ✅ End-to-end encryption

### Coming Soon (Premium)
- 🔄 Team collaboration spaces
- 🔄 Faster transfer speeds
- 🔄 Advanced security features
- 🔄 File expiration controls
- 🔄 Custom branding
- 🔄 Usage analytics

## 🤝 Support

- **Issues**: [GitHub Issues](https://github.com/TitanSage02/PairQR/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TitanSage02/PairQR/discussions)
- **Email**: support@PairQR.app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WebRTC for enabling peer-to-peer connections
- React and modern web technologies
- The open-source community

---

**PairQR** - Share files instantly, securely, and privately. No registration required, always free.

Made with ❤️ for privacy and security.
