# Health System v2.0 - Enhanced Telemedicine App

A comprehensive offline-first healthcare management system with AI-powered prescription parsing, role-based authentication, and intelligent medicine reminders.

## 🎉 What's New in v2.0

### ✅ Offline-First Support
- **IndexedDB Integration**: All patient data stored locally
- **Automatic Offline Detection**: Visual indicator when internet is unavailable
- **Local-First Data Entry**: ASHA workers can register patients and record vitals without internet
- **Smart Sync System**: "Sync Data" button uploads unsynced records to backend
- **Sync Status Tracking**: Visual indicators show which records are synced vs local-only

### ✅ AI Prescription Simplifier (Doctor Dashboard)
- **Free-Text Input**: Doctors write prescriptions in natural language
- **Smart Parsing**: AI converts text to structured format automatically
- **Structured Output**:
  - Medicine name
  - Dosage (500mg, 1 tablet, 10ml, etc.)
  - Frequency (once daily, twice daily, etc.)
  - Timing (Morning, Afternoon, Evening, Night with icons)
  - Duration (5 days, 2 weeks, etc.)
- **Edit & Refine**: Manually adjust parsed medicines before saving
- **Visual Schedule**: Icon-based timing display

### ✅ Enhanced Medicine Reminders (Patient Dashboard)
- **Browser Notifications**: Real-time alerts for medicine timings
- **Auto-Generated Reminders**: Created from prescription timing data
- **Smart Scheduling**: Reminders set based on time of day
- **Mark as Taken**: Track medicine compliance
- **Text-to-Speech**: 🔊 Listen to prescription instructions
- **Voice Synthesis**: Uses browser's Speech Synthesis API (no external API needed)

### ✅ Additional Enhancements
- Clean, modular code structure
- Role-based access control maintained
- No external paid APIs required
- Production-ready error handling

## 📦 Installation

```bash
# Navigate to project directory
cd health-system-v2

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Updated File Structure

```
health-system-v2/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.jsx      # Reusable dashboard layout
│   │   ├── ProtectedRoute.jsx       # Route protection wrapper
│   │   └── OfflineIndicator.jsx     # 🆕 Offline mode indicator
│   ├── context/
│   │   └── AuthContext.jsx          # Authentication state management
│   ├── pages/
│   │   ├── Login.jsx                # Login page
│   │   ├── PatientDashboard.jsx     # 🆕 Enhanced with TTS & reminders
│   │   ├── ASHADashboard.jsx        # 🆕 Enhanced with offline support
│   │   ├── DoctorDashboard.jsx      # 🆕 Enhanced with AI parser
│   │   ├── AdminDashboard.jsx       # Admin features
│   │   └── Unauthorized.jsx         # Access denied page
│   ├── utils/
│   │   ├── db.js                    # 🆕 IndexedDB manager
│   │   ├── prescriptionParser.js    # 🆕 AI prescription parser
│   │   └── notifications.js         # 🆕 Notifications & TTS manager
│   ├── App.jsx                      # Main app with routing
│   ├── main.jsx                     # Entry point
│   └── index.css                    # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🎯 Key Features by Role

### ASHA Worker
- ✅ **Offline Patient Registration**: Works without internet
- ✅ **Offline Vitals Entry**: Record vital signs locally
- ✅ **AI Triage System**: Automatic severity assessment
- ✅ **Sync Button**: Upload all unsynced data when online
- ✅ **Sync Status**: Visual indicators for synced/unsynced records
- ✅ **Patient List**: View all registered patients with sync status

### Doctor
- ✅ **Free-Text Prescriptions**: Write naturally, AI structures it
- ✅ **Smart Parsing**: Automatic medicine, dosage, timing extraction
- ✅ **Visual Editor**: Refine parsed prescriptions before saving
- ✅ **Icon-Based Schedule**: Clear visual timing indicators (🌅☀️🌆🌙)
- ✅ **Text-to-Speech**: Read prescriptions aloud
- ✅ **Prescription History**: View all past prescriptions with sync status

