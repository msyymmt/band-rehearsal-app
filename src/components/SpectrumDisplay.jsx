import { useEffect, useRef } from 'react'

export function SpectrumDisplay({ frequencyData, audioContext, peakFrequency }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current || !frequencyData) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const width = canvas.width
    const height = canvas.height

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, width, height)

    // Draw spectrum bars
    const barWidth = width / frequencyData.length
    const nyquist = audioContext.sampleRate / 2

    ctx.fillStyle = '#1976d2'
    for (let i = 0; i < frequencyData.length; i++) {
      const value = frequencyData[i]
      const barHeight = (value / 255) * height

      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight)
    }

    // Draw peak frequency line
    if (peakFrequency > 0) {
      const peakX = (peakFrequency / nyquist) * width
      ctx.strokeStyle = '#ff5722'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(peakX, 0)
      ctx.lineTo(peakX, height)
      ctx.stroke()

      // Draw frequency label
      ctx.fillStyle = '#ff5722'
      ctx.font = '12px sans-serif'
      ctx.fillText(`${peakFrequency.toFixed(0)} Hz`, peakX + 5, 20)
    }

    // Draw grid lines for frequency reference
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    const frequencyMarks = [100, 500, 1000, 2000, 5000, 10000]
    for (const freq of frequencyMarks) {
      if (freq < nyquist) {
        const x = (freq / nyquist) * width
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, height)
        ctx.stroke()

        ctx.fillStyle = '#666'
        ctx.font = '10px sans-serif'
        ctx.fillText(`${freq}Hz`, x + 2, height - 5)
      }
    }
  }, [frequencyData, audioContext, peakFrequency])

  return (
    <div className="spectrum-display">
      <canvas
        ref={canvasRef}
        width={375}
        height={300}
        style={{ width: '100%', maxWidth: '375px' }}
      />
    </div>
  )
}
