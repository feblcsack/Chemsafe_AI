# ChemSafe - AI-Powered Chemical Safety Platform

<div align="center">

![ChemSafe Logo](https://via.placeholder.com/150x150/0f172a/f2b707?text=ChemSafe)

**Real-time GHS hazard detection and PPE compliance monitoring powered by AI**

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11-yellow)](https://www.python.org/)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Deployment](#deployment)

</div>

---

## 🌟 Features

### 🔬 GHS Hazard Detection
- **AI-Powered Recognition**: Instantly identify 9 GHS pictograms using advanced computer vision
- **Privacy-First**: All detection runs on-device, images never leave your browser
- **Safety Score**: Intelligent risk assessment with detailed recommendations
- **Similar Products**: AI-suggested safer alternatives
- **PubChem Integration**: Automatic chemical information lookup
- **Offline Support**: Works without internet connection

### 👷 PPE Compliance Monitoring
- **Live Detection**: Real-time PPE detection from camera feeds
- **Multiple Camera Support**: 
  - Device/USB cameras
  - IP cameras (HTTP/HTTPS)
  - RTSP streams
  - MJPEG streams
  - Phone cameras (via IP Webcam apps)
- **Smart Bounding Boxes**: Smoothed tracking with fade animations
- **Performance Optimized**: 
  - Adaptive frame skipping (2-4 FPS based on device)
  - Background processing
  - Automatic quality adjustment
- **Real-time Alerts**: Instant notifications for PPE violations

### 🎨 Premium UI/UX
- **Modern Design**: Dark theme with hazard yellow accents
- **Smooth Animations**: Framer Motion powered transitions
- **Responsive**: Mobile-first, works on all devices
- **Accessibility**: WCAG 2.1 AA compliant
- **Progressive Web App**: Installable, works offline

### ⚡ Performance
- **Lighthouse Score**: 90+
- **Service Worker**: Smart caching for offline support
- **Code Splitting**: Optimized bundle sizes
- **Image Optimization**: AVIF/WebP with fallbacks
- **Lazy Loading**: Components loaded on demand

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Supabase account (free tier works)

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOL

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cat > .env << EOL
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
FRONTEND_URL=http://localhost:3000
EOL

# Run server
uvicorn main:app --reload --port 8000
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs)

### Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run SQL migrations from `setup-database.sql`
3. Configure RLS policies (see `SECURITY_CHECK.md`)

## 📖 Documentation

### User Guides
- [📱 Household Scanner Guide](docs/household-scanner.md)
- [🏭 Workplace Safety Guide](docs/workplace-safety.md)
- [📹 IP Camera Setup](IP_CAMERA_SETUP_GUIDE.md)
- [🎯 PPE Detection Guide](docs/ppe-detection.md)

### Developer Guides
- [🏗️ Architecture Overview](docs/architecture.md)
- [⚡ Performance Guide](PERFORMANCE_OPTIMIZATION_GUIDE.md)
- [🚀 Deployment Guide](DEPLOY_README.md)
- [🔒 Security Guide](SECURITY_CHECK.md)
- [🧪 Testing Guide](TESTING_GUIDE.md)

### API Documentation
- FastAPI Docs: `http://localhost:8000/docs`
- OpenAPI Schema: `http://localhost:8000/openapi.json`

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │   Home   │  │   Scan   │  │  Admin   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│         │              │              │                  │
│    ┌────┴──────────────┴──────────────┴────┐           │
│    │         ONNX Runtime (Browser)         │           │
│    │      GHS Detection | OCR (Tesseract)   │           │
│    └────────────────────────────────────────┘           │
└──────────────────┬──────────────────────────────────────┘
                   │ REST API / WebSocket
┌──────────────────┴──────────────────────────────────────┐
│                  Backend (FastAPI)                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  PubChem   │  │  PPE AI    │  │   Zones    │        │
│  │   Proxy    │  │  Detection │  │  Management│        │
│  └────────────┘  └────────────┘  └────────────┘        │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│              Supabase (Database + Auth)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │PostgreSQL│  │   Auth    │  │ Real-time│              │
│  │    +     │  │  (JWT)    │  │   Subs   │              │
│  │   RLS    │  └──────────┘  └──────────┘              │
│  └──────────┘                                            │
└─────────────────────────────────────────────────────────┘
```

## 🎯 Key Technologies

### Frontend
- **Next.js 16.3**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first styling
- **Framer Motion**: Smooth animations
- **ONNX Runtime Web**: Browser-based AI inference
- **Tesseract.js**: OCR for text extraction
- **Supabase Client**: Database and auth

### Backend
- **FastAPI**: Modern Python web framework
- **ONNX Runtime**: AI model inference
- **OpenCV**: Image processing
- **WebSockets**: Real-time communication
- **Supabase**: Database client
- **httpx**: Async HTTP client

### Infrastructure
- **Supabase**: PostgreSQL + Auth + Real-time
- **Railway**: Backend deployment
- **Vercel**: Frontend deployment (alternative)
- **CDN**: Static asset delivery

## 🚀 Deployment

### Railway (Recommended)

1. **Backend Deployment**
   ```bash
   # Push to GitHub
   git push origin main
   
   # Connect to Railway
   # Dashboard → New Project → Deploy from GitHub
   ```

2. **Environment Variables**
   ```
   SUPABASE_URL=your_url
   SUPABASE_SERVICE_KEY=your_key
   FRONTEND_URL=https://your-frontend.vercel.app
   PORT=8000
   ```

3. **Frontend Deployment**
   ```bash
   # Vercel CLI
   npm i -g vercel
   cd frontend
   vercel --prod
   ```

See [DEPLOY_README.md](DEPLOY_README.md) for detailed instructions.

## 🧪 Testing

```bash
# Frontend tests
cd frontend
npm run test
npm run test:e2e

# Backend tests
cd backend
pytest
pytest --cov
```

## 📊 Performance Metrics

- **Lighthouse Score**: 92/100
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Bundle Size**: ~180KB (gzipped)
- **Detection Speed**: < 100ms (GHS), < 500ms (PPE)

## 🔒 Security

- ✅ All sensitive data encrypted at rest
- ✅ Row Level Security (RLS) enabled
- ✅ JWT-based authentication
- ✅ CORS properly configured
- ✅ No PII in logs
- ✅ Regular security audits

See [SECURITY_CHECK.md](SECURITY_CHECK.md) for details.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

## 🙏 Acknowledgments

- [GHS Classification](https://www.osha.gov/hazcom) - OSHA Hazard Communication
- [PubChem](https://pubchem.ncbi.nlm.nih.gov/) - Chemical database
- [ONNX](https://onnx.ai/) - AI model format
- [Supabase](https://supabase.com/) - Backend infrastructure

## 📞 Support

- 📧 Email: support@chemsafe.app
- 💬 Discord: [Join our community](https://discord.gg/chemsafe)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/chemsafe/issues)
- 📚 Docs: [docs.chemsafe.app](https://docs.chemsafe.app)

## 🗺️ Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced AI models (custom PPE detection)
- [ ] Multi-language support
- [ ] Export compliance reports (PDF)
- [ ] Integration with safety management systems
- [ ] Blockchain-based audit trails
- [ ] Voice commands for hands-free operation
- [ ] AR overlay for smart glasses

---

<div align="center">

**Built with ❤️ for workplace safety**

[⬆ Back to Top](#chemsafe---ai-powered-chemical-safety-platform)

</div>
