import { useEffect, useRef, useState } from 'react'

export function useFrequencyAnalysis(analyser, audioContext) {
  const [frequencyData, setFrequencyData] = useState(null)
  const [peakFrequency, setPeakFrequency] = useState(0)
  const [peakMagnitude, setPeakMagnitude] = useState(0)
  const animationIdRef = useRef(null)

  useEffect(() => {
    if (!analyser || !audioContext) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const nyquist = audioContext.sampleRate / 2

    const updateFrequencyData = () => {
      analyser.getByteFrequencyData(dataArray)
      setFrequencyData(new Uint8Array(dataArray))

      // Find peak frequency
      let maxValue = 0
      let maxIndex = 0
      for (let i = 0; i < dataArray.length; i++) {
        if (dataArray[i] > maxValue) {
          maxValue = dataArray[i]
          maxIndex = i
        }
      }

      // Convert bin index to frequency (Hz)
      const frequency = (maxIndex * nyquist) / dataArray.length
      setPeakFrequency(frequency)
      setPeakMagnitude(maxValue)

      animationIdRef.current = requestAnimationFrame(updateFrequencyData)
    }

    updateFrequencyData()

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [analyser, audioContext])

  const getFrequencyLabel = (binIndex) => {
    if (!audioContext) return ''
    const nyquist = audioContext.sampleRate / 2
    const frequency = (binIndex * nyquist) / (analyser?.frequencyBinCount || 1)
    return frequency.toFixed(0)
  }

  return {
    frequencyData,
    peakFrequency,
    peakMagnitude,
    getFrequencyLabel,
  }
}
