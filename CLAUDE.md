# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GradeGenius is an AI-powered web app that analyzes Canvas grade screenshots to provide grade calculations, predictions, and interactive chat-based analysis. Target users are college students with .edu emails.

## Tech Stack

### Frontend
- React 18 + TypeScript + Vite
- Tailwind CSS
- Zustand or Redux Toolkit for state
- React Router v6
- React Hook Form + Zod validation
- React Dropzone for image uploads

### Backend
- Node.js 20+ with Express.js + TypeScript
- PostgreSQL 15+ with Prisma ORM
- Passport.js with Google OAuth 2.0
- AWS S3 or Cloudflare R2 for file storage
- Stripe for payments

### AI Integration
- Claude API for screenshot analysis and chat
- Use Claude Haiku for simple extractions, Sonnet for complex queries
- Stream chat responses for better UX

## Architecture

### Core Flow
1. User uploads Canvas grade screenshot
2. Image stored in S3 (encrypted)
3. Claude API extracts grade data as structured JSON
4. Data stored in PostgreSQL, returned to frontend
5. User can chat with AI about their grades

### Key Database Models
- User (with upload quota, premium status)
- Class (grades, categories, grading scheme as JSON)
- Screenshot (analysis status, extracted data)
- ChatMessage (conversation history per class)
- Payment (Stripe integration)

### Authentication
- Google OAuth 2.0 only (no password storage)
- JWT in HttpOnly cookies (7-day expiry)
- Optional .edu domain restriction

## Monetization
- Free tier: 3 screenshot uploads, 5 chat questions per class
- Premium ($9.99 one-time): Unlimited for semester

## Security Requirements
- All user data encrypted at rest and in transit
- FERPA compliance (no sharing educational records)
- GDPR compliance (data export/deletion endpoints)
- Rate limiting: 100 req/15min per IP, 500 req/15min per user
- File upload validation with magic number checking
- Automatic PII redaction from screenshots
