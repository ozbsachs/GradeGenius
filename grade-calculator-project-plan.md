# GradeGenius - AI-Powered Grade Calculator Web App
## Project Plan & Technical Specification

---

## Executive Summary

**Product:** Web application that analyzes Canvas (and other LMS) grade screenshots using AI to provide grade calculations, predictions, and interactive chat-based analysis.

**Target Users:** College students (primarily .edu email holders)

**Core Value Proposition:** Zero manual data entry - screenshot your grades, get instant AI-powered analysis and "what-if" scenario planning.

**Monetization:** Freemium model with 3 free screenshot uploads, then either one-time purchase or queue system with paid skip-the-line option.

---

## Product Features

### Core Functionality

#### 1. Screenshot Upload & Analysis
- **Input:** Canvas grades page screenshot (PNG, JPG, WebP)
- **AI Processing:** Claude API extracts:
  - Assignment names and categories
  - Current scores and point values
  - Category weights and grading schemes
  - Due dates and completion status
  - Extra credit opportunities
  - Dropped assignment policies
- **Output:** Structured grade data with current standing

#### 2. Grade Calculations
- Current overall grade percentage
- Letter grade based on standard/custom scales
- Grade needed on remaining assignments for target grade (A, B, C, etc.)
- Impact analysis: "What if I skip this assignment?"
- Best/worst case scenario projections
- Category-by-category performance breakdown

#### 3. Interactive AI Chat
Natural language queries like:
- "What do I need on the final to get an A?"
- "Can I skip homework 5 and still get a B?"
- "Which assignments should I prioritize?"
- "What's my grade if I get 85% on everything left?"
- "Roast my grade" (fun engagement feature)

#### 4. Multi-Class Management
- Dashboard view of all classes
- Comparative analysis: "Which class needs most attention?"
- Overall GPA calculator
- Finals week priority ranker

#### 5. Smart Features
- **Trend Analysis:** "You're trending toward a B+ based on current performance"
- **Study Recommendations:** AI suggests where to focus effort for maximum grade impact
- **Deadline Awareness:** Highlights upcoming high-impact assignments
- **Screenshot History:** Re-upload updated grades to track progress

---

## Technical Architecture

### Frontend (React + TypeScript)

#### Tech Stack
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand or Redux Toolkit
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod validation
- **HTTP Client:** Axios with interceptors
- **Image Handling:** React Dropzone

#### Security Measures
- Content Security Policy (CSP) headers
- XSS prevention via React's built-in escaping
- HTTPS-only in production
- Secure credential storage (HttpOnly cookies)
- Input sanitization on all user data
- Rate limiting on client side
- No sensitive data in localStorage (use sessionStorage or memory only)

#### Key Pages
1. **Landing Page:** Value proposition, demo video, pricing
2. **Login/Signup:** Google OAuth integration
3. **Dashboard:** Class overview, upload new screenshot
4. **Class Detail:** Individual class analysis and chat
5. **Settings:** Account management, billing, data export
6. **Admin Dashboard:** (separate route) User analytics, moderation

### Backend (Node.js + Express)

#### Tech Stack
- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL 15+ (via Supabase or Railway)
- **ORM:** Prisma
- **Authentication:** Passport.js with Google OAuth 2.0
- **File Storage:** AWS S3 or Cloudflare R2 (encrypted at rest)
- **API Security:** Helmet.js, express-rate-limit, cors
- **Logging:** Winston + structured logging
- **Monitoring:** Sentry for error tracking

#### API Endpoints

```
Authentication:
POST   /api/auth/google              - Initiate Google OAuth
GET    /api/auth/google/callback     - OAuth callback
POST   /api/auth/logout              - End session
GET    /api/auth/me                  - Get current user

Screenshot Upload:
POST   /api/screenshots/upload       - Upload and analyze screenshot
GET    /api/screenshots/:id          - Retrieve analysis
DELETE /api/screenshots/:id          - Delete screenshot

Grades:
GET    /api/grades/classes           - List all user's classes
GET    /api/grades/classes/:id       - Get class details
PUT    /api/grades/classes/:id       - Update class data
DELETE /api/grades/classes/:id       - Delete class

Chat:
POST   /api/chat                     - Send message, get AI response
GET    /api/chat/history/:classId    - Retrieve chat history

User Management:
GET    /api/user/profile             - Get user profile
PUT    /api/user/profile             - Update profile
GET    /api/user/usage               - Get upload quota status
DELETE /api/user/account             - Delete account (GDPR)

Payments:
POST   /api/payments/create-checkout - Create Stripe checkout session
POST   /api/payments/webhook         - Stripe webhook handler
GET    /api/payments/status          - Check payment status

Queue (if implemented):
GET    /api/queue/position           - Get current queue position
POST   /api/queue/skip               - Pay to skip queue

Admin (protected):
GET    /api/admin/users              - List users (paginated)
GET    /api/admin/analytics          - Usage statistics
PUT    /api/admin/users/:id/quota    - Adjust user quota
```

