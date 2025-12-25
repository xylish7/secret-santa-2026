class Level5Darkness {
  constructor(app) {
    this.app = app

    // Level 5 Logic
    this.darknessTimer = 0
    this.requiredDarknessTime = 3000 // 3 seconds of darkness
    this.darknessThreshold = 3 // Brightness threshold (0-255)
    this.videoStream = null
    this.videoElement = null
    this.canvas = null
    this.canvasContext = null
    this.analyzeVideoId = null
  }

  async start() {
    this.app.state.isLevelActive = true
    this.darknessTimer = 0

    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Fifth Key'
    this.app.ui.riddleText.textContent =
      '"Domnul a zis lui Moise: „Întinde-ţi mâna spre cer, şi va fi întuneric peste ţara Egiptului, aşa de întuneric de să se poată pipăi.”" - Exodul 10:21'

    // Show Level 5 UI
    if (this.app.ui.level5 && this.app.ui.level5.container) {
      this.app.ui.level5.container.classList.remove('hidden')
    }

    // Request camera access
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 320 },
          height: { ideal: 240 }
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      this.videoStream = stream

      // Create video element for camera stream
      this.videoElement = document.createElement('video')
      this.videoElement.srcObject = stream
      this.videoElement.play()
      this.videoElement.style.display = 'none'

      // Create canvas for frame analysis
      this.canvas = document.createElement('canvas')
      this.canvas.width = 160
      this.canvas.height = 120
      this.canvasContext = this.canvas.getContext('2d', { willReadFrequently: true })

      // Start video analysis loop
      this.analyzeVideo()
    } catch (error) {
      console.error('Camera access denied:', error)
      alert('Camera access is required to play this level.')
      this.app.state.isLevelActive = false
    }
  }

  analyzeVideo = () => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 5) return

    this.handleVideoFrame()
    this.analyzeVideoId = requestAnimationFrame(() => this.analyzeVideo())
  }

  handleVideoFrame() {
    if (!this.videoElement || !this.canvasContext) return

    // Draw current video frame to canvas
    try {
      this.canvasContext.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height)
    } catch (error) {
      // Frame not ready yet
      return
    }

    // Get pixel data
    const imageData = this.canvasContext.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data

    // Calculate average brightness
    let brightness = 0
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      // Calculate luminance using standard formula
      brightness += 0.299 * r + 0.587 * g + 0.114 * b
    }
    brightness = brightness / (this.canvas.width * this.canvas.height)

    // Check if frame is dark enough
    const isDark = brightness < this.darknessThreshold

    // Update darkness timer
    if (isDark) {
      this.darknessTimer += 16 // Approx 60hz
    } else {
      // Reset timer if light detected
      this.darknessTimer = 0
    }

    // Update UI
    const percent = (this.darknessTimer / this.requiredDarknessTime) * 100
    if (this.app.ui.level5.progress) {
      this.app.ui.level5.progress.style.height = `${Math.min(percent, 100)}%`
    }

    // Debug
    if (this.app.debugMode) {
      const darknessPercent = Math.min((this.darknessTimer / this.requiredDarknessTime) * 100, 100)
      this.app.ui.debug.innerHTML = `
Level 5 - Darkness Detection<br>
Frame Brightness: ${brightness?.toFixed(0)} (Threshold: ${this.darknessThreshold})<br>
Dark: ${isDark ? 'YES' : 'NO'}<br>
Darkness Time: ${this.darknessTimer?.toFixed(0)}ms / ${this.requiredDarknessTime}ms<br>
Progress: ${darknessPercent?.toFixed(0)}%`
    }

    // Check if required darkness time reached
    if (this.darknessTimer >= this.requiredDarknessTime) {
      this.complete()
    }
  }

  complete() {
    this.app.state.isLevelActive = false

    // Stop camera stream
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop())
    }

    if (this.app.ui.level5 && this.app.ui.level5.container) {
      this.app.ui.level5.container.classList.add('hidden')
    }

    // Reveal Digit '9'
    this.app.revealDigit('2')

    this.app.ui.nextBtn.textContent = 'Start Level 6'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    // Stop camera stream
    if (this.videoStream) {
      this.videoStream.getTracks().forEach((track) => track.stop())
    }

    if (this.analyzeVideoId) {
      cancelAnimationFrame(this.analyzeVideoId)
    }

    this.darknessTimer = 0
    this.app.state.isLevelActive = false
  }
}
