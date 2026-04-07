import { useEffect, useRef, useState } from 'react'

export function useAudioCapture() {
  const audioContextRef = useRef(null)
  const mediaStreamRef = useRef(null)
  const analyserRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)

  const startCapture = async () => {
    try {
      setError(null)

      // Initialize AudioContext if needed
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext
        if (!AudioContext) {
          throw new Error('Web Audio API not supported')
        }
        audioContextRef.current = new AudioContext()
      }

      // Request microphone access
      if (!mediaStreamRef.current) {
        mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        })
      }

      // Create analyser node if needed
      if (!analyserRef.current) {
        const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current)
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 2048
        source.connect(analyserRef.current)
      }

      setIsActive(true)
    } catch (err) {
      setError(err.message)
      console.error('Audio capture error:', err)
    }
  }

  const stopCapture = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop())
      mediaStreamRef.current = null
    }
    setIsActive(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCapture()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    isActive,
    startCapture,
    stopCapture,
    analyser: analyserRef.current,
    error,
    audioContext: audioContextRef.current,
  }
}
