export function AudioControl({ isActive, onStart, onStop, error }) {
  return (
    <div className="audio-control">
      {error && <div className="error-message">{error}</div>}

      <div className="control-buttons">
        {!isActive ? (
          <button onClick={onStart} className="btn-start">
            🎤 マイク ON
          </button>
        ) : (
          <button onClick={onStop} className="btn-stop">
            ⏹ マイク OFF
          </button>
        )}
      </div>

      <div className="status">
        <span className={`status-indicator ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? '● 録音中' : '○ 待機中'}
        </span>
      </div>
    </div>
  )
}
