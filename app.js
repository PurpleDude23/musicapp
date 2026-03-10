/**
 * Pulse — Music Studio
 * Synth, drums, and step sequencer powered by Tone.js
 */

(function () {
  'use strict';

  const KEY_LAYOUT = [
    { note: 'C4', type: 'white', key: 'a' },
    { note: 'C#4', type: 'black', key: 'w' },
    { note: 'D4', type: 'white', key: 's' },
    { note: 'D#4', type: 'black', key: 'e' },
    { note: 'E4', type: 'white', key: 'd' },
    { note: 'F4', type: 'white', key: 'f' },
    { note: 'F#4', type: 'black', key: 't' },
    { note: 'G4', type: 'white', key: 'g' },
    { note: 'G#4', type: 'black', key: 'y' },
    { note: 'A4', type: 'white', key: 'h' },
    { note: 'A#4', type: 'black', key: 'u' },
    { note: 'B4', type: 'white', key: 'j' },
    { note: 'C5', type: 'white', key: 'k' },
    { note: 'C#5', type: 'black', key: 'o' },
    { note: 'D5', type: 'white', key: 'l' },
    { note: 'D#5', type: 'black', key: 'p' },
    { note: 'E5', type: 'white', key: ';' },
  ];

  const STEPS = 16;
  const SEQUENCER_ROWS = [
    { id: 'kick', label: 'Kick' },
    { id: 'snare', label: 'Snare' },
    { id: 'hihat', label: 'HiHat' },
    { id: 'clap', label: 'Clap' },
  ];

  let synth;
  let drumSounds = {};
  let sequencerState = {};
  let started = false;

  function initSynth() {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.5,
      },
    }).toDestination();
  }

  function initDrums() {
    const kick = new Tone.MembraneSynth({ pitchDecay: 0.05, octaves: 8 }).toDestination();
    const snare = new Tone.MetalSynth({
      frequency: 200,
      envelope: { decay: 0.1 },
      harmonicity: 8,
      modulationIndex: 32,
    }).toDestination();
    const noise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { decay: 0.05 } }).toDestination();
    const clapNoise = new Tone.NoiseSynth({ noise: { type: 'white' }, envelope: { decay: 0.1 } }).toDestination();

    drumSounds.kick = () => kick.triggerAttackRelease('C1', 0.2);
    drumSounds.snare = () => {
      snare.triggerAttackRelease('C4', 0.1);
      noise.triggerAttackRelease(0.05);
    };
    drumSounds.hihat = () => noise.triggerAttackRelease(0.02);
    drumSounds.clap = () => clapNoise.triggerAttackRelease(0.08);
    drumSounds.tom = () => new Tone.MembraneSynth().toDestination().triggerAttackRelease('A2', 0.2);
    drumSounds.openhat = () => noise.triggerAttackRelease(0.15);
    const tomSynth = new Tone.MembraneSynth().toDestination();
    drumSounds.tom = () => tomSynth.triggerAttackRelease('A2', 0.2);
  }

  function buildKeyboard() {
    const container = document.getElementById('keyboard');
    const whites = KEY_LAYOUT.filter(k => k.type === 'white');
    const totalWhite = whites.length;

    KEY_LAYOUT.forEach((keyDef, i) => {
      const el = document.createElement('div');
      el.className = `key ${keyDef.type}`;
      el.dataset.note = keyDef.note;
      el.setAttribute('data-key', keyDef.key);

      if (keyDef.type === 'black') {
        const whiteBefore = KEY_LAYOUT.slice(0, i).filter(k => k.type === 'white').length;
        el.style.left = `calc(${(whiteBefore / totalWhite) * 100}% + 12px)`;
      }
      container.appendChild(el);
    });
  }

  function playNote(note, down) {
    if (!synth) return;
    if (down) {
      synth.triggerAttack(note);
      document.querySelector(`.key[data-note="${note}"]`)?.classList.add('active');
    } else {
      synth.triggerRelease(note);
      document.querySelector(`.key[data-note="${note}"]`)?.classList.remove('active');
    }
  }

  function bindKeyboard() {
    const attackEl = document.getElementById('attack');
    const releaseEl = document.getElementById('release');

    attackEl.addEventListener('input', () => {
      if (synth) synth.set({ envelope: { attack: parseFloat(attackEl.value) } });
    });
    releaseEl.addEventListener('input', () => {
      if (synth) synth.set({ envelope: { release: parseFloat(releaseEl.value) } });
    });

    document.getElementById('keyboard').addEventListener('mousedown', (e) => {
      const key = e.target.closest('.key');
      if (!key || !key.dataset.note) return;
      e.preventDefault();
      playNote(key.dataset.note, true);
    });

    document.addEventListener('mouseup', () => {
      KEY_LAYOUT.forEach(k => playNote(k.note, false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const keyDef = KEY_LAYOUT.find(k => k.key === e.key);
      if (keyDef) {
        e.preventDefault();
        playNote(keyDef.note, true);
      }
    });

    document.addEventListener('keyup', (e) => {
      const keyDef = KEY_LAYOUT.find(k => k.key === e.key);
      if (keyDef) {
        e.preventDefault();
        playNote(keyDef.note, false);
      }
    });
  }

  function bindDrums() {
    document.getElementById('drumPads').addEventListener('click', (e) => {
      const pad = e.target.closest('.drum-pad');
      if (!pad || !pad.dataset.note) return;
      const note = pad.dataset.note;
      if (drumSounds[note]) {
        drumSounds[note]();
        pad.classList.add('triggered');
        setTimeout(() => pad.classList.remove('triggered'), 120);
      }
    });
  }

  function buildSequencer() {
    SEQUENCER_ROWS.forEach(({ id, label }) => {
      sequencerState[id] = Array(STEPS).fill(0);
    });

    const grid = document.getElementById('sequencer');
    SEQUENCER_ROWS.forEach(({ id, label }) => {
      const row = document.createElement('div');
      row.className = 'seq-row';
      row.innerHTML = `<span class="seq-label">${label}</span><div class="seq-steps" data-row="${id}"></div>`;
      const stepsEl = row.querySelector('.seq-steps');
      for (let i = 0; i < STEPS; i++) {
        const step = document.createElement('button');
        step.type = 'button';
        step.className = 'seq-step';
        step.dataset.row = id;
        step.dataset.step = i;
        step.addEventListener('click', () => {
          sequencerState[id][i] = sequencerState[id][i] ? 0 : 1;
          step.classList.toggle('on', sequencerState[id][i]);
        });
        stepsEl.appendChild(step);
      }
      grid.appendChild(row);
    });
  }

  function scheduleSequencer() {
    Tone.Transport.scheduleRepeat((time) => {
      const sixteenth = Tone.Transport.position.split(':').map(Number);
      const step = (sixteenth[0] * 16 + sixteenth[1] * 4 + sixteenth[2]) % STEPS;
      document.querySelectorAll('.seq-step').forEach(s => s.classList.remove('current'));
      document.querySelectorAll(`.seq-step[data-step="${step}"]`).forEach(s => s.classList.add('current'));

      SEQUENCER_ROWS.forEach(({ id }) => {
        if (sequencerState[id] && sequencerState[id][step] && drumSounds[id]) {
          Tone.Draw.schedule(() => drumSounds[id](), time);
        }
      });
    }, '16n');
  }

  function bindTransport() {
    const playBtn = document.getElementById('playBtn');
    const stopBtn = document.getElementById('stopBtn');
    const bpmInput = document.getElementById('bpm');
    const bpmVal = document.getElementById('bpmVal');

    playBtn.addEventListener('click', async () => {
      if (!started) {
        await Tone.start();
        started = true;
      }
      if (Tone.Transport.state === 'started') {
        Tone.Transport.pause();
        playBtn.classList.remove('playing');
        playBtn.setAttribute('aria-label', 'Play');
      } else {
        Tone.Transport.start();
        playBtn.classList.add('playing');
        playBtn.setAttribute('aria-label', 'Pause');
      }
    });

    stopBtn.addEventListener('click', () => {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      scheduleSequencer();
      playBtn.classList.remove('playing');
      playBtn.setAttribute('aria-label', 'Play');
    });

    bpmInput.addEventListener('input', () => {
      const val = parseInt(bpmInput.value, 10);
      Tone.Transport.bpm.value = val;
      bpmVal.textContent = val;
    });

    bpmVal.textContent = bpmInput.value;
    Tone.Transport.bpm.value = parseInt(bpmInput.value, 10);
  }

  function init() {
    initSynth();
    initDrums();
    buildKeyboard();
    buildSequencer();
    scheduleSequencer();
    bindKeyboard();
    bindDrums();
    bindTransport();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
