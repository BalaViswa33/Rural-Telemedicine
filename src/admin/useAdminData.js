// Central data hook for Admin Dashboard — reads from IndexedDB
import { useState, useEffect, useCallback } from 'react';
import { db, STORES } from '../utils/db';

export function useAdminData() {
  const [data, setData] = useState({
    patients: [], vitals: [], prescriptions: [], consultations: [],
    auditLogs: [], emergencyAlerts: [], messages: [],
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await db.init();
      const [patients, vitals, prescriptions, consultations] = await Promise.all([
        db.getAll(STORES.PATIENTS),
        db.getAll(STORES.VITALS),
        db.getAll(STORES.PRESCRIPTIONS),
        db.getAll(STORES.CONSULTATIONS),
      ]);

      // Audit logs stored in localStorage (lightweight, cross-session)
      const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
      // Emergency alerts derived from high-risk vitals
      const emergencyAlerts = JSON.parse(localStorage.getItem('emergencyAlerts') || '[]');
      // Offline messages from patients to doctors
      const messages = JSON.parse(localStorage.getItem('offlineMessages') || '[]');

      setData({ patients, vitals, prescriptions, consultations, auditLogs, emergencyAlerts, messages });
    } catch (e) {
      console.error('Admin data load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Helper: seed demo data if DB is empty
  const seedDemo = useCallback(async () => {
    const villages = ['Rampur', 'Sultanpur', 'Mehrauli', 'Bharatpur', 'Govindpur'];
    const names = ['Sunita Devi','Priya Sharma','Meena Kumari','Kavita Rao','Anita Patel','Rajesh Kumar','Mohan Lal','Suresh Singh'];
    const ashaWorkers = ['Asha-01 Geeta','Asha-02 Rekha','Asha-03 Suman','Asha-04 Jyoti'];

    // Demo patients
    for (let i = 0; i < 24; i++) {
      const isPregnant = i % 4 === 0;
      await db.add(STORES.PATIENTS, {
        id: `P${1000 + i}`,
        name: names[i % names.length],
        age: 18 + (i * 3 % 45),
        village: villages[i % villages.length],
        phone: `98${(1000000000 + i * 111111).toString().slice(1)}`,
        ashaId: ashaWorkers[i % ashaWorkers.length],
        pregnant: isPregnant,
        lmp: isPregnant ? new Date(Date.now() - (i * 7 * 24 * 3600000)).toISOString() : null,
        deliveryDate: isPregnant ? new Date(Date.now() + ((40 - i) * 7 * 24 * 3600000)).toISOString() : null,
        synced: i % 3 !== 0,
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      });
    }

    // Demo vitals
    const riskLevels = ['low','medium','high','emergency'];
    const diseases = ['fever','diarrhea','respiratory','other'];
    for (let i = 0; i < 36; i++) {
      const risk = riskLevels[i % 4];
      const bpSys = risk === 'emergency' ? 160 + (i % 20) : risk === 'high' ? 145 + (i % 10) : 110 + (i % 25);
      const bpDia = risk === 'emergency' ? 100 + (i % 10) : risk === 'high' ? 92 + (i % 8) : 70 + (i % 15);
      await db.add(STORES.VITALS, {
        id: `V${2000 + i}`,
        patientId: `P${1000 + (i % 24)}`,
        risk,
        disease: diseases[i % 4],
        bp: `${bpSys}/${bpDia}`,
        temp: (36 + (i % 3) * 0.5).toFixed(1),
        spo2: 94 + (i % 6),
        networkType: ['4g','3g','2g','none'][i % 4],
        ashaId: ashaWorkers[i % ashaWorkers.length],
        emergencyTriggered: risk === 'emergency',
        synced: i % 4 !== 0,
        createdAt: new Date(Date.now() - i * 3600000 * 6).toISOString(),
      });
    }

    // Demo consultations
    for (let i = 0; i < 18; i++) {
      await db.add(STORES.CONSULTATIONS, {
        id: `C${3000 + i}`,
        patientId: `P${1000 + (i % 24)}`,
        doctorId: `doctor`,
        offlineMode: i % 3 === 0,
        networkType: ['4g','3g','2g','none'][i % 4],
        synced: i % 3 !== 0,
        createdAt: new Date(Date.now() - i * 86400000 / 2).toISOString(),
      });
    }

    // Demo audit logs
    const logActions = [
      {action:'Patient Registered', role:'asha'},{action:'Triage Completed', role:'asha'},
      {action:'Emergency Triggered', role:'asha'},{action:'Consultation Started', role:'doctor'},
      {action:'Message Sent', role:'patient'},{action:'Prescription Written', role:'doctor'},
    ];
    const logs = Array.from({length: 30}, (_, i) => ({
      id: `L${i}`,
      role: logActions[i % logActions.length].role,
      action: logActions[i % logActions.length].action,
      timestamp: new Date(Date.now() - i * 3600000 * 3).toISOString(),
      deviceId: `DEV-${(1000 + i * 17) % 9999}`,
      user: ashaWorkers[i % ashaWorkers.length],
    }));
    localStorage.setItem('auditLogs', JSON.stringify(logs));

    // Demo emergency alerts
    const alerts = Array.from({length: 8}, (_, i) => ({
      id: `E${i}`,
      patientName: names[i % names.length],
      village: villages[i % villages.length],
      risk: ['high','emergency'][i % 2],
      time: new Date(Date.now() - i * 3600000 * 2).toISOString(),
      status: ['Pending','Delivered','Resolved'][i % 3],
    }));
    localStorage.setItem('emergencyAlerts', JSON.stringify(alerts));

    // Demo offline messages
    const msgs = Array.from({length: 10}, (_, i) => ({
      id: `M${i}`,
      patientName: names[i % names.length],
      patientId: `P${1000 + i}`,
      village: villages[i % villages.length],
      message: ['I have fever since 3 days','My BP is high','Baby not moving much','Severe headache today','Stomach pain after eating'][i % 5],
      timestamp: new Date(Date.now() - i * 3600000 * 4).toISOString(),
      syncStatus: ['Pending','Synced','Failed'][i % 3],
    }));
    localStorage.setItem('offlineMessages', JSON.stringify(msgs));

    await load();
  }, [load]);

  return { data, loading, refresh: load, seedDemo };
}
