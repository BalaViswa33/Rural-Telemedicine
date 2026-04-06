import { useState, useRef } from 'react';
import { useNetwork } from '../network/networkContext.jsx';

/* ─────────────────────────────────────────────────────────────────────────────
   StoreAndForward — handles both 2G (image+text) and None (text-only) modes.
   Props:
     mode       : '2G' | 'None'
     patientName: string
     patientId  : string
─────────────────────────────────────────────────────────────────────────────── */
export default function StoreAndForward({ mode, patientName, patientId }) {
  const { saveConsultation, refreshPending } = useNetwork();
  const [description, setDescription]   = useState('');
  const [imageFile,   setImageFile]      = useState(null);
  const [imagePreview, setImagePreview]  = useState(null);
  const [uploadState, setUploadState]    = useState('idle'); // idle|uploading|done
  const [savedRecord, setSavedRecord]    = useState(null);
  const fileRef = useRef(null);

  const is2G = mode === '2G';

  const pickImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSend = async () => {
    if (!description.trim()) {
      alert('Please describe the patient issue before sending.');
      return;
    }
    if (is2G && !imageFile) {
      alert('Please attach an image for Store-and-Forward mode.');
      return;
    }

    setUploadState('uploading');

    // Simulate compression / base64 encode for IndexedDB storage
    let imageData = null;
    if (imageFile) {
      imageData = await toBase64(imageFile);
    }

    await new Promise(r => setTimeout(r, is2G ? 1800 : 600)); // fake upload time

    const record = await saveConsultation({
      patientId:   patientId   || 'unknown',
      patientName: patientName || 'Unknown',
      description: description.trim(),
      imageData,
      imageName:   imageFile?.name || null,
      networkMode: mode,
    });

    await refreshPending();
    setUploadState('done');
    setSavedRecord(record);
  };

  const reset = () => {
    setDescription(''); setImageFile(null); setImagePreview(null);
    setUploadState('idle'); setSavedRecord(null);
  };

  /* ── Success state ── */
  if (uploadState === 'done' && savedRecord) {
    return (
      <div style={{ textAlign:'center', padding:'32px 20px' }}>
        <div style={{ fontSize:52, marginBottom:12 }}>{is2G ? '📤' : '💾'}</div>
        <div style={{ fontSize:17, fontWeight:800, color:'var(--text)', marginBottom:8 }}>
          {is2G ? 'Sent to Doctor!' : 'Saved Offline!'}
        </div>
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:20, lineHeight:1.7 }}>
          {is2G
            ? 'Your image and description have been queued for the doctor.'
            : 'Saved locally. Will auto-sync when you have internet.'}
        </div>
        <div style={{ background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', marginBottom:20, textAlign:'left' }}>
          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>Record ID</div>
          <div style={{ fontSize:12, color:'var(--text2)', fontFamily:'var(--mono)' }}>{savedRecord.id}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:8 }}>{new Date(savedRecord.createdAt).toLocaleString('en-IN')}</div>
        </div>
        <button onClick={reset} style={{ padding:'11px 24px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:10, color:'var(--text2)', fontSize:13, fontWeight:700, fontFamily:'var(--font)' }}>
          + New Consultation
        </button>
      </div>
    );
  }

  /* ── Main form ── */
  return (
    <div>
      {/* Mode banner */}
      <div style={{ background: is2G ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${is2G ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius:12, padding:'12px 16px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:10 }}>
        <span style={{ fontSize:20, flexShrink:0 }}>{is2G ? '📡' : '🔴'}</span>
        <div>
          <div style={{ fontSize:14, fontWeight:700, color: is2G ? '#eab308' : '#ef4444', marginBottom:2 }}>
            {is2G ? 'Store-and-Forward Mode' : 'Offline Save Mode'}
          </div>
          <div style={{ fontSize:12, color:'var(--text3)' }}>
            {is2G
              ? 'Low bandwidth detected. Upload a photo + description — the doctor will review when synced.'
              : 'No internet connection. Your description will be saved locally and auto-synced when you reconnect.'}
          </div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: is2G ? '1fr 1fr' : '1fr', gap:18 }}>
        {/* Left: image upload (2G only) */}
        {is2G && (
          <div>
            <FieldLabel>Patient Photo / Document</FieldLabel>
            <div
              onClick={() => fileRef.current?.click()}
              style={{
                border:'2px dashed var(--border2)', borderRadius:14, cursor:'pointer',
                background:'var(--surface2)', overflow:'hidden',
                minHeight:160, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              }}
            >
              {imagePreview
                ? <img src={imagePreview} alt="preview" style={{ width:'100%', objectFit:'cover', maxHeight:220 }} />
                : <><div style={{ fontSize:32, marginBottom:8 }}>📸</div><div style={{ fontSize:13, color:'var(--text3)' }}>Click to attach image</div></>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} style={{ display:'none' }} />
            {imageFile && (
              <div style={{ marginTop:8, fontSize:12, color:'var(--text3)' }}>
                📎 {imageFile.name} · {(imageFile.size / 1024).toFixed(0)} KB
              </div>
            )}
          </div>
        )}

        {/* Right (or full-width for None): description */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <FieldLabel>Describe Patient Issue{!is2G && ' *'}</FieldLabel>
            <textarea
              rows={is2G ? 6 : 8}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={is2G
                ? 'Describe the symptoms, location of pain, duration…'
                : 'Describe the patient\'s issue in detail. This will be synced to the doctor when internet returns.'}
              style={{
                width:'100%', padding:'12px 14px',
                background:'var(--surface2)', border:'1.5px solid var(--border)',
                borderRadius:12, fontSize:14, color:'var(--text)', outline:'none',
                fontFamily:'var(--font)', resize:'vertical', lineHeight:1.6,
                boxSizing:'border-box', transition:'border-color .2s',
              }}
              onFocus={e => e.target.style.borderColor = is2G ? '#eab308' : '#ef4444'}
              onBlur={e  => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ fontSize:11, color:'var(--text3)', marginTop:4, textAlign:'right' }}>
              {description.length} chars
            </div>
          </div>

          {/* Offline notice for None */}
          {!is2G && (
            <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:10, fontSize:12, color:'#ef4444' }}>
              📴 No internet. Data saved in device storage and will sync automatically when you reconnect.
            </div>
          )}

          <button
            onClick={handleSend}
            disabled={uploadState === 'uploading'}
            style={{
              padding:'13px', borderRadius:12, border:'none',
              background: uploadState === 'uploading' ? 'var(--surface3)' : (is2G ? '#eab308' : '#ef4444'),
              color: is2G ? '#0b0f18' : '#fff',
              fontSize:14, fontWeight:800, fontFamily:'var(--font)',
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              opacity: uploadState === 'uploading' ? 0.85 : 1,
            }}
          >
            {uploadState === 'uploading'
              ? <><Spinner />{is2G ? 'Uploading…' : 'Saving…'}</>
              : is2G ? '📤 Send to Doctor' : '💾 Save Offline'
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── helpers ── */
function FieldLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>{children}</div>;
}

function Spinner() {
  return <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />;
}

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload  = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}
