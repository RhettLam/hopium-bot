# 💊 Hopium Bot

**Hopium Bot** is a "Stock Sentiment Massage Robot" designed to provide absolute emotional value to stock investors. It uses a dual-persona AI to either professionally soothe users or ruthlessly roast them based on the "absurdity" of their requests.

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router, Tailwind CSS)
- **Backend Orchestrator**: Next.js API Routes (Edge/Serverless)
- **Data Fetching**: Vercel Python Runtime + `akshare` (Financial Data)
- **LLM Brain**: Kimi (Moonshot AI)

## 🛠️ Setup & Deployment

### 1. Local Development
```bash
cd hopium-bot
npm install
# Create .env.local and add MOONSHOT_API_KEY
npm run dev
```

### 2. Vercel Deployment
1. Push this repository to GitHub.
2. Import the project to Vercel.
3. Add the following Environment Variable in Vercel Settings:
   - `MOONSHOT_API_KEY`: Your Kimi API Key.

## 🧠 Core Logic
- **Serious Mode**: Real-world stock search \u2192 Professional reassurance.
- **Toxic Mode**: Absurd request detection \u2192 Fake funny jobs \u2192 Sarcastic roasting.
 
   