#### Security Implementation

**Authentication & Authorization:**
- Google OAuth 2.0 (no password storage)
- JWT tokens stored in HttpOnly, Secure, SameSite cookies
- CSRF protection via double-submit cookie pattern
- Session expiration (7 days, configurable)
- Email verification for .edu addresses (bonus credit or priority)

**Data Protection:**
- All passwords hashed with bcrypt (if fallback auth implemented)
- Database encryption at rest (PostgreSQL native encryption)
- TLS 1.3 for all connections
- Environment variables for secrets (never committed)
- Screenshot images encrypted before S3 storage
- Automatic PII redaction (student IDs, emails in screenshots)

**API Security:**
- Rate limiting: 100 req/15min per IP, 500 req/15min per user
- Request size limits (10MB max for screenshots)
- CORS whitelist (only production domains)
- Helmet.js security headers
- SQL injection prevention (Prisma parameterized queries)
- NoSQL injection prevention (input validation)
- File upload validation (magic number checking, not just extensions)

**Compliance:**
- **GDPR:** Data export, right to deletion, consent tracking
- **FERPA:** No sharing of educational records without consent
- **COPPA:** Age verification (13+ requirement)
- Privacy Policy and Terms of Service
- Cookie consent banner (EU users)
- Audit logging for admin actions

**Vulnerability Prevention:**
- Dependency scanning (npm audit, Snyk)
- Automated security updates (Dependabot)
- Regular penetration testing
- Bug bounty program (after launch)
- Input validation with Zod schemas
- Output encoding to prevent XSS
- Subdomain takeover prevention

### Database Schema (Prisma)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified Boolean   @default(false)
  name          String?
  avatarUrl     String?
  googleId      String?   @unique
  
  uploadQuota   Int       @default(3)  // Free tier
  isPremium     Boolean   @default(false)
  premiumExpiry DateTime?
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLoginAt   DateTime?
  
  classes       Class[]
  screenshots   Screenshot[]
  chatMessages  ChatMessage[]
  payments      Payment[]
  
  @@index([email])
  @@index([googleId])
}

model Class {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name            String
  instructor      String?
  semester        String?
  color           String?   // For UI personalization
  
  currentGrade    Float?
  targetGrade     String?   // "A", "B", etc.
  
  gradingScheme   Json      // { "A": 90, "B": 80, ... }
  categories      Json      // Weights, drop policies
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  screenshots     Screenshot[]
  chatMessages    ChatMessage[]
  
  @@index([userId])
}

model Screenshot {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  classId         String?
  class           Class?    @relation(fields: [classId], references: [id], onDelete: SetNull)
  
  imageUrl        String    // S3/R2 URL (encrypted)
  thumbnailUrl    String?
  
  analysisStatus  String    @default("pending") // pending, processing, completed, failed
  extractedData   Json?     // AI-extracted grade data
  errorMessage    String?
  
  createdAt       DateTime  @default(now())
  processedAt     DateTime?
  
  @@index([userId])
  @@index([classId])
  @@index([analysisStatus])
}

model ChatMessage {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  classId         String
  class           Class     @relation(fields: [classId], references: [id], onDelete: Cascade)
  
  role            String    // "user" or "assistant"
  content         String    @db.Text
  
  createdAt       DateTime  @default(now())
  
  @@index([userId])
  @@index([classId])
}

model Payment {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  stripeSessionId String    @unique
  amount          Int       // in cents
  status          String    // pending, completed, failed, refunded
  productType     String    // "one_time_unlimited", "skip_queue"
  
  createdAt       DateTime  @default(now())
  completedAt     DateTime?
  
  @@index([userId])
  @@index([stripeSessionId])
}