### Patient
- ✅ **View Prescriptions**: Structured, easy-to-read format
- ✅ **Medicine Reminders**: Automatic daily reminders
- ✅ **Browser Notifications**: Push notifications for medicine times
- ✅ **Text-to-Speech**: 🔊 Listen to medicine instructions
- ✅ **Mark as Taken**: Track medication compliance
- ✅ **Visual Schedule**: Icon-based timing display

### Admin
- ✅ **System Statistics**: Overview of all activities
- ✅ **Activity Monitoring**: Recent system events
- ✅ **User Management**: Access control (coming soon)

## 🔧 How It Works

### 1. Offline-First Architecture

**IndexedDB Stores:**
- `patients` - Patient registration data
- `vitals` - Vital signs and triage results
- `prescriptions` - Doctor prescriptions

**Data Flow:**
1. User enters data (patient, vitals, prescription)
2. Saved immediately to IndexedDB with `synced: false`
3. Works completely offline
4. When online, click "Sync Data" button
5. Simulates API call to backend
6. Marks records as `synced: true`
7. Visual indicators update

### 2. AI Prescription Parser

**Input Example:**
```
Paracetamol 500mg twice daily for 5 days
Amoxicillin 250mg three times a day with meals for 7 days
Cough syrup 10ml at night for 3 days
```

**Parsed Output:**
```json
{
  "name": "Paracetamol",
  "dosage": "500mg",
  "frequency": "Twice daily",
  "timing": ["Morning", "Evening"],
  "duration": "5 days"
}
```

**Parser Logic:**
- Regex-based medicine name extraction
- Dosage pattern matching (mg, ml, tablets, etc.)
- Frequency detection (once, twice, thrice, etc.)
- Timing inference (morning, afternoon, evening, night)
- Duration extraction (days, weeks, months)

### 3. Smart Notifications

**Notification Scheduling:**
1. Patient enables browser notifications
2. System reads all prescriptions
3. Generates reminders for each medicine + timing
4. Schedules browser notifications
5. Fires alerts at designated times
6. Reschedules for next day automatically

**Timing Defaults:**
- Morning: 9:00 AM
- Afternoon: 2:00 PM
- Evening: 6:00 PM
- Night: 9:00 PM

### 4. Text-to-Speech

**Features:**
- Uses browser's built-in Speech Synthesis API
- No external API required
- Reads prescription details aloud
- Customizable voice, rate, pitch
- Works offline

**Usage:**
```javascript
speechManager.speakPrescription(medicine);
// Speaks: "Medicine: Paracetamol. Dosage: 500mg. 
// Frequency: Twice daily. Timing: Morning, Evening. 
// Duration: 5 days."
```

## 🧪 Testing Guide

### Test Offline Mode

1. **Start the app** and login as ASHA
2. Open DevTools → Network tab
3. Set to "Offline"
4. Register a patient
5. Enter vitals
6. Notice "Offline Mode" indicator appears
7. Data saved locally (check Application → IndexedDB)
8. Go back "Online"
9. Click "Sync Data" button
10. Records marked as synced

### Test Prescription Parser

1. **Login as Doctor**
2. Select a patient
3. Enter diagnosis: "Common Cold"
4. Paste free-text prescription:
   ```
   1. Paracetamol 500mg twice daily for 5 days
   2. Cough syrup 10ml at bedtime for 3 days
   3. Vitamin C 1000mg once daily in the morning
   ```
5. Click "Parse with AI"
6. Review structured output
7. Edit if needed (toggle timings, adjust dosage)
8. Click "Save Prescription"
9. Check "Prescription History" tab

### Test Medicine Reminders

1. **Login as Patient**
2. Go to "Prescriptions" tab
3. Click "🔊 Listen to All" to hear TTS
4. Go to "Reminders" tab
5. Click "Enable Notifications"
6. Grant browser permission
7. See list of today's reminders
8. Click "🔊 Listen" on a medicine
9. Click "Mark as Taken"
10. Status changes to green checkmark

### Test Voice Features

1. **TTS for Single Medicine**:
   - Patient dashboard → Click "🔊 Play" on any medicine
   - Hear: "Medicine: [name]. Dosage: [dosage]..."

