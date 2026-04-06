// Browser notification and reminder management

class NotificationManager {
  constructor() {
    this.permission = 'default';
    this.scheduledReminders = new Map();
  }

  async requestPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    }

    return false;
  }

  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '💊',
        badge: '💊',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
    return null;
  }

  scheduleReminder(id, medicine, time) {
    // Clear existing reminder if any
    this.cancelReminder(id);

    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const delay = reminderTime - now;

    const timeoutId = setTimeout(() => {
      this.showNotification(`Medicine Reminder: ${medicine.name}`, {
        body: `Time to take ${medicine.dosage} of ${medicine.name}`,
        tag: `medicine-${id}`,
        requireInteraction: true,
        vibrate: [200, 100, 200]
      });

      // Play notification sound (if browser supports)
      this.playNotificationSound();

      // Reschedule for next day
      this.scheduleReminder(id, medicine, time);
    }, delay);

    this.scheduledReminders.set(id, timeoutId);
  }

  cancelReminder(id) {
    if (this.scheduledReminders.has(id)) {
      clearTimeout(this.scheduledReminders.get(id));
      this.scheduledReminders.delete(id);
    }
  }

  cancelAllReminders() {
    this.scheduledReminders.forEach(timeoutId => clearTimeout(timeoutId));
    this.scheduledReminders.clear();
  }

  playNotificationSound() {
    // Create a simple beep sound using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  getTimeUntilReminder(time) {
    const now = new Date();
    const [hours, minutes] = time.split(':').map(Number);
    
    const reminderTime = new Date(now);
    reminderTime.setHours(hours, minutes, 0, 0);

    if (reminderTime <= now) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const diff = reminderTime - now;
    const hoursUntil = Math.floor(diff / (1000 * 60 * 60));
    const minutesUntil = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours: hoursUntil, minutes: minutesUntil };
  }
}

// Text-to-Speech utility
class SpeechManager {
  constructor() {
    this.synthesis = window.speechSynthesis;
    this.speaking = false;
  }

  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configure voice options
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1;
    utterance.volume = options.volume || 1;
    utterance.lang = options.lang || 'en-US';

    // Try to use a female voice if available
    const voices = this.synthesis.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('samantha') ||
      voice.name.toLowerCase().includes('victoria')
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }

    utterance.onstart = () => {
      this.speaking = true;
    };

    utterance.onend = () => {
      this.speaking = false;
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      this.speaking = false;
    };

    this.synthesis.speak(utterance);
  }

  stop() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.speaking = false;
    }
  }

  pause() {
    if (this.synthesis && this.speaking) {
      this.synthesis.pause();
    }
  }

  resume() {
    if (this.synthesis && this.speaking) {
      this.synthesis.resume();
    }
  }

  isSpeaking() {
    return this.speaking;
  }

  // Helper to speak prescription
  speakPrescription(medicine) {
    const text = `
      Medicine: ${medicine.name}.
      Dosage: ${medicine.dosage}.
      Frequency: ${medicine.frequency}.
      Timing: ${medicine.timing.join(', ')}.
      Duration: ${medicine.duration}.
    `;
    this.speak(text);
  }

  // Helper to speak all medicines
  speakAllMedicines(medicines) {
    const intro = 'Your prescription includes the following medicines. ';
    const medicineTexts = medicines.map((med, index) => {
      return `
        Medicine ${index + 1}: ${med.name}.
        Take ${med.dosage}, ${med.frequency}.
        Timing: ${med.timing.join(', ')}.
        For ${med.duration}.
      `;
    });

    this.speak(intro + medicineTexts.join(' Next, '));
  }
}

export const notificationManager = new NotificationManager();
export const speechManager = new SpeechManager();
