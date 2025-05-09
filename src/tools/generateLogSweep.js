// generateLogSweep.js

const fs = require('fs');
const path = require('path');

// Konfiguration
const sampleRate = 44100;
const duration = 5; // Sekunden
const fStart = 20;     // Startfrequenz in Hz
const fEnd = 20000;    // Endfrequenz in Hz
const outputFilename = 'sweep_log_20Hz_20kHz.wav';

function generateLogSweep(f1, f2, duration, sampleRate) {
    const samples = duration * sampleRate;
    const sweep = new Int16Array(samples);

    const w1 = 2 * Math.PI * f1;
    const w2 = 2 * Math.PI * f2;
    const K = duration / Math.log(w2 / w1);
    const L = w1 * K;

    for (let i = 0; i < samples; i++) {
        const t = i / sampleRate;
        const angle = L * (Math.exp(t / K) - 1);
        sweep[i] = Math.round(Math.sin(angle) * 32767);
    }

    return createWavFile(sweep, sampleRate);
}

function createWavFile(samples, sampleRate) {
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * bitsPerSample / 8;
    const byteRate = sampleRate * blockAlign;
    const dataSize = samples.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeString = (offset, str) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    };

    // RIFF Header
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(8, 'WAVE');

    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);

    for (let i = 0; i < samples.length; i++) {
        view.setInt16(44 + i * 2, samples[i], true);
    }

    return new Uint8Array(buffer);
}

function saveTone(filename, wavData) {
    const outputDir = path.join(__dirname, '../assets/audio');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, Buffer.from(wavData));
    console.log(`✅ Sweep gespeichert unter: ${filePath}`);
}

// ▶️ Sweep erzeugen und speichern
const sweep = generateLogSweep(fStart, fEnd, duration, sampleRate);
saveTone(outputFilename, sweep);
