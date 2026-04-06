import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useLang } from '../context/LanguageContext';
import { useAdminData } from '../admin/useAdminData';
import OverviewCards    from '../admin/OverviewCards';
import ClinicalAnalytics from '../admin/ClinicalAnalytics';
import MaternalHealth   from '../admin/MaternalHealth';
import AshaPerformance  from '../admin/AshaPerformance';
import NetworkAnalytics from '../admin/NetworkAnalytics';
import EmergencyPanel   from '../admin/EmergencyPanel';
import MessagesPanel    from '../admin/MessagesPanel';
import SyncMonitoring   from '../admin/SyncMonitoring';
import AuditLogs        from '../admin/AuditLogs';

function Spinner() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:300, gap:16 }}>
      <div style={{ width:40, height:40, border:'4px solid var(--border)', borderTop:'4px solid #6b46c1', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <div style={{ color:'var(--text3)', fontSize:14 }}>Loading admin data...</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t } = useLang();
  const [activeTab, setActiveTab] = useState('overview');
  const { data, loading, refresh, seedDemo } = useAdminData();
  const hasData = data.patients.length > 0 || data.vitals.length > 0;

  const TABS = [
    { id:'overview',   labelKey:'adminOverview',   icon:'🏠' },
    { id:'clinical',   labelKey:'adminClinical',   icon:'📊' },
    { id:'maternal',   labelKey:'adminMaternal',   icon:'🤰' },
    { id:'asha',       labelKey:'adminAsha',       icon:'👩‍⚕️' },
    { id:'network',    labelKey:'adminNetwork',    icon:'📡' },
    { id:'emergency',  labelKey:'adminEmergency',  icon:'🚨' },
    { id:'messages',   labelKey:'adminMessages',   icon:'💬' },
    { id:'sync',       labelKey:'adminSync',       icon:'🔄' },
    { id:'audit',      labelKey:'adminAudit',      icon:'📝' },
  ];

  return (
    <DashboardLayout title={t('adminTitle')} role="admin" activeTab="" onTabChange={() => {}}>
      {/* Tab bar */}
      <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding:'8px 14px', borderRadius:10,
            background: activeTab===tab.id ? '#6b46c1' : '#fff',
            color: activeTab===tab.id ? '#fff' : 'var(--text2)',
            border: `1px solid ${activeTab===tab.id ? '#6b46c1' : 'var(--border)'}`,
            fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--font)',
            display:'flex', alignItems:'center', gap:6, transition:'all .15s',
          }}
          onMouseEnter={e=>{ if(activeTab!==tab.id) e.currentTarget.style.background='var(--surface2)'; }}
          onMouseLeave={e=>{ if(activeTab!==tab.id) e.currentTarget.style.background='#fff'; }}>
            <span>{tab.icon}</span> {t(tab.labelKey)}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <button onClick={refresh} style={{ padding:'8px 14px', borderRadius:10, background:'#fff', border:'1px solid var(--border)', fontSize:13, fontWeight:600, color:'var(--text2)', cursor:'pointer', fontFamily:'var(--font)' }}>
            {t('adminRefresh')}
          </button>
          {!hasData && (
            <button onClick={seedDemo} style={{ padding:'8px 14px', borderRadius:10, background:'#6b46c1', border:'none', fontSize:13, fontWeight:600, color:'#fff', cursor:'pointer', fontFamily:'var(--font)' }}>
              {t('adminLoadDemo')}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : !hasData ? (
        <div style={{ background:'#fff', border:'2px dashed var(--border)', borderRadius:20, padding:60, textAlign:'center' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🏥</div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:8 }}>{t('adminNoData')}</div>
          <div style={{ color:'var(--text3)', marginBottom:24, fontSize:14 }}>{t('adminNoDataSub')}</div>
          <button onClick={seedDemo} style={{ padding:'12px 28px', borderRadius:12, background:'#6b46c1', border:'none', fontSize:15, fontWeight:700, color:'#fff', cursor:'pointer', fontFamily:'var(--font)' }}>
            {t('adminLoadDemoBtn')}
          </button>
        </div>
      ) : (
        <>
          {activeTab === 'overview'  && <><OverviewCards data={data} /><div style={{marginTop:28}}><ClinicalAnalytics data={data} /></div></>}
          {activeTab === 'clinical'  && <ClinicalAnalytics data={data} />}
          {activeTab === 'maternal'  && <MaternalHealth data={data} />}
          {activeTab === 'asha'      && <AshaPerformance data={data} />}
          {activeTab === 'network'   && <NetworkAnalytics data={data} />}
          {activeTab === 'emergency' && <EmergencyPanel data={data} />}
          {activeTab === 'messages'  && <MessagesPanel data={data} />}
          {activeTab === 'sync'      && <SyncMonitoring data={data} />}
          {activeTab === 'audit'     && <AuditLogs data={data} />}
        </>
      )}
    </DashboardLayout>
  );
}
