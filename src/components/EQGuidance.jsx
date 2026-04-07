import { useMemo, useState } from 'react'
import { getEQSuggestions, analyzeBandBalance } from '../utils/bandDiagnosisAlgorithm'
import { detectHowling, getHowlingCutFrequencies } from '../utils/howlingDetection'
import { getCalibrationData, defaultInstruments } from '../utils/calibrationStorage'

export function EQGuidance({ frequencyData, audioContext }) {
  const [selectedInstrument, setSelectedInstrument] = useState('vocal')
  const [mode, setMode] = useState('normal') // normal, howling

  const diagnosis = useMemo(() => {
    if (!frequencyData || !audioContext) return null
    return analyzeBandBalance(frequencyData, audioContext)
  }, [frequencyData, audioContext])

  const howling = useMemo(() => {
    if (!frequencyData || !audioContext) return null
    return detectHowling(frequencyData, audioContext)
  }, [frequencyData, audioContext])

  const eqSuggestions = useMemo(() => {
    if (!diagnosis) return []
    return getEQSuggestions(diagnosis, selectedInstrument)
  }, [diagnosis, selectedInstrument])

  if (!diagnosis || !howling) {
    return <div className="eq-guidance">EQ推奨を計算中...</div>
  }

  const howlingCuts = howling.detected ? getHowlingCutFrequencies(howling.frequency) : []

  return (
    <div className="eq-guidance">
      <div className="eq-header">
        <h3>EQ推奨</h3>
        <div className="mode-tabs">
          <button
            className={`tab ${mode === 'normal' ? 'active' : ''}`}
            onClick={() => setMode('normal')}
          >
            ノーマル
          </button>
          <button
            className={`tab ${mode === 'howling' ? 'active' : ''} ${howling.detected ? 'warning' : ''}`}
            onClick={() => setMode('howling')}
          >
            {howling.detected ? '🚨 ハウリング' : 'ハウリング'}
          </button>
        </div>
      </div>

      {mode === 'normal' && (
        <>
          <div className="instrument-selector">
            <label>楽器を選択:</label>
            <div className="instrument-buttons">
              {defaultInstruments.map((inst) => (
                <button
                  key={inst.id}
                  className={`inst-btn ${selectedInstrument === inst.id ? 'active' : ''}`}
                  onClick={() => setSelectedInstrument(inst.id)}
                >
                  {inst.icon} {inst.name}
                </button>
              ))}
            </div>
          </div>

          <div className="eq-table">
            <h4>推奨EQ設定</h4>
            {eqSuggestions.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>周波数</th>
                    <th>アクション</th>
                    <th>理由</th>
                  </tr>
                </thead>
                <tbody>
                  {eqSuggestions.map((suggestion, idx) => (
                    <tr key={idx}>
                      <td className="frequency">{suggestion.frequency}</td>
                      <td className={`action ${suggestion.action.includes('-') ? 'cut' : 'boost'}`}>
                        {suggestion.action}
                      </td>
                      <td className="reason">{suggestion.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="no-suggestions">このモードではEQ調整は不要です</p>
            )}
          </div>
        </>
      )}

      {mode === 'howling' && (
        <>
          {howling.detected ? (
            <div className="howling-alert">
              <div className="alert-content">
                <div className="alert-icon">🚨</div>
                <div className="alert-text">
                  <strong>{howling.frequency.toFixed(0)} Hz でハウリング検知</strong>
                  <p>以下の周波数をカットしてください</p>
                </div>
              </div>

              <div className="howling-cuts">
                {howlingCuts.map((freq) => (
                  <div key={freq} className="cut-recommendation">
                    <div className="cut-freq">{freq.toFixed(0)} Hz</div>
                    <div className="cut-settings">
                      <div>Q = 10</div>
                      <div>Gain = -6dB</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="howling-note">
                ナローなQバンドパスフィルタで上記周波数をカットしてください。
                ボーカルマイクのゲイン下げやマイク位置の調整も有効です。
              </p>
            </div>
          ) : (
            <div className="no-howling">
              <p>ハウリングは検知されていません</p>
              <p className="hint">問題が続く場合は、ボーカルマイク周辺のスピーカー位置を確認してください</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
