import '@testing-library/jest-dom';

// Mock de Web Audio API
const mockAudioContext = {
  createGain: () => ({
    gain: { value: 1, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createBiquadFilter: () => ({
    type: 'peaking',
    frequency: { value: 0, setValueAtTime: vi.fn() },
    Q: { value: 1, setValueAtTime: vi.fn() },
    gain: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createDynamicsCompressor: () => ({
    threshold: { value: -24, setValueAtTime: vi.fn() },
    knee: { value: 30, setValueAtTime: vi.fn() },
    ratio: { value: 12, setValueAtTime: vi.fn() },
    attack: { value: 0.003, setValueAtTime: vi.fn() },
    release: { value: 0.25, setValueAtTime: vi.fn() },
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createAnalyser: () => ({
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: vi.fn(),
    getByteTimeDomainData: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  createMediaElementSource: () => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }),
  destination: {},
  state: 'running',
  sampleRate: 44100,
  resume: vi.fn().mockResolvedValue(undefined),
  close: vi.fn().mockResolvedValue(undefined),
};

// @ts-expect-error mock
global.AudioContext = vi.fn(() => mockAudioContext);
// @ts-expect-error mock
global.webkitAudioContext = vi.fn(() => mockAudioContext);

// Mock de IndexedDB
const mockIDB = {
  open: vi.fn(),
};
// @ts-expect-error mock
global.indexedDB = mockIDB;

// Mock de matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock de navigator.mediaSession
Object.defineProperty(navigator, 'mediaSession', {
  writable: true,
  value: {
    metadata: null,
    setActionHandler: vi.fn(),
  },
});

// Mock de navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  writable: true,
  value: {
    register: vi.fn().mockResolvedValue({}),
    getRegistration: vi.fn().mockResolvedValue(undefined),
  },
});