2. **TTS for All Medicines**:
   - Click "🔊 Listen to All" button
   - Hear entire prescription read aloud

3. **Reminder Voice**:
   - When notification fires, also plays a beep sound
   - Browser notification includes medicine details

## 💡 Advanced Features

### IndexedDB Schema

```javascript
// Patients Store
{
  id: "patient_1234567890_abc",
  name: "John Doe",
  age: 35,
  gender: "male",
  phone: "9876543210",
  village: "Village Name",
  address: "Full address",
  synced: false,  // Changes to true after sync
  createdAt: "2026-02-17T10:30:00.000Z",
  updatedAt: "2026-02-17T10:30:00.000Z"
}

// Vitals Store
{
  id: "vitals_1234567890_xyz",
  patientId: "patient_1234567890_abc",
  temperature: 98.6,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  heartRate: 72,
  symptoms: "Mild headache",
  triageResult: {
    severity: "low",
    recommendations: [...]
  },
  synced: false,
  createdAt: "2026-02-17T10:35:00.000Z"
}

// Prescriptions Store
{
  id: "prescription_1234567890_def",
  patientId: "patient_1234567890_abc",
  patientName: "John Doe",
  diagnosis: "Common Cold",
  medicines: [
    {
      id: "med_123",
      name: "Paracetamol",
      dosage: "500mg",
      frequency: "Twice daily",
      timing: ["Morning", "Evening"],
      duration: "5 days"
    }
  ],
  notes: "Rest and hydration advised",
  doctorName: "Dr. Smith",
  synced: false,
  prescribedAt: "2026-02-17T11:00:00.000Z"
}
```

### Prescription Parser Examples

**Input:**
```
Aspirin 75mg once daily in the morning
Metformin 500mg twice a day with breakfast and dinner for 30 days
Insulin 10 units before meals three times a day
```

**Parsed:**
```json
[
  {
    "name": "Aspirin",
    "dosage": "75mg",
    "frequency": "Once daily",
    "timing": ["Morning"],
    "duration": "30 days"
  },
  {
    "name": "Metformin",
    "dosage": "500mg",
    "frequency": "Twice daily",
    "timing": ["Morning", "Evening"],
    "duration": "30 days"
  },
  {
    "name": "Insulin",
    "dosage": "10 units",
    "frequency": "Three times daily",
    "timing": ["Morning", "Afternoon", "Evening"],
    "duration": "30 days"
  }
]
```

## 🚀 Deployment Notes

### Browser Compatibility

**IndexedDB**: Supported in all modern browsers
**Notifications**: Requires user permission
**Speech Synthesis**: Supported in Chrome, Firefox, Safari, Edge

### Production Checklist

- [ ] Replace simulated sync with real API endpoints
- [ ] Add authentication tokens to sync requests
- [ ] Implement conflict resolution for offline edits
- [ ] Add data encryption for sensitive health info
- [ ] Set up service worker for true PWA offline support
- [ ] Configure push notifications server
- [ ] Add analytics for prescription parsing accuracy
- [ ] Implement backup/export functionality

## 🐛 Troubleshooting

**Notifications not working:**
- Check browser permissions (Settings → Site Settings → Notifications)
- Ensure HTTPS or localhost (required for notifications)
- Try clicking "Enable Notifications" again

**Speech not working:**
- Check browser support (Chrome/Edge recommended)
- Ensure volume is not muted
- Try reloading the page

**Data not syncing:**
- Check browser console for errors
- Verify internet connection
- IndexedDB might be full (check storage quota)

**Parser not extracting correctly:**
- Use structured format: "Medicine Dosage frequency timing for duration"
- Example: "Paracetamol 500mg twice daily for 5 days"
- Avoid complex sentences; keep it simple

## 📝 License

This is a demonstration project for educational purposes.

## 🙏 Acknowledgments

- Built with React + Vite
- Uses browser APIs: IndexedDB, Notifications, Speech Synthesis
- No external paid APIs required
- All data stored locally for privacy

---

**Version 2.0** - Enhanced with Offline Support, AI Prescription Parser, and Smart Reminders
