import { useSettings } from '../store';

export class SoundManager {
  ctx: AudioContext | null = null;
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq: number, type: OscillatorType, duration: number, vol: number = 0.5) {
    if (!this.ctx) return;
    const { sfxVol } = useSettings.getState();
    const finalVol = vol * sfxVol;
    if (finalVol <= 0) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    
    gain.gain.setValueAtTime(finalVol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  hover() {
    this.playTone(300, 'square', 0.1, 0.1);
  }

  click() {
    this.playTone(600, 'square', 0.1, 0.2);
  }

  win() {
    if (!this.ctx) return;
    this.playTone(440, 'square', 0.1, 0.2); // A4
    setTimeout(() => this.playTone(554, 'square', 0.1, 0.2), 100); // C#5
    setTimeout(() => this.playTone(659, 'square', 0.1, 0.2), 200); // E5
    setTimeout(() => this.playTone(880, 'square', 0.4, 0.2), 300); // A5 (High)
  }

  loss() {
    if (!this.ctx) return;
    this.playTone(300, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(280, 'sawtooth', 0.15, 0.2), 150);
    setTimeout(() => this.playTone(250, 'sawtooth', 0.4, 0.2), 300); // Descending
  }

  draw() {
    if (!this.ctx) return;
    this.playTone(350, 'sine', 0.2, 0.2);
    setTimeout(() => this.playTone(350, 'sine', 0.4, 0.2), 250);
  }

  move() {
    this.playTone(450, 'sine', 0.1, 0.1);
  }

  eat() {
    this.playTone(800, 'square', 0.1, 0.1);
    setTimeout(() => this.playTone(1200, 'square', 0.1, 0.1), 100);
  }
}

export const soundManager = new SoundManager();