model QueueEntry {
  id              String    @id @default(cuid())
  userId          String
  screenshotId    String    @unique
  
  position        Int
  status          String    @default("waiting") // waiting, processing, completed
  
  createdAt       DateTime  @default(now())
  startedAt       DateTime?
  completedAt     DateTime?
  
  @@index([status, position])
}
```

### AI Integration (Claude API)

#### Screenshot Analysis Flow
1. User uploads screenshot → stored in S3
2. Backend fetches image from S3
3. Convert to base64
4. Send to Claude API with specialized prompt:
   ```
   Extract all grade information from this Canvas screenshot.
   Return JSON with: assignments, categories, weights, current scores, point values, grading scale.
   ```
5. Parse Claude's JSON response
6. Validate and store in database
7. Return structured data to frontend

#### Chat Interface
- Maintain conversation context (last 10 messages)
- Include class grade data in system prompt
- Claude generates responses with grade calculations
- Stream responses for better UX
- Rate limit: 20 messages per class per day (prevent abuse)

#### Cost Optimization
- Use Claude Haiku for simple extractions (cheaper)
- Use Claude Sonnet for complex chat queries
- Cache frequently asked questions
- Batch processing during off-peak hours

---

## Monetization Strategy

### Freemium Model

**Free Tier:**
- 3 screenshot uploads per semester
- Basic grade calculations
- Limited chat (5 questions per class)
- Email support

**Premium Options:**

#### Option A: One-Time Purchase
- **$9.99 one-time** - Unlimited uploads for current semester
- All features unlocked
- Priority processing (no queue)
- Unlimited AI chat
- Multi-semester history

#### Option B: Queue + Skip
- **Free users:** Join processing queue (5-10 min wait)
- **$2.99 per skip:** Instant processing
- **$7.99 unlimited:** Skip all queues for semester

**Recommendation:** Start with Option A (simpler), add Option B if queue becomes selling point.

### Payment Integration (Stripe)

**Implementation:**
- Stripe Checkout for one-time payments
- Webhook handling for payment confirmation
- Automatic quota updates upon successful payment
- Refund handling (7-day window)
- Receipt generation via email

**Security:**
- Never store credit card numbers
- Use Stripe's PCI-compliant hosted checkout
- Verify webhook signatures
- Log all payment events

---

## User Authentication Flow

### Google OAuth 2.0 Integration

**Why Google OAuth:**
- Students already have .edu Google accounts
- No password management (security benefit)
- Faster signup/login
- Trusted by users

**Implementation Steps:**

1. **Frontend Initiates:**
   ```javascript
   // User clicks "Sign in with Google"
   window.location.href = `${API_URL}/api/auth/google`
   ```

2. **Backend Redirects to Google:**
   ```javascript
   passport.authenticate('google', {
     scope: ['profile', 'email'],
     hd: '*.edu' // Optional: restrict to .edu domains
   })
   ```

3. **Google Callback:**
   ```javascript
   // Google redirects back to /api/auth/google/callback
   // Backend exchanges code for user profile
   // Create or update user in database
   // Generate JWT token
   // Set HttpOnly cookie
   // Redirect to dashboard
   ```

4. **Session Management:**
   - JWT stored in HttpOnly cookie (7-day expiry)
   - Refresh token mechanism for extended sessions
   - Automatic logout on token expiration

**Security Considerations:**
- Validate `hd` parameter to ensure .edu domains (optional bonus)
- Check for email verification status
- Implement rate limiting on auth endpoints
- Log all authentication events
- Monitor for suspicious login patterns

---

## Admin Dashboard

### Features for You (Admin)

**User Management:**
- View all registered users (paginated table)
- Search by email, name, registration date
- View user's upload quota and premium status
- Manually adjust quotas (for support cases)
- Ban/suspend abusive users
- Export user data (GDPR compliance)

**Analytics:**
- Total users, daily/weekly/monthly active users
- Screenshot upload volume and processing success rate
- Revenue tracking (payments, conversions)
- Most common grade queries
- Error rates and common failure points
- Server resource usage

**Content Moderation:**
- Flag and review reported screenshots
- Delete inappropriate content
- View AI extraction errors for debugging

**System Health:**
- API response times
- Database query performance
- S3 storage usage
- Claude API cost tracking
- Uptime monitoring

**Tools:**
- Send email announcements to users
- Create promotional codes
- Adjust pricing/quotas globally
- View and respond to support tickets

### Admin Authentication
- Separate admin login (not through Google OAuth)
- 2FA required (TOTP via Google Authenticator app)
- Admin actions logged with timestamps
- IP whitelist for admin access (optional)

---

## Security Compliance Checklist

### OWASP Top 10 Mitigation

- [x] **Injection:** Prisma ORM prevents SQL injection
- [x] **Broken Authentication:** Google OAuth, JWT, session management
- [x] **Sensitive Data Exposure:** Encryption at rest/transit, no plaintext secrets
- [x] **XML External Entities:** N/A (no XML parsing)
- [x] **Broken Access Control:** Role-based permissions, user isolation
- [x] **Security Misconfiguration:** Helmet.js, secure headers, minimal attack surface
- [x] **XSS:** React escaping, CSP headers, input sanitization
- [x] **Insecure Deserialization:** Validate all JSON, use Zod schemas
- [x] **Using Components with Known Vulnerabilities:** Automated dependency scanning
- [x] **Insufficient Logging:** Winston logging, audit trail

### Privacy Regulations

**GDPR (European Users):**
- Cookie consent banner
- Privacy policy with data usage clarity
- Right to access (data export endpoint)
- Right to deletion (account deletion endpoint)
- Data retention policy (auto-delete after 2 years of inactivity)
- Consent tracking for email communications

**FERPA (US Educational Records):**
- No sharing of student data with third parties
- No selling of user data
- Clear privacy policy explaining data usage
- Parent/guardian access for users under 18 (if applicable)

**COPPA (Children's Privacy):**
- Age gate: require users to be 13+
- Terms of Service prohibit use by children under 13

---

## Development Roadmap

### Phase 1: MVP (Weeks 1-2)
- [ ] Set up project structure (frontend + backend repos)
- [ ] Implement Google OAuth login
- [ ] Build screenshot upload UI
- [ ] Integrate Claude API for screenshot analysis
- [ ] Create basic grade calculation logic
- [ ] Simple dashboard showing current grade
- [ ] Deploy to staging environment

### Phase 2: Core Features (Weeks 3-4)
- [ ] Multi-class management
- [ ] Interactive AI chat interface
- [ ] "What if" scenario calculations
- [ ] Stripe payment integration
- [ ] Free tier quota enforcement
- [ ] Email notifications (welcome, quota limit)

### Phase 3: Polish & Launch Prep (Week 5)
- [ ] Responsive mobile design
- [ ] Loading states and error handling
- [ ] Onboarding tutorial
- [ ] Privacy policy and Terms of Service
- [ ] Security audit and penetration testing
- [ ] Performance optimization
- [ ] Beta testing with 10-20 students

### Phase 4: Launch (Week 6)
- [ ] Deploy to production
- [ ] Set up monitoring (Sentry, uptime checks)
- [ ] Launch marketing campaign (Reddit, TikTok, campus groups)
- [ ] Monitor for bugs and user feedback
- [ ] Implement analytics tracking

### Phase 5: Post-Launch (Ongoing)
- [ ] Build admin dashboard
- [ ] Add support for other LMS platforms (Blackboard, Moodle)
- [ ] Implement queue system (if needed)
- [ ] Mobile app (React Native)
- [ ] Advanced features (GPA tracking, transcript analysis)

---

## Technology Stack Summary

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React + TypeScript + Vite | Fast, type-safe, modern developer experience |
| **Styling** | Tailwind CSS | Rapid UI development, consistent design |
| **Backend** | Node.js + Express + TypeScript | JavaScript everywhere, large ecosystem |
| **Database** | PostgreSQL + Prisma | Robust, relational, great TypeScript support |
| **Authentication** | Passport.js + Google OAuth | Secure, trusted, no password management |
| **File Storage** | AWS S3 / Cloudflare R2 | Scalable, cheap, encrypted |
| **AI** | Claude API (Anthropic) | Best-in-class vision + reasoning |
| **Payments** | Stripe | Industry standard, easy integration |
| **Hosting** | Vercel (frontend) + Railway (backend) | Easy deployment, auto-scaling |
| **Monitoring** | Sentry + Logtail | Error tracking, structured logging |

---

## Cost Estimation

### Development Costs
- **Your time:** Free (building yourself)
- **Claude Code:** Free (already have access)

### Monthly Operating Costs (at scale)

| Service | Cost (100 users) | Cost (1,000 users) | Cost (10,000 users) |
|---------|------------------|--------------------|--------------------|
| **Hosting (Railway)** | $5 | $20 | $100 |
| **Database (Supabase/Railway)** | $0 (free tier) | $25 | $100 |
| **S3 Storage** | $1 | $5 | $50 |
| **Claude API** | $10 | $100 | $1,000 |
| **Stripe Fees** | ~3% of revenue | ~3% of revenue | ~3% of revenue |
| **Total** | **~$16** | **~$150** | **~$1,250** |

### Revenue Projections (10% conversion to paid)

| Users | Paid Users | Revenue (@ $9.99) | Profit |
|-------|-----------|-------------------|--------|
| 100 | 10 | $100/mo | $84/mo |
| 1,000 | 100 | $1,000/mo | $850/mo |
| 10,000 | 1,000 | $10,000/mo | $8,750/mo |

*Note: One-time purchase model means revenue concentrates during launch and semester starts.*

---

## Marketing & Distribution

### Launch Strategy

**Week 1: Campus Validation**
- Share with your M211 and C241 classmates
- Post in class GroupMe/Discord servers
- Offer free premium for early feedback

**Week 2-3: Reddit & Forums**
- r/college, r/gradeschool, r/universityofindiana
- College Confidential forums
- Product Hunt launch (get upvotes from friends)

**Week 4+: Viral Content**
- TikTok: "POV: You find out you can skip the final" (demo video)
- Instagram Reels: Before/after grade panic
- Twitter: Share funny AI roasts of grades
- YouTube Shorts: Tutorial videos

**Referral Program:**
- Give 3 extra free uploads for each referral signup
- Leaderboard of top referrers (gamification)

### SEO Keywords
- "canvas grade calculator"
- "what do I need on my final"
- "college grade predictor"
- "AI grade calculator"
- "screenshot grade analyzer"

---

## Risk Mitigation

### Technical Risks
- **Claude API downtime:** Implement retry logic, fallback to cached responses
- **Screenshot quality issues:** Provide upload guidelines, AI validation step
- **Database performance:** Implement caching (Redis), query optimization
- **Security breach:** Regular audits, bug bounty, insurance

### Business Risks
- **Low conversion:** A/B test pricing, add more free value
- **High Claude API costs:** Implement rate limits, optimize prompts, cache common queries
- **Competition:** Focus on speed and UX, add unique features (roast mode)
- **Platform changes (Canvas):** Monitor UI updates, adapt prompts

### Legal Risks
- **Terms of Service violations (Canvas):** Ensure users own their data, consult lawyer
- **Student privacy concerns:** Clear privacy policy, no data selling, FERPA compliance
- **Copyright (screenshots):** Users upload their own grades (fair use)

---

## Success Metrics

### Week 1
- [ ] 50 signups
- [ ] 100 screenshots analyzed
- [ ] 5 paying customers
- [ ] <5% error rate on extractions

### Month 1
- [ ] 500 signups
- [ ] 1,000 screenshots analyzed
- [ ] 50 paying customers ($500 revenue)
- [ ] 4.5+ star rating (user feedback)

### Month 3
- [ ] 2,000 signups
- [ ] 5,000+ screenshots analyzed
- [ ] 200 paying customers ($2,000 revenue)
- [ ] Expand to 3 more universities

---

## Next Steps

1. **Validate concept:** Show this plan to 5 classmates, get feedback
2. **Set up development environment:** GitHub repos, local database
3. **Build authentication:** Google OAuth working end-to-end
4. **Create screenshot upload + AI analysis:** Core feature proof-of-concept
5. **Test with real Canvas screenshots:** Your M211 and C241 grades
6. **Iterate based on your own usage:** Fix pain points before sharing
7. **Soft launch to classmates:** Get 10-20 beta users
8. **Implement payments:** Stripe integration
9. **Public launch:** Reddit, TikTok, campus groups
10. **Scale and optimize:** Based on user feedback and metrics

---

## Contact & Support

**Founder/Admin:** Oz
**Support Email:** support@gradegenius.app (set up via Gmail)
**Bug Reports:** GitHub Issues (private repo)
**Feature Requests:** Feedback form in app

---

*Last Updated: February 2026*
*Version: 1.0*
