# 🚀 AI-Powered Adaptive Recruitment Suite

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=4F46E5&center=true&vCenter=true&width=500&lines=Hire+Smarter+with+Gemini+AI;Automated+Skill+Assessments;Real-time+Candidate+Tracking" alt="Typing SVG" />
</div>

<div align="center">
  <a href="https://vitejs.dev/" target="_blank"><img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /></a>
  <a href="https://reactjs.org/" target="_blank"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /></a>
  <a href="https://tailwindcss.com/" target="_blank"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
  <a href="https://supabase.com/" target="_blank"><img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://ai.google.dev/" target="_blank"><img src="https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white" alt="Gemini" /></a>
</div>

---

## 🌟 Overview
A next-generation recruitment platform that leverages **Google Gemini AI** to bridge the gap between talent and opportunity. From AI-driven job descriptions to smart candidate matching and real-time assessments, this suite automates the heavy lifting of modern hiring.

### ✨ Key Features
- 🤖 **AI Assessment Engine**: Generate technical assessments dynamically using Gemini.
- 🏢 **Organization Management**: Dedicated portals for companies to manage their brand and pipeline.
- 📈 **Real-time Pipeline**: Interactive candidate tracking from application up to offer.
- 🎯 **Smart Matching**: AI-assisted eligibility checking for candidates before they apply.
- 📝 **Interactive Profiles**: Rich professional profiles with experience and education timelines.

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: Express (Deployed as Vercel Functions).
- **Database**: Supabase (PostgreSQL) with Row-Level Security.
- **AI**: Google Generative AI (Gemini 1.5 Flash).

---

## 🌍 Deployment Guide (Vercel)

### 1. Push to GitHub
If you haven't already:
```bash
git init
git add .
git commit -m "🚀 Deployment Ready"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Connect to Vercel
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **"New Project"**.
2. Select your repository.
3. **Crucial Build Settings**:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add the **Environment Variables** (see below).

---

## 🔐 Environment Variables (CRITICAL)
You **MUST** add these in the Vercel Project Settings for the app to function:

| Variable | Source |
| :--- | :--- |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `SUPABASE_URL` | Supabase > Project Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Project Settings > API (Keep Secret!) |
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Project Settings > API |

> **Note**: `VITE_` prefixed variables are required for the frontend to connect to Supabase. Non-prefixed variables are used by the secure backend.

---

## 📜 Database Setup
Run the `setup.sql` script in your **Supabase SQL Editor** to create the required tables and security rules.

---

<div align="center">
  <p>Crafted with ✨ using Google AI Studio</p>
</div>
