# Deployment Guide for Family Tree Application

This project can be hosted in two ways:

---

## 🚀 Option 1: Unified Fullstack Deployment on Render (Recommended & Simplest)

In this setup, a single **free Web Service on Render** (or Railway / Fly.io) builds and serves both the React Vite frontend and the Node.js/Express MongoDB backend on a single domain. **No CORS issues!**

### Step 1: Initialize Git and Push to GitHub
In your project terminal:
```bash
git init
git add .
git commit -m "Family tree ready for production deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

### Step 2: Create a Web Service on Render
1. Go to [Render.com](https://render.com) and log in.
2. Click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your GitHub repository.
4. Configure the settings:
   - **Name**: `my-family-tree` (or your preferred name)
   - **Environment**: `Node`
   - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Build Command**:
     ```bash
     npm install && npm run build && npm run install:server
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
   - **Plan**: `Free`

5. Add **Environment Variables** under the "Environment" tab:
   | Key | Value | Description |
   |---|---|---|
   | `NODE_ENV` | `production` | Enables production mode & static serving |
   | `MONGO_URI` | `mongodb+srv://haro09a_db_user:qRQJtFXDxoCUyDhK@cluster0.xfdivjz.mongodb.net/family_tree_db?retryWrites=true&w=majority&appName=Cluster0` | Your MongoDB Atlas connection string |
   | `JWT_SECRET` | `family_tree_super_secret_jwt_key_2026` | Any secure random string |

6. Click **Deploy Web Service**!
Once deployed, your full application is live at `https://my-family-tree.onrender.com`.

---

## ⚡ Option 2: Decoupled Deployment (Frontend on Vercel + Backend on Render)

If you prefer using Vercel's global edge network for the frontend:

### Part A: Deploy Backend on Render
1. In Render, select **New +** → **Web Service** and choose your repo.
2. Set:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**:
     - `MONGO_URI`: `mongodb+srv://haro09a_db_user:...`
     - `JWT_SECRET`: `family_tree_super_secret_jwt_key_2026`
     - `CLIENT_URL`: `https://<your-vercel-app>.vercel.app`
3. Click **Deploy**. Note your backend URL: e.g. `https://family-tree-backend.onrender.com`.

### Part B: Deploy Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) and import your Git repo.
2. Set:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add **Environment Variables**:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://family-tree-backend.onrender.com/api` |
   | `VITE_GOOGLE_CLIENT_ID` | `97771990589-b693r758h0gfqpp0sl901eig0qq7veeh.apps.googleusercontent.com` |
4. Click **Deploy**.

---

## 🔒 MongoDB Atlas Network Access Note
Ensure your MongoDB Atlas cluster allows incoming connections from your cloud host:
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/).
2. In the left menu, select **Security** → **Network Access**.
3. Make sure IP `0.0.0.0/0` (Allow Access from Anywhere) is active so hosting platforms like Render or Vercel can reach your database.
