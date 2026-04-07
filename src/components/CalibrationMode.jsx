import { useState } from 'react'
import { defaultInstruments, addInstrumentSample, getCalibrationProgress } from '../utils/calibrationStorage'

export function CalibrationMode({ analyser, frequencyData, isActive, onStartCapture, onStopCapture, onComplete }) {
  const [currentInstrument, setCurrentInstrument] = useState(null)
  const [recordedInstruments, setRecordedInstruments] = useState(new Set())
  const [sampling, setSampling] = useState(false)
  const [sampleCount, setSampleCount] = useState(0)
  const [status, setStatus] = useState('')

  const handleStartSampling = (instrumentId) => {
    if (!isActive) {
      onStartCapture()
    }
    setCurrentInstrument(instrumentId)
    setSampling(true)
    setSampleCount(0)
    setStatus(`${defaultInstruments.find((i) => i.id === instrumentId)?.name}を録音開始...`)
  }

  const handleStopSampling = async () => {
    if (!currentInstrument || !frequencyData) return

    setSampleCount((prev) => prev + 1)

    // Add sample to calibration
    const calibData = addInstrumentSample(currentInstrument, Array.from(frequencyData))
    setStatus(`サンプル ${sampleCount + 1}/3 を記録完了`)

    if (sampleCount + 1 >= 3) {
      // Done with this instrument
      setRecordedInstruments((prev) => new Set(prev).add(currentInstrument))
      setSampling(false)
      setSampleCount(0)

      const allInstruments = defaultInstruments.map((i) => i.id)
      if (allInstruments.every((id) => recordedInstruments.has(id) || id === currentInstrument)) {
        // All instruments calibrated
        setStatus('キャリブレーション完了！')
        onStopCapture()
        setTimeout(onComplete, 1500)
      } else {
        // Continue to next instrument
        setCurrentInstrument(null)
        setStatus('次の楽器を選択してください')
      }
    }
  }

  const handleSkipInstrument = () => {
    const allInstruments = defaultInstruments.map((i) => i.id)
    const nextUnrecorded = allInstruments.find((id) => !recordedInstruments.has(id) && id !== currentInstrument)

    if (nextUnrecorded) {
      setCurrentInstrument(nextUnrecorded)
      setSampling(false)
      setSampleCount(0)
      setStatus('')
    } else {
      setCurrentInstrument(null)
      setSampling(false)
      setSampleCount(0)
      setStatus('')
    }
  }

  const progress = getCalibrationProgress()

  return (
    <div className="calibration-mode">
      <h2>🎸 楽器キャリブレーション</h2>

      <div className="calibration-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="progress-text">{Math.round(progress)}% 完了</p>
      </div>

      {status && <div className="calibration-status">{status}</div>}

      <div className="instrument-grid">
        {defaultInstruments.map((instrument) => (
          <div
            key={instrument.id}
            className={`instrument-card ${recordedInstruments.has(instrument.id) ? 'recorded' : ''} ${
              currentInstrument === instrument.id ? 'active' : ''
            }`}
          >
            <div className="instrument-icon">{instrument.icon}</div>
            <div className="instrument-name">{instrument.name}</div>

            {!currentInstrument || currentInstrument !== instrument.id ? (
              <button
                onClick={() => handleStartSampling(instrument.id)}
                disabled={recordedInstruments.has(instrument.id)}
                className="btn-calibrate"
              >
                {recordedInstruments.has(instrument.id) ? '✓ 完了' : '選択'}
              </button>
            ) : (
              <div className="calibration-controls">
                {!sampling ? (
                  <button onClick={handleStartSampling} className="btn-start-sample">
                    開始
                  </button>
                ) : (
                  <>
                    <div className="sample-counter">
                      サンプル {sampleCount + 1}/3
                    </div>
                    <button onClick={handleStopSampling} className="btn-stop-sample">
                      記録
                    </button>
                  </>
                )}
                <button onClick={handleSkipInstrument} className="btn-skip">
                  スキップ
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="calibration-note">
        各楽器ごとに 3 回サンプルを記録してください。自然な演奏で問題ありません。
      </p>
    </div>
  )
}
