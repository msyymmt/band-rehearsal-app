import { useState, useEffect } from 'react'
import { useAudioCapture } from './hooks/useAudioCapture'
import { useFrequencyAnalysis } from './hooks/useFrequencyAnalysis'
import { AudioControl } from './components/AudioControl'
import { SpectrumDisplay } from './components/SpectrumDisplay'
import './App.css'

export default function App() {
  const [appState, setAppState] = useState('startup') // startup, calibration, analysis
  const { isActive, startCapture, stopCapture, analyser, error: audioError, audioContext } = useAudioCapture()
  const { frequencyData, peakFrequency } = useFrequencyAnalysis(analyser, audioContext)

  useEffect(() => {
    // Check if browser supports Web Audio API
    const audioContextClass = window.AudioContext || window.webkitAudioContext
    if (!audioContextClass) {
      return
    }

    // Check if calibration data exists in localStorage
    const calibrationData = localStorage.getItem('bandRehearsalCalibration')
    if (calibrationData) {
      setAppState('analysis')
    } else {
      setAppState('calibration')
    }
  }, [])

  const handleStartCalibration = () => {
    setAppState('calibration')
  }

  const handleCalibrationComplete = () => {
    setAppState('analysis')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎸 Band Rehearsal Analyzer</h1>
      </header>

      {audioError && (
        <div className="error-banner">
          <p>Error: {audioError}</p>
        </div>
      )}

      {appState === 'startup' && (
        <div className="startup-screen">
          <p>Loading...</p>
        </div>
      )}

      {appState === 'calibration' && (
        <div className="calibration-screen">
          <h2>楽器キャリブレーション</h2>
          <p>各楽器の周波数特性を学習させてください。</p>
          <button onClick={handleStartCalibration}>開始</button>
        </div>
      )}

      {appState === 'analysis' && (
        <div className="analysis-screen">
          <AudioControl isActive={isActive} onStart={startCapture} onStop={stopCapture} error={audioError} />

          {audioContext && frequencyData && (
            <SpectrumDisplay frequencyData={frequencyData} audioContext={audioContext} peakFrequency={peakFrequency} />
          )}

          {!frequencyData && (
            <div className="loading">
              <p>周波数解析を初期化中...</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
