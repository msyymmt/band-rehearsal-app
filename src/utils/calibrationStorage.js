const STORAGE_KEY = 'bandRehearsalCalibration'

export const defaultInstruments = [
  { id: 'bass', name: 'ベース', icon: '🎸' },
  { id: 'guitar', name: 'ギター', icon: '🎸' },
  { id: 'drums', name: 'ドラム', icon: '🥁' },
  { id: 'vocal', name: 'ボーカル', icon: '🎤' },
]

export function getCalibrationData() {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : null
}

export function setCalibrationData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function deleteCalibrationData() {
  localStorage.removeItem(STORAGE_KEY)
}

export function addInstrumentSample(instrumentId, frequencyData) {
  const calibration = getCalibrationData() || {}

  if (!calibration[instrumentId]) {
    calibration[instrumentId] = {
      name: defaultInstruments.find((i) => i.id === instrumentId)?.name || instrumentId,
      samples: [],
    }
  }

  calibration[instrumentId].samples.push(frequencyData)

  // Keep only last 5 samples
  if (calibration[instrumentId].samples.length > 5) {
    calibration[instrumentId].samples.shift()
  }

  // Calculate frequency range from all samples
  const freqRanges = calculateFrequencyRange(calibration[instrumentId].samples)
  calibration[instrumentId].minFreq = freqRanges.minFreq
  calibration[instrumentId].maxFreq = freqRanges.maxFreq
  calibration[instrumentId].peakFrequencies = freqRanges.peaks

  setCalibrationData(calibration)

  return calibration[instrumentId]
}

export function calculateFrequencyRange(samples) {
  if (samples.length === 0) {
    return { minFreq: 0, maxFreq: 0, peaks: [] }
  }

  const peaks = []

  samples.forEach((sample) => {
    if (sample && sample.length > 0) {
      let maxIndex = 0
      let maxValue = 0
      for (let i = 0; i < sample.length; i++) {
        if (sample[i] > maxValue) {
          maxValue = sample[i]
          maxIndex = i
        }
      }
      peaks.push(maxIndex)
    }
  })

  if (peaks.length === 0) {
    return { minFreq: 0, maxFreq: 0, peaks: [] }
  }

  const minBin = Math.min(...peaks)
  const maxBin = Math.max(...peaks)

  // Assuming 22050 Hz Nyquist frequency and 2048 FFT size
  const nyquist = 22050
  const binWidth = nyquist / 1024 // frequencyBinCount / 2

  return {
    minFreq: minBin * binWidth,
    maxFreq: maxBin * binWidth,
    peaks: peaks.map((bin) => bin * binWidth),
  }
}

export function getInstrumentCalibration(instrumentId) {
  const calibration = getCalibrationData()
  return calibration?.[instrumentId] || null
}

export function isCalibrated() {
  const calibration = getCalibrationData()
  return calibration && Object.keys(calibration).length > 0
}

export function getCalibrationProgress() {
  const calibration = getCalibrationData()
  if (!calibration) return 0
  return (Object.keys(calibration).length / defaultInstruments.length) * 100
}
