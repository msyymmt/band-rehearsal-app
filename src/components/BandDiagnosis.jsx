import { useMemo } from 'react'
import { analyzeBandBalance } from '../utils/bandDiagnosisAlgorithm'

export function BandDiagnosis({ frequencyData, audioContext }) {
  const diagnosis = useMemo(() => {
    if (!frequencyData || !audioContext) return null
    return analyzeBandBalance(frequencyData, audioContext)
  }, [frequencyData, audioContext])

  if (!diagnosis || !diagnosis.isValid) {
    return <div className="band-diagnosis">キャリブレーション中...</div>
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OK':
        return '#4caf50'
      case '要調整':
        return '#ff9800'
      case '警告':
        return '#f44336'
      default:
        return '#666'
    }
  }

  return (
    <div className="band-diagnosis">
      <div className="diagnosis-header">
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: getStatusColor(diagnosis.status) }}>
            <span className="score-value">{Math.round(diagnosis.score)}</span>
          </div>
          <div className="score-status" style={{ color: getStatusColor(diagnosis.status) }}>
            {diagnosis.status}
          </div>
        </div>
      </div>

      <div className="instrument-volumes">
        <h4>各楽器の音量バランス</h4>
        {Object.entries(diagnosis.instrumentStatus).map(([id, status]) => (
          <div key={id} className="volume-bar-item">
            <div className="volume-label">{status.name}</div>
            <div className="volume-bar-container">
              <div
                className={`volume-bar ${status.interference.length > 0 ? 'interfering' : ''}`}
                style={{ width: `${status.volume}%` }}
              >
                <span className="volume-text">{status.volume.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {diagnosis.recommendations.length > 0 && (
        <div className="recommendations">
          <h4>推奨事項</h4>
          <ul>
            {diagnosis.recommendations.map((rec, idx) => (
              <li key={idx}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
