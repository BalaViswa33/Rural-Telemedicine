# Quick Start Guide - Health System v2.0

## 🚀 5-Minute Setup

### 1. Install
```bash
cd health-system-v2
npm install
npm run dev
```

### 2. Open Browser
```
http://localhost:5173
```

### 3. Login
- Username: `any`
- Password: `any`
- Role: Select any role

---

## 📖 Feature Walkthroughs

### 🩺 ASHA Worker - Offline Patient Registration

**Step 1:** Login as ASHA
```
Username: asha
Password: test
Role: ASHA Worker
```

**Step 2:** Go Offline
- Open DevTools (F12)
- Network tab → Throttling → Offline
- Notice "📡 Offline Mode" indicator appears

**Step 3:** Register a Patient
- Click "Patient Registration" tab
- Fill in:
  ```
  Name: Rajesh Kumar
  Age: 45
  Gender: Male
  Phone: 9876543210
  Village: Rampur
  Address: Near village temple
  ```
- Click "Register Patient"
- ✅ Data saved locally (works offline!)

**Step 4:** Enter Vitals
- Click "Vitals & Triage" tab
- Select patient: "Rajesh Kumar"
- Enter vitals:
  ```
  Temperature: 102°F
  Blood Pressure: 140/90
  Heart Rate: 95
  Symptoms: Fever, body ache, headache
  ```
- Click "Run AI Triage"
- See severity assessment and recommendations

**Step 5:** Sync When Online
- Go back online (DevTools → Network → No throttling)
- Notice floating "☁️ Sync Data (2)" button
- Click to sync
- Records marked as "✓ Synced"

---

### ⚕️ Doctor - AI Prescription Simplifier

**Step 1:** Login as Doctor
```
Username: doctor
Password: test
Role: Doctor
```

**Step 2:** Write Prescription Tab
- Select a patient from dropdown
- Diagnosis: `Upper Respiratory Infection`
- Free-text prescription:
  ```
  Azithromycin 500mg once daily in the morning for 5 days
  Paracetamol 650mg twice a day with meals for 3 days
  Cetri zine 10mg at bedtime for 5 days
  Cough syrup 10ml three times daily for 7 days
  ```

**Step 3:** Parse with AI
- Click "🤖 Parse with AI"
- See structured preview:
  - Medicine names extracted
  - Dosages identified
  - Frequency parsed
  - Timing inferred (🌅 Morning, ☀️ Afternoon, etc.)
  - Duration captured

**Step 4:** Refine & Edit
- Click on any timing button to toggle
- Edit dosage if needed
- Adjust duration
- Add/remove timings

**Step 5:** Save & Listen
- Click "🔊 Speak Prescription" to hear it
- Click "✓ Save Prescription"
- Check "📋 Prescription History" tab

---

### 🏥 Patient - Medicine Reminders & Voice

**Step 1:** Login as Patient
```
Username: patient
Password: test
Role: Patient
```

**Step 2:** View Prescriptions
- See all your prescriptions
- Click "🔊 Listen to All" - hears entire prescription
- Click "🔊 Play" on individual medicine - hears just that one

**Step 3:** Enable Reminders
- Go to "⏰ Reminders" tab
- Click "🔔 Enable Notifications"
- Allow browser permission
- See list of medicine reminders for today

**Step 4:** Manage Reminders
- Each reminder shows:
  - Medicine name & dosage
  - Timing icon (🌅 Morning, 🌙 Night, etc.)
  - Time (e.g., 09:00 AM)
- Click "🔊 Listen" to hear instructions
- Click "Mark as Taken" when consumed
- Status changes to green "✓ Taken"

**Step 5:** Test Notifications
- Wait for scheduled time OR
- Change system time to trigger reminder
- Receive browser notification
- Hear notification beep
- Click notification to open app

---

## 🧪 Testing Scenarios

### Test 1: Offline Mode
```bash
1. Login as ASHA
2. Open DevTools → Network → Offline
3. Register patient
4. Record vitals
5. See "Offline Mode" indicator
6. Check IndexedDB (Application tab)
7. Go online
8. Click "Sync Data"
9. Verify sync status changes
```

### Test 2: Prescription Parser
```bash
1. Login as Doctor
2. Select patient
3. Paste complex prescription:
   "Metformin 500mg twice daily with breakfast and dinner for 30 days
    Glimepiride 2mg once daily before breakfast
    Aspirin 75mg once daily at bedtime
    Vitamin D3 60000 IU once weekly for 8 weeks"
4. Click "Parse with AI"
5. Verify all details extracted correctly
6. Edit timing if needed
7. Save
```

### Test 3: Speech Synthesis
```bash
1. Login as Patient
2. Go to Prescriptions
3. Click "🔊 Listen to All"
4. Verify voice reads:
   - Medicine name
   - Dosage
   - Frequency
   - Timing
   - Duration
5. Adjust browser volume if needed
```

### Test 4: Notifications
```bash
1. Login as Patient
2. Go to Reminders tab
3. Click "Enable Notifications"
4. Grant permission
5. See scheduled reminders
6. Method 1 (Wait): Wait for scheduled time
7. Method 2 (Test): Change system time to reminder time
8. Receive notification
9. Click notification → opens app
10. Mark as taken
```

---

## 💡 Quick Tips

### Parser Best Practices
✅ **Good Format:**
```
Medicine Dosage frequency timing for duration
Example: Paracetamol 500mg twice daily for 5 days
```

❌ **Avoid:**
```
Complex sentences, unnecessary details, vague terms
```

### Notification Troubleshooting
- **Not showing?** Check browser permissions
- **No sound?** Check browser volume & sound settings
- **Wrong time?** Timings are: Morning(9AM), Afternoon(2PM), Evening(6PM), Night(9PM)

### Offline Tips
- Data stored in IndexedDB (persistent)
- Works even after browser restart
- Syncs automatically when online
- No data loss during offline mode

### Voice Tips
- Works best in Chrome/Edge
- Requires volume on
- First time might ask for microphone permission (deny, only speaker needed)
- Can pause/resume if browser supports it

---

## 🎯 Common Tasks

### Add a Patient (ASHA)
1. Login as ASHA
2. Patient Registration tab
3. Fill form → Register
4. Patient appears in Patient List

### Record Vitals (ASHA)
1. Vitals & Triage tab
2. Select patient
3. Enter vitals
4. Run AI Triage
5. See severity & recommendations

### Write Prescription (Doctor)
1. Write Prescription tab
2. Select patient
3. Enter diagnosis
4. Type free-text prescription
5. Parse with AI
6. Edit if needed
7. Save

### Check Medicines (Patient)
1. Prescriptions tab
2. View all prescriptions
3. Click "🔊 Listen" for voice
4. Read timing icons

### Set Reminders (Patient)
1. Reminders tab
2. Enable notifications
3. See today's reminders
4. Mark as taken when consumed

---

## 📚 Learn More

- **Full Documentation**: See [README.md](./README.md)
- **What's New**: See [CHANGES.md](./CHANGES.md)
- **Code Structure**: Explore `src/` directory
- **Database Schema**: Check `src/utils/db.js`
- **Parser Logic**: Check `src/utils/prescriptionParser.js`

---

## ⚡ Pro Tips

1. **Keyboard Shortcuts**: None yet, but coming in v3.0!
2. **Mobile**: Works on mobile browsers too
3. **PWA**: Add to home screen for app-like experience
4. **Data Export**: Use IndexedDB export tools in DevTools
5. **Bulk Testing**: Use browser's localStorage to skip login

---

**Ready to start? Run `npm run dev` and explore!** 🚀
