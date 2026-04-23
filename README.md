# 🚀 AI-Powered Adaptive Recruitment Suite

<div align="center">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" />
</div>

---

## 🌟 Overview
A next-generation recruitment platform that leverages **Google Gemini AI** to bridge the gap between talent and opportunity. From AI-driven job descriptions to smart candidate matching and real-time assessments, this suite automates the heavy lifting of modern hiring.

### ✨ Key Features
- 🤖 **AI Assessment Engine**: Generate technical assessments dynamically using Gemini.
- 🏢 **Organization Management**: Dedicated portals for companies to manage their brand and pipeline.
- 📈 **Real-time Pipeline**: Interactive candidate tracking from application to offer.
- 🎯 **Smart Matching**: AI-assisted eligibility checking for candidates before they apply.
- 📝 **Interactive Profiles**: Rich professional profiles with experience and education timelines.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, Socket.io (for real-time updates).
- **Database**: Supabase (PostgreSQL) with Row-Level Security.
- **AI**: Google Generative AI (Gemini 1.5 Flash).

---

## 🚀 Quick Start (Local Development)

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd adaptive-recruitment-suite
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root and add your keys (see [Environment Variables](#-environment-variables) section).

4. **Start the development server**:
   ```bash
   npm run dev
   ```

---

## 🌍 Deployment Guide

### Push to GitHub
1. Create a new repository on GitHub.
2. Initialize and push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

### Deploy to Vercel
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Use the following **Build Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add the [Environment Variables](#-environment-variables) below in the Vercel project settings.

---

## 🔐 Environment Variables
Add these variables to your deployment platform (Vercel, Railway, etc.) and your local `.env` file:

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google AI Studio / Gemini API Key |
| `SUPABASE_URL` | Your Supabase Project URL |
| `SUPABASE_ANON_KEY` | Your Supabase Project Anonymous Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key (Keep secret!) |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` (For client-side Vite) |
| `VITE_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY` (For client-side Vite) |
| `APP_URL` | The production URL of your deployed app |

---

## 📜 SQL Setup
Before running the app, ensure your Supabase database has the required tables. Execute the contents of `setup.sql` in your **Supabase SQL Editor**.

---

<div align="center">
  <p>Built with ❤️ using Google AI Studio</p>
</div>
