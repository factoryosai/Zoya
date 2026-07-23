// Web Audio API ambient noise & synth generator for focus
let audioCtx: AudioContext | null = null;
let activeNode: { stop: () => void } | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export type SoundscapeType = "none" | "rain" | "space" | "binaural" | "waves";

export function playSoundscape(type: SoundscapeType, volume: number = 0.3) {
  stopSoundscape();
  if (type === "none") return;

  const ctx = getAudioContext();
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(volume, ctx.currentTime);
  masterGain.connect(ctx.destination);

  if (type === "rain") {
    // Pink noise for rain sound
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      data[i] *= 0.11;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Filter to make it sound like gentle falling rain
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    noise.connect(filter);
    filter.connect(masterGain);
    noise.start();

    activeNode = {
      stop: () => {
        try {
          noise.stop();
          noise.disconnect();
        } catch (e) {}
      }
    };
  } else if (type === "space") {
    // Deep cosmic ambient drone synth
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();

    osc1.type = "sine";
    osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(110.5, ctx.currentTime); // Soft detuned octave

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, ctx.currentTime);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(masterGain);

    osc1.start();
    osc2.start();

    activeNode = {
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
        } catch (e) {}
      }
    };
  } else if (type === "binaural") {
    // 10Hz Alpha wave binaural beat for deep focus
    const oscL = ctx.createOscillator();
    const oscR = ctx.createOscillator();
    const merger = ctx.createChannelMerger(2);

    oscL.type = "sine";
    oscL.frequency.setValueAtTime(200, ctx.currentTime);
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(210, ctx.currentTime); // 10Hz diff

    oscL.connect(merger, 0, 0); // left channel
    oscR.connect(merger, 0, 1); // right channel
    merger.connect(masterGain);

    oscL.start();
    oscR.start();

    activeNode = {
      stop: () => {
        try {
          oscL.stop();
          oscR.stop();
          oscL.disconnect();
          oscR.disconnect();
        } catch (e) {}
      }
    };
  } else if (type === "waves") {
    // Soothing ocean cyber waves
    const bufferSize = ctx.sampleRate * 3;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    
    // LFO for wave modulation
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8 second wave cycle
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(400, ctx.currentTime);

    filter.frequency.setValueAtTime(500, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(masterGain);

    lfo.start();
    noise.start();

    activeNode = {
      stop: () => {
        try {
          noise.stop();
          lfo.stop();
          noise.disconnect();
          lfo.disconnect();
        } catch (e) {}
      }
    };
  }
}

export function stopSoundscape() {
  if (activeNode) {
    activeNode.stop();
    activeNode = null;
  }
}
