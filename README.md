# InstantShare 🚀

InstantShare is a privacy-first, secure file and text sharing platform that enables instant peer-to-peer communication with military-grade encryption. No registration required, completely free to use.

## ✨ Features

- **🔒 End-to-End Encryption**: Military-grade AES-256-GCM encryption
- **⚡ Instant Transfer**: Direct P2P connection via WebRTC
- **🚫 No Registration**: Start sharing immediately, no accounts needed
- **🌐 Cross-Platform**: Works on any device with a modern browser
- **🎯 Simple QR Sharing**: One-scan connection between devices
- **♻️ Ephemeral Sessions**: Automatic session expiration, no data storage
- **📱 Progressive Web App**: Install like a native app
- **🔓 Open Source**: Transparent and auditable code

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/TitanSage02/InstantShare.git
cd InstantShare

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
InstantShare/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and libraries
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
├── server/                # Express backend
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── storage.ts        # Data storage layer
├── shared/               # Shared types and schemas
└── docs/                # Documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Security
HMAC_SECRET=your-secure-hmac-secret-key

# Session Configuration
SESSION_TTL_MINUTES=2

# Database (optional)
DATABASE_URL=your-database-url
```

### Build Configuration

The application uses Vite for building with optimizations:

- **Code Splitting**: Automatic vendor and component chunking
- **Tree Shaking**: Removes unused code
- **Minification**: Terser with console.log removal
- **Asset Optimization**: Inline small assets, optimize images

## 🌐 Deployment

### Docker

```bash
# Build Docker image
docker build -t instantshare .

# Run container
docker run -p 3000:3000 instantshare
```

### Vercel/Netlify

The app is configured for easy deployment to modern hosting platforms:

1. Connect your repository
2. Set environment variables
3. Deploy automatically

### Traditional Hosting

```bash
# Build for production
npm run build

# Copy dist/ folder to your server
# Configure reverse proxy (nginx/apache)
```

## 🔒 Security Features

- **End-to-End Encryption**: All data encrypted before transmission
- **Perfect Forward Secrecy**: Unique keys for each session
- **HMAC Signatures**: Tamper-proof session verification  
- **No Data Persistence**: Messages never stored on servers
- **WebRTC Direct Connection**: Bypasses server for data transfer
- **Content Security Policy**: Protects against XSS attacks

## 📊 Analytics & Privacy

InstantShare includes privacy-first analytics that:

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

- **Issues**: [GitHub Issues](https://github.com/TitanSage02/InstantShare/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TitanSage02/InstantShare/discussions)
- **Email**: support@instantshare.app

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- WebRTC for enabling peer-to-peer connections
- React and modern web technologies
- The open-source community

---

**InstantShare** - Share files instantly, securely, and privately. No registration required, always free.

Made with ❤️ for privacy and security.
