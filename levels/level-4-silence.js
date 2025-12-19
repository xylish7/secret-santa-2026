class Level4Silence {
  constructor(app) {
    this.app = app

    // Level 4 Logic
    this.silenceTimer = 0
    this.requiredSilenceTime = 5000 // 5 seconds of silence
    this.silenceThreshold = 1 // Decibel threshold for detecting sound
    this.audioContext = null
    this.analyser = null
    this.microphone = null
    this.dataArray = null
    this.analyzeAudioId = null
  }

  async start() {
    this.app.state.isLevelActive = true
    this.silenceTimer = 0

    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Fourth Key'
    this.app.ui.riddleText.textContent = '"Only quiet minds may proceed."'

    // Show Level 4 UI
    if (this.app.ui.level4 && this.app.ui.level4.container) {
      this.app.ui.level4.container.classList.remove('hidden')
    }

    // Request microphone access
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Initialize Audio Context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.audioContext = audioContext

      // Create analyser node
      const analyser = audioContext.createAnalyser()
      this.analyser = analyser
      analyser.fftSize = 256

      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // Create data array for frequency data
      this.dataArray = new Uint8Array(analyser.frequencyBinCount)

      // Start audio analysis loop
      this.analyzeAudio()
    } catch (error) {
      console.error('Microphone access denied:', error)
      alert('Microphone access is required to play this level.')
      this.app.state.isLevelActive = false
    }
  }

  analyzeAudio = () => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 4) return

    this.handleAudioInput()
    this.analyzeAudioId = requestAnimationFrame(() => this.analyzeAudio())
  }

  handleAudioInput() {
    if (!this.analyser || !this.dataArray) return

    // Get frequency data
    this.analyser.getByteFrequencyData(this.dataArray)

    // Calculate average frequency (loudness indicator)
    let sum = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i]
    }
    const average = sum / this.dataArray.length

    // Detect if sound is present
    const isSilent = average < this.silenceThreshold

    // Update silence timer
    if (isSilent) {
      this.silenceTimer += 16 // Approx 60hz
    } else {
      // Reset timer if sound detected
      this.silenceTimer = 0
    }

    // Update UI
    const percent = (this.silenceTimer / this.requiredSilenceTime) * 100
    if (this.app.ui.level4.progress) {
      this.app.ui.level4.progress.style.height = `${Math.min(percent, 100)}%`
    }

    // Debug
    if (this.app.debugMode && this.app.ui.debug) {
      this.app.ui.debug.innerHTML = `
Level 4 - Silence Detection<br>
Frequency Average: ${average?.toFixed(0)}<br>
Threshold: ${this.silenceThreshold}<br>
Is Silent: ${isSilent ? 'YES' : 'NO'}<br>
Silence Time: ${this.silenceTimer?.toFixed(0)}ms / ${this.requiredSilenceTime}ms<br>
Progress: ${percent?.toFixed(0)}%`
    }

    // Check if required silence time reached
    if (this.silenceTimer >= this.requiredSilenceTime) {
      this.complete()
    }
  }

  complete() {
    this.app.state.isLevelActive = false

    // Stop audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    if (this.app.ui.level4 && this.app.ui.level4.container) {
      this.app.ui.level4.container.classList.add('hidden')
    }

    // Reveal Digit '9'
    this.app.revealDigit('9')

    this.app.ui.nextBtn.textContent = 'Start Level 5'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    if (this.analyzeAudioId) {
      cancelAnimationFrame(this.analyzeAudioId)
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.silenceTimer = 0
    this.app.state.isLevelActive = false
  }
}
