// Network utility — adaptive communication based on signal strength
// Modes:
//   strong  → 4G/WiFi     → Video call
//   medium  → 3G           → Audio call
//   weak    → 2G           → Compressed image upload
//   none    → No signal    → Mesh network text (Bluetooth LE / BroadcastChannel simulation)

// ─────────────────────────────────────────────
// Signal detection
// ─────────────────────────────────────────────

/**
 * Detect current network quality.
 * Returns: 'strong' | 'medium' | 'weak' | 'none'
 */
export function getNetworkQuality() {
  if (!navigator.onLine) return 'none';

  const conn =
    navigator.connection ||
    navigator.mozConnection ||
    navigator.webkitConnection;

  if (!conn) {
    // Fallback: assume strong if online but API unavailable
    return 'strong';
  }

  const { effectiveType, downlink, rtt } = conn;

  // Map effective type directly
  if (effectiveType === '4g' || effectiveType === 'wifi') return 'strong';
  if (effectiveType === '3g') return 'medium';
  if (effectiveType === '2g' || effectiveType === 'slow-2g') return 'weak';

  // Fallback: use raw downlink / RTT
  if (downlink >= 1.5 && rtt < 300) return 'strong';
  if (downlink >= 0.3 && rtt < 600) return 'medium';
  if (downlink > 0) return 'weak';

  return 'none';
}

/**
 * Returns a human-readable label + color for the current quality.
 */
export function getNetworkInfo(quality) {
  const map = {
    strong: {
      label: 'Strong Signal (4G/WiFi)',
      color: '#10b981',
      icon: '📶',
      bars: 4,
      recommendation: 'Video consultation available',
    },
    medium: {
      label: 'Medium Signal (3G)',
      color: '#3b82f6',
      icon: '📶',
      bars: 3,
      recommendation: 'Audio call recommended',
    },
    weak: {
      label: 'Weak Signal (2G)',
      color: '#f59e0b',
      icon: '📡',
      bars: 1,
      recommendation: 'Send a compressed image of your issue',
    },
    none: {
      label: 'No Signal',
      color: '#ef4444',
      icon: '❌',
      bars: 0,
      recommendation: 'Using mesh network for text messaging',
    },
  };
  return map[quality] || map['none'];
}

// ─────────────────────────────────────────────
// Image compression (for 2G uploads)
// ─────────────────────────────────────────────

/**
 * Compress an image File/Blob using canvas.
 * @param {File} file - Original image file
 * @param {number} maxWidth - Max width in px (default 800)
 * @param {number} quality  - JPEG quality 0-1 (default 0.5)
 * @returns {Promise<Blob>} Compressed image blob
 */
export function compressImage(file, maxWidth = 800, quality = 0.5) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas compression failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = evt.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Returns a human-readable size string.
 */
export function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ─────────────────────────────────────────────
// Mesh network (offline text via BroadcastChannel)
// Simulates Bluetooth mesh / WiFi Direct for same-origin contexts.
// In a real deployment, replace with a proper Bluetooth LE / mesh SDK.
// ─────────────────────────────────────────────

const MESH_CHANNEL = 'health-mesh-network';
let meshChannel = null;
const meshListeners = new Set();

function getMeshChannel() {
  if (!meshChannel && typeof BroadcastChannel !== 'undefined') {
    meshChannel = new BroadcastChannel(MESH_CHANNEL);
    meshChannel.onmessage = (event) => {
      meshListeners.forEach((cb) => cb(event.data));
    };
  }
  return meshChannel;
}

/**
 * Send a text message over the mesh network.
 * @param {{ from: string, to: string, text: string }} message
 */
export function sendMeshMessage(message) {
  const ch = getMeshChannel();
  if (!ch) {
    console.warn('BroadcastChannel not supported — mesh unavailable');
    return false;
  }
  const payload = {
    ...message,
    id: `mesh_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    type: 'mesh_text',
  };
  ch.postMessage(payload);

  // Also persist locally so the sender can see it
  saveMeshMessage(payload);
  return true;
}

/**
 * Register a callback to receive incoming mesh messages.
 * @param {Function} callback
 * @returns {Function} Unsubscribe function
 */
export function onMeshMessage(callback) {
  getMeshChannel(); // ensure channel is open
  meshListeners.add(callback);
  return () => meshListeners.delete(callback);
}

// Persist mesh messages in localStorage so they survive page reloads
function saveMeshMessage(msg) {
  try {
    const existing = JSON.parse(localStorage.getItem('meshMessages') || '[]');
    existing.push(msg);
    // Keep last 100 messages
    const trimmed = existing.slice(-100);
    localStorage.setItem('meshMessages', JSON.stringify(trimmed));
  } catch (_) {}
}

export function getMeshHistory() {
  try {
    return JSON.parse(localStorage.getItem('meshMessages') || '[]');
  } catch (_) {
    return [];
  }
}

export function clearMeshHistory() {
  localStorage.removeItem('meshMessages');
}
