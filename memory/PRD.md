# NeuroClaim Support - Product Requirements Document

## Original Problem Statement
Build an app for injured workers to support their needs related to Alberta Workers' Compensation Board (WCB) claims for traumatic brain injury (TBI). The app provides policy reference, document generation, claim tracking, AI assistance, and evidence management.

## Architecture
- **Frontend**: React 19 with shadcn/ui components, Tailwind CSS
- **Backend**: FastAPI (Python) with async MongoDB (motor)
- **Database**: MongoDB
- **AI**: OpenAI GPT-5.2 via Emergent LLM integration
- **Storage**: IPFS via Pinata (MOCKED for MVP)
- **Auth**: JWT + Google OAuth (Emergent Auth) + Email OTP + TOTP

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
- [x] Evidence upload (IPFS mocked)
- [x] AI chat with GPT-5.2
- [x] Letter generation (templates + AI)
- [x] Policy library with search
- [x] User settings persistence

### Frontend Pages
- [x] Landing page with TBI info
- [x] Login/Register with multi-auth options
- [x] Dashboard with claim management
- [x] Policy Library with search
- [x] Document Generator (templates + AI)
- [x] Evidence Manager
- [x] AI Assistant chatbot
- [x] Settings (theme, accent colors)

### Design System
- [x] Warm Stone color palette
- [x] Manrope + Public Sans fonts
- [x] Light/Dark theme toggle
- [x] Orange/Green/Blue accent colors
- [x] Accessible button sizes (h-12)
- [x] Rounded corners (rounded-xl)

## Mocked Features
- **IPFS Storage**: Generates fake CIDs, metadata stored in MongoDB
- **Email OTP**: Logs OTP to server console instead of sending email

## Prioritized Backlog

### P0 - Critical (Next Sprint)
- [ ] Real Pinata IPFS integration (user provides API key)
- [ ] Real email service for OTP (SendGrid/Resend)
- [ ] VideoAsk widget embed for welcome video

### P1 - Important
- [ ] Claim timeline visualization
- [ ] Evidence file preview
- [ ] Letter export to PDF
- [ ] OpenEvidence integration for medical research

### P2 - Nice to Have
- [ ] Biometric auth (WebAuthn)
- [ ] Decentralized storage on blockchain
- [ ] Multi-language support
- [ ] Mobile app (React Native)

## Next Tasks
1. Add real Pinata integration when user provides API key
2. Implement VideoAsk embed widget
3. Add claim timeline visualization component
4. Integrate OpenEvidence medical platform link
5. Add PDF export for generated letters
