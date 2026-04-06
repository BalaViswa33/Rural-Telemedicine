import { useState, useRef } from 'react';

const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

const SYSTEM_PROMPT = `You have to act as a professional doctor, I know you are not but this is for learning purposes.
What's in this image? Do you find anything wrong with it medically?
If you make a differential, suggest some remedies for them. Do not add any numbers or special characters in 
your response. Your response should be in one long paragraph. Also, always answer as if you are answering a real person.
Do not say 'In the image I see' but say 'With what I see, I think you have ....'
Do not respond as an AI model in markdown. Your answer should mimic that of an actual doctor, not an AI bot.
Keep your answer concise (max 2 sentences). No preamble, start your answer right away please.`;

const iStyle = {
  width: '100%', padding: '10px 13px', background: '#fff',
  border: '1.5px solid var(--border)', borderRadius: 8,
  fontSize: 13.5, color: 'var(--text)', outline: 'none',
  fontFamily: 'var(--font)', transition: 'border-color .15s', boxSizing: 'border-box',
};

export default function AISymptomChecker({ patients = [] }) {
  const [patientId,    setPatientId]    = useState('');
  const [question,     setQuestion]     = useState('');
  const [apiKey,       setApiKey]       = useState('');
  const [image,        setImage]        = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [response,     setResponse]     = useState(null);
  const [error,        setError]        = useState(null);
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImage(ev.target.result);
      setImagePreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImage(null);
    setImagePreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!image && !question.trim()) { setError('Please upload an image or describe symptoms.'); return; }
    setLoading(true); setResponse(null); setError(null);

    const selectedPatient = patients.find(p => p.id === patientId);
    const userText = question.trim()
      ? (selectedPatient ? `Patient: ${selectedPatient.name}, Age: ${selectedPatient.age}, Gender: ${selectedPatient.gender}. ` : '') + question
      : 'Please analyze this medical image.';

    const content = [];
    if (image) {
      content.push({ type: 'image_url', image_url: { url: image } });
    }
    content.push({ type: 'text', text: userText });

    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content },
          ],
          max_tokens: 1024,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || `Groq API error ${res.status}`);
      setResponse(data.choices?.[0]?.message?.content || 'No response received.');
    } catch (err) {
      setError(err.message || 'Could not reach Groq API. Check your key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const card = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 12, padding: '22px 24px',
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 18 }}>

      <form onSubmit={handleSubmit}>
        <div style={card}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            🩺 AI Doctor — Symptom & Image Checker
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 20 }}>
            Powered by Groq · llama-4-scout · For learning purposes only
          </div>



          <div style={{ marginBottom: 14 }}>
            <FL label="Select Patient (optional)" />
            <select
              value={patientId} onChange={e => setPatientId(e.target.value)}
              style={{ ...iStyle, background: '#fff' }}
              onFocus={e => e.target.style.borderColor = '#c47d0a'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              <option value="">— No patient selected —</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name} · {p.age}y · {p.village}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <FL label="Your Question / Symptoms" />
            <textarea
              rows={4} value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="e.g. I have had high fever for 3 days and a rash on my arms. What could it be?"
              style={{ ...iStyle, resize: 'vertical' }}
              onFocus={e => e.target.style.borderColor = '#c47d0a'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <FL label="Upload Medical Image (optional)" />
            <div
              style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: '16px', textAlign: 'center', cursor: 'pointer', background: '#fafafa' }}
              onClick={() => fileRef.current?.click()}
            >
              {imagePreview ? (
                <div>
                  <img src={imagePreview} alt="preview" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 6, marginBottom: 8 }} />
                  <button type="button" onClick={e => { e.stopPropagation(); clearImage(); }}
                    style={{ fontSize: 11, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                    Remove image
                  </button>
                </div>
              ) : (
                <div style={{ color: 'var(--text3)', fontSize: 13 }}>
                  <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
                  Click to upload wound, rash, skin condition, X-ray, etc.
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
          </div>

          <button type="submit" disabled={loading}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, border: 'none',
              background: loading ? 'var(--surface3)' : '#c47d0a',
              color: loading ? 'var(--text3)' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '🔍 Analyzing...' : '🩺 Ask the AI Doctor'}
          </button>
        </div>
      </form>

      <div>
        {loading && (
          <div style={{ ...card, textAlign: 'center', padding: '60px 24px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 600 }}>AI Doctor is analyzing...</div>
          </div>
        )}

        {error && !loading && (
          <div style={{ ...card, background: '#fef2f2', border: '1.5px solid #fecaca' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>⚠️ Error</div>
            <div style={{ fontSize: 13, color: '#991b1b' }}>{error}</div>
          </div>
        )}

        {response && !loading && (
          <div style={{ ...card, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 28 }}>👨‍⚕️</span>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Doctor's Response</div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>llama-4-scout via Groq</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.8, padding: '14px 16px', background: 'rgba(255,255,255,0.8)', borderRadius: 8, border: '1px solid #bbf7d0' }}>
              {response}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 12, textAlign: 'center' }}>
              ⚕️ For learning purposes only. Always consult a qualified doctor for actual diagnosis and treatment.
            </div>
          </div>
        )}

        {!response && !loading && !error && (
          <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 320 }}>
            <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 13, padding: '0 20px' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>👨‍⚕️</div>
              <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text2)', fontSize: 14 }}>AI Doctor</div>
              <div style={{ lineHeight: 1.6 }}>
                Enter your Groq API key, describe symptoms or upload a medical image, then click Analyze.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FL({ label, required }) {
  return (
    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
      {label}{required && <span style={{ color: 'var(--red)', marginLeft: 2 }}>*</span>}
    </label>
  );
}
