# Rural Telemedicine - Health System App

A comprehensive healthcare management system with AI symptom checker, offline support, and role-based dashboards for ASHA workers, Doctors, Patients, and Admins.

---

## 🚀 How to Run This Project

### ✅ Prerequisites
Make sure **Node.js** is installed on your system.
Download from: **https://nodejs.org** (choose the LTS version)

---

### 📥 Step 1 — Download the Code

1. Go to the GitHub repository page
2. Click the green **"Code"** button
3. Click **"Download ZIP"**
4. A file named **`Rural-Telemedicine-main.zip`** will be downloaded to your Downloads folder

---

### 📂 Step 2 — Extract the ZIP

1. Go to your **Downloads** folder
2. Right-click on **`Rural-Telemedicine-main.zip`**
3. Click **"Extract All"**
4. Click **"Extract"**
5. A folder named **`Rural-Telemedicine-main`** will appear

---

### 💻 Step 3 — Open the Correct Folder in VS Code

> ⚠️ **Important:** There are TWO folders inside the zip. You must open the **inner** one!

1. Open **VS Code**
2. Click **"File"** → **"Open Folder"**
3. Navigate to **Downloads** → open **`Rural-Telemedicine-main`**
4. You will see **another folder** inside (the actual project folder)
5. Click on that **inner folder** to select it
6. Click **"Select Folder"**
7. ✅ You should now see files like `package.json`, `index.html`, and a `src` folder in the VS Code sidebar — if you can see these, you opened the right folder!

> 💡 **No inner folder?** If you don't see another folder inside and you can already see `package.json` and `src` directly — that's fine! You're already in the right place, just proceed to the next step.

---

### 🔑 Step 4 — Get Your Free Groq API Key (for AI Symptom Checker)

The AI Symptom Checker requires a free API key from Groq. Follow these steps:

1. Go to **https://console.groq.com**
2. Click **"Sign Up"** and create a free account (you can sign up with Google)
3. After logging in, click **"API Keys"** on the left sidebar
4. Click **"Create API Key"**
5. Give it any name like `telemedicine-app`
6. Click **"Submit"**
7. **Copy the key** — it looks like `gsk_xxxxxxxxxxxxxxxxxx`
8. ⚠️ **Save it somewhere** — you won't be able to see it again after closing!

---

### 🖥️ Step 5 — Open the Terminal in VS Code

1. In VS Code, click **"Terminal"** in the top menu
2. Click **"New Terminal"**
3. A terminal panel will open at the bottom
4. On the right side of the terminal panel, click the **dropdown arrow (∨)** next to the "+"
5. Select **"Command Prompt"** (cmd)

---

### 📦 Step 6 — Install Packages

Type this command and press **Enter**:

```
npm install
```

⏳ Wait for it to finish (takes 1-2 minutes, you'll see it downloading packages)

---

### ▶️ Step 7 — Start the App

Type this command and press **Enter**:

```
npm run dev
```

You will see something like:

```
  VITE v5.x.x  ready in 500ms

  ➜  Local:   http://localhost:5173/
```

---

### 🌐 Step 8 — Open in Browser

1. Open any browser (Chrome recommended)
2. Type in the address bar: **`http://localhost:5173`**
3. Press **Enter**
4. The app will load! ✅

---

### 🩺 Step 9 — Using the AI Symptom Checker

1. Login as **Doctor** (see credentials below)
2. Go to **AI Symptom Checker**
3. Paste the Groq API key you copied in Step 4 into the **"Groq API Key"** field
4. Type symptoms or upload a medical image
5. Click **"Ask the AI Doctor"**

---

## 🔑 Login Credentials

| Role    | Username | Password   |
|---------|----------|------------|
| Admin   | admin    | admin123   |
| Doctor  | doctor   | doctor123  |
| ASHA    | asha     | asha123    |
| Patient | patient  | patient123 |

---

## 🛠️ Tech Stack

- React 18 + Vite
- React Router DOM
- Groq API (free) for AI Symptom Checker
- Browser APIs: IndexedDB, Speech Synthesis, Notifications

## 📦 Groq API is completely free — no credit card required!

---

> **Note:** To stop the app, go back to the terminal and press `Ctrl + C`
