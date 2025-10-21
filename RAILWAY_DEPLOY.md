# 🚂 Deploy Arena Shooter to Railway

## Step-by-Step Railway Deployment Guide

### Method 1: Deploy via Railway Dashboard (Easiest!)

1. **Push your code to GitHub** (if not already done)
   - Make sure your code is in a GitHub repository
   - Branch: `claude/update-g-011CULY3FxMajkXD9uG6BucS`

2. **Go to Railway**
   - Visit [https://railway.app](https://railway.app)
   - Click "Login" and sign in with your GitHub account

3. **Create New Project**
   - Click "New Project" button
   - Select "Deploy from GitHub repo"
   - Choose your `ephie2` repository
   - Select branch: `claude/update-g-011CULY3FxMajkXD9uG6BucS`

4. **Railway Auto-Detects Everything!**
   - Railway will automatically detect `package.json`
   - It will run `npm install` and `npm start`
   - The server will start on the assigned PORT

5. **Get Your Live URL**
   - Once deployed, go to your project settings
   - Click "Generate Domain"
   - Your game will be live at: `https://your-project.up.railway.app`

6. **Share and Play!**
   - Copy the URL and share it with friends
   - Anyone can play from anywhere!

---

### Method 2: Deploy via Railway CLI

```bash
# Install Railway CLI globally
npm install -g @railway/cli

# Navigate to your project
cd ephie2

# Checkout the correct branch
git checkout claude/update-g-011CULY3FxMajkXD9uG6BucS

# Login to Railway (opens browser)
railway login

# Initialize Railway project
railway init

# Deploy!
railway up

# Generate a public domain
railway domain
```

Your game is now live! 🎮

---

## What Railway Does Automatically

✅ Detects `package.json` and installs dependencies
✅ Runs `npm start` which executes `node server.js`
✅ Assigns a PORT environment variable
✅ Provides HTTPS automatically
✅ Gives you a public URL
✅ Auto-deploys on new commits (if you set it up)

---

## Files That Make Railway Work

- **package.json** - Tells Railway this is a Node.js app
- **server.js** - Express server that serves your game
- **railway.toml** - Railway configuration (optional)
- **Procfile** - Backup start command (optional)

---

## Troubleshooting

### Game won't load?
- Check Railway logs: `railway logs`
- Make sure PORT is set correctly (server.js uses `process.env.PORT`)

### Want to redeploy?
```bash
railway up
```

### Check deployment status:
```bash
railway status
```

---

## Cost

Railway offers:
- **Free tier**: $5 of usage per month (plenty for this game!)
- **Pro tier**: $20/month for unlimited projects

Your arena shooter game uses minimal resources, so the free tier should be perfect!

---

## Next Steps After Deployment

1. ✅ Play your game at the Railway URL
2. 🎮 Share with friends
3. 📊 Monitor usage in Railway dashboard
4. 🔄 Set up automatic deployments on git push
5. 🌐 (Optional) Connect a custom domain

Enjoy your online arena shooter! 🚀
