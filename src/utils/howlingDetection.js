export function detectHowling(frequencyData, audioContext, threshold = 200) {
  if (!frequencyData || !audioContext) {
    return { detected: false, frequency: 0, magnitude: 0 }
  }

  // Typical feedback frequencies are 2-5 kHz
  const minFeedbackFreq = 2000
  const maxFeedbackFreq = 5000
  const nyquist = audioContext.sampleRate / 2

  const minBin = Math.floor((minFeedbackFreq / nyquist) * frequencyData.length)
  const maxBin = Math.floor((maxFeedbackFreq / nyquist) * frequencyData.length)

  let maxValue = 0
  let maxIndex = 0

  for (let i = minBin; i <= Math.min(maxBin, frequencyData.length - 1); i++) {
    if (frequencyData[i] > maxValue) {
      maxValue = frequencyData[i]
      maxIndex = i
    }
  }

  // Check if peak is significantly higher than surrounding values (narrow peak = feedback)
  const surroundingAvg =
    (frequencyData[maxIndex - 5] || 0) +
    (frequencyData[maxIndex - 3] || 0) +
    (frequencyData[maxIndex + 3] || 0) +
    (frequencyData[maxIndex + 5] || 0)) /
    4

  const isNarrowPeak = maxValue > surroundingAvg * 1.5

  if (maxValue > threshold && isNarrowPeak) {
    const frequency = (maxIndex * nyquist) / frequencyData.length
    return {
      detected: true,
      frequency,
      magnitude: maxValue,
      recommendation: `${frequency.toFixed(0)} Hz でハウリング検知。Q=10 で -6dB カットを推奨`,
    }
  }

  return { detected: false, frequency: 0, magnitude: 0 }
}

export function getHowlingCutFrequencies(frequency) {
  // Common feedback frequencies and their harmonics
  const cutFrequencies = [
    frequency,
    frequency * 2,
    frequency / 2,
  ].filter((f) => f > 0 && f < 22050)

  return cutFrequencies
}
