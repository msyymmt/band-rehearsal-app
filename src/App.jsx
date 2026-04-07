import { useState, useEffect } from 'react'
import './App.css'

export default function App() {
  const [appState, setAppState] = useState('startup') // startup, calibration, analysis
  const [error, setError] = useState(null)

  useEffect(() => {
    // Check if browser supports Web Audio API
    const audioContext = window.AudioContext || window.webkitAudioContext
    if (!audioContext) {
      setError('Web Audio API not supported in this browser')
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

  const handleCalibraisonComplete = () => {
    setAppState('analysis')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎸 Band Rehearsal Analyzer</h1>
      </header>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
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
          <h2>バンド分析</h2>
          <p>演奏を分析中...</p>
        </div>
      )}
    </div>
  )
}
