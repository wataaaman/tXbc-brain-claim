# Tech X Brain Collective - Product Requirements Document

## Original Problem Statement
Build a Web3 DApp for the Tech X Brain Collective & Brain Injury Foundation (Alberta Launch). A decentralized "Healing Hub" leveraging Web3 transparency, AI, and neurofeedback for TBI recovery. Core blockchain: Flare Network.

## Architecture
- **Frontend**: React 19 with shadcn/ui components, Tailwind CSS (cyberpunk theme)
- **Backend**: FastAPI (Python) with async MongoDB (motor)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM integration (powering multi-agent system)
- **Storage**: IPFS via Pinata
- **Auth**: JWT + Google OAuth (Emergent Auth) + Email OTP + TOTP + Wallet Auth (MetaMask)
- **Web3**: ethers.js, wagmi, viem, @reown/appkit

## User Personas
1. **Injured Workers**: Primary users with TBI needing to navigate WCB claims
2. **Caregivers**: Family members assisting injured workers
3. **Advocates**: Legal/support professionals helping with claims

## Core Requirements
- Accessible design for users with cognitive challenges
- Large readable text, clear navigation
- Calming, professional aesthetic
- WCB policy reference (Group 1/Group 2 TBI)
- Letter generation with policy citations
- AI-powered assistance

## What's Been Implemented (Feb 28, 2026)

### Backend APIs
- [x] User authentication (JWT, sessions, cookies)
- [x] Google OAuth via Emergent Auth
- [x] Email OTP authentication (mocked)
- [x] TOTP 2FA setup/verify
- [x] Claims CRUD operations
- [x] Timeline events for claims
- [x] Evidence upload with REAL Pinata IPFS
- [x] AI chat with GPT-5.2
- [x] Letter generation (templates + AI)
- [x] PDF generation for letters (reportlab)
- [x] Comprehensive claim timeline API
- [x] Policy library with search
- [x] User settings persistence

### Frontend Pages
- [x] Landing page with TBI info + VideoAsk widget
- [x] Login/Register with multi-auth options
- [x] Dashboard with claim management
- [x] Policy Library with search
- [x] Document Generator (templates + AI + PDF export)
- [x] Evidence Manager with IPFS
- [x] AI Assistant chatbot
- [x] Claim Timeline visualization
- [x] Settings (theme, accent colors)

### Integrations
- [x] OpenEvidence medical platform link
- [x] VideoAsk widget for video help
- [x] Pinata IPFS for decentralized storage
- [x] OpenAI GPT-5.2 for AI features

### Design System
- [x] Warm Stone color palette
- [x] Manrope + Public Sans fonts
- [x] Light/Dark theme toggle
- [x] Orange/Green/Blue accent colors
- [x] Accessible button sizes (h-12)
- [x] Rounded corners (rounded-xl)

## Mocked Features
- **Email OTP**: Logs OTP to server console instead of sending email

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Embed actual VideoAsk form (user provides VideoAsk form ID)
- [ ] Real email service for OTP (SendGrid/Resend)

### P1 - Important
- [ ] Evidence file preview in browser
- [ ] Claim status updates via email notifications
- [ ] Export all claim data as bundle

### P2 - Nice to Have
- [ ] Biometric auth (WebAuthn)
- [ ] Blockchain storage for tamper-proof records
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## Next Tasks
1. Embed actual VideoAsk form when user provides form ID
2. Add real email sending service for OTP
3. Add evidence file preview functionality
4. Implement email notifications for claim status changes
