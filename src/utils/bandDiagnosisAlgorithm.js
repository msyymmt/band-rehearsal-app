import { getCalibrationData } from './calibrationStorage'

export function analyzeBandBalance(frequencyData, audioContext) {
  if (!frequencyData || !audioContext) {
    return null
  }

  const calibration = getCalibrationData()
  if (!calibration) {
    return null
  }

  const nyquist = audioContext.sampleRate / 2
  const binWidth = nyquist / frequencyData.length

  // Calculate volume for each instrument's band
  const instrumentStatus = {}
  let totalAnalyzed = 0
  let vocalMasked = false
  let vocalVolume = 0

  for (const [instrumentId, calibData] of Object.entries(calibration)) {
    if (!calibData.minFreq || !calibData.maxFreq) continue

    const minBin = Math.floor(calibData.minFreq / binWidth)
    const maxBin = Math.floor(calibData.maxFreq / binWidth)

    let sum = 0
    let count = 0

    for (let i = minBin; i <= Math.min(maxBin, frequencyData.length - 1); i++) {
      if (i >= 0) {
        sum += frequencyData[i]
        count++
      }
    }

    const avgVolume = count > 0 ? sum / count : 0
    const normalizedVolume = (avgVolume / 255) * 100

    instrumentStatus[instrumentId] = {
      name: calibData.name,
      volume: normalizedVolume,
      minFreq: calibData.minFreq,
      maxFreq: calibData.maxFreq,
      interference: [],
    }

    if (instrumentId === 'vocal') {
      vocalVolume = normalizedVolume
    }

    totalAnalyzed++
  }

  // Check for interference/masking
  for (const [instrumentId, status] of Object.entries(instrumentStatus)) {
    if (instrumentId === 'vocal') continue

    // If non-vocal instrument is louder than vocal, flag as interference
    if (status.volume > vocalVolume * 1.2) {
      const startFreq = Math.round(status.minFreq / 100) * 100
      const endFreq = Math.round(status.maxFreq / 100) * 100
      status.interference.push(`${startFreq}-${endFreq}Hz`)

      if (!vocalMasked) {
        vocalMasked = true
      }
    }
  }

  // Calculate overall score
  let score = 100

  // Reduce score if vocal is masked
  if (vocalMasked && vocalVolume > 0) {
    score -= 30
  }

  // Check for extreme imbalance (any instrument significantly louder)
  const instrumentVolumes = Object.values(instrumentStatus)
    .filter((s) => s.name !== 'ボーカル')
    .map((s) => s.volume)

  if (instrumentVolumes.length > 0) {
    const maxVolume = Math.max(...instrumentVolumes)
    const minVolume = Math.min(...instrumentVolumes)

    if (maxVolume > minVolume * 2) {
      score -= 15
    }
  }

  // Determine status
  let status = 'OK'
  if (score < 70) {
    status = '警告'
  } else if (score < 85) {
    status = '要調整'
  }

  // Generate recommendations
  const recommendations = []

  if (vocalMasked) {
    recommendations.push('ボーカルがマスクされています。下記の楽器をカットしてください')

    for (const [instrumentId, instStatus] of Object.entries(instrumentStatus)) {
      if (instStatus.interference.length > 0) {
        recommendations.push(`- ${instStatus.name}: ${instStatus.interference.join(', ')} をカット`)
      }
    }
  }

  // Check for high-frequency dominance
  const highFreqStart = audioContext.sampleRate / 4
  let highFreqSum = 0
  let highFreqCount = 0

  for (let i = Math.floor(highFreqStart / binWidth); i < frequencyData.length; i++) {
    highFreqSum += frequencyData[i]
    highFreqCount++
  }

  const highFreqAvg = highFreqCount > 0 ? highFreqSum / highFreqCount : 0
  const lowFreqAvg = frequencyData.slice(0, Math.floor(highFreqStart / binWidth / 2)).reduce((a, b) => a + b, 0) / (Math.floor(highFreqStart / binWidth / 2) || 1)

  if (highFreqAvg > lowFreqAvg * 1.5) {
    recommendations.push('高音域が強すぎます。3000Hz 以上をカットしてください')
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    status,
    instrumentStatus,
    recommendations,
    vocalMasked,
    isValid: totalAnalyzed > 0,
  }
}

export function getEQSuggestions(diagnosis, instrumentId) {
  if (!diagnosis || !diagnosis.instrumentStatus[instrumentId]) {
    return []
  }

  const suggestions = []
  const instStatus = diagnosis.instrumentStatus[instrumentId]

  if (instrumentId === 'vocal') {
    // Vocal should be clear and present
    suggestions.push({
      frequency: '100-300Hz',
      action: '+3dB',
      reason: 'ボーカルの厚みと安定感を出す',
    })
    suggestions.push({
      frequency: '2000-4000Hz',
      action: '+2dB',
      reason: 'ボーカルのクリアさと明るさ',
    })
    suggestions.push({
      frequency: '6000-8000Hz',
      action: '+1dB',
      reason: 'ボーカルの存在感を強調',
    })

    // Reduce problematic bands from other instruments
    if (diagnosis.vocalMasked) {
      for (const [otherId, otherStatus] of Object.entries(diagnosis.instrumentStatus)) {
        if (otherId === 'vocal' || otherStatus.interference.length === 0) continue
        suggestions.push({
          frequency: `${Math.round(otherStatus.minFreq)}-${Math.round(otherStatus.maxFreq)}Hz`,
          action: '-2dB to -4dB',
          reason: `${otherStatus.name}がボーカルをマスク`,
        })
      }
    }
  } else {
    // Other instruments
    const baseFreq = instStatus.minFreq
    if (baseFreq < 100) {
      suggestions.push({
        frequency: `${Math.round(baseFreq)}-${Math.round(baseFreq * 1.5)}Hz`,
        action: '+2dB',
        reason: '低音のパンチを出す',
      })
    }

    // Reduce overlap with vocal
    if (instStatus.interference.length > 0) {
      suggestions.push({
        frequency: instStatus.interference[0],
        action: '-3dB',
        reason: 'ボーカルとの競合を軽減',
      })
    }
  }

  return suggestions
}
