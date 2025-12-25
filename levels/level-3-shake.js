class Level3Shake {
  constructor(app) {
    this.app = app

    // Level 3 Logic
    this.shakeThreshold = 5 // Acceleration magnitude for shake detection
    this.shakeTimer = 0
    this.requiredShakeTime = 3000 // 3 seconds of continuous shaking
    this.lastAcceleration = { x: 0, y: 0, z: 0 }
    this.shakeHandler = null
  }

  start() {
    this.app.state.isLevelActive = true
    this.shakeTimer = 0

    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Third Key'
    this.app.ui.riddleText.textContent =
      '"Awake, and rise from the dead, and Christ will give you light." - Ephesians 5:14'

    // Show Level 3 UI
    if (this.app.ui.level3 && this.app.ui.level3.container) {
      this.app.ui.level3.container.classList.remove('hidden')
    }

    // Start Sensor for shake detection with bound handler
    this.shakeHandler = (e) => this.handleShake(e)
    window.addEventListener('devicemotion', this.shakeHandler)
  }

  handleShake = (event) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 3) return

    const acc = event.accelerationIncludingGravity || event.acceleration
    if (!acc) return

    // Calculate DELTA from last frame (actual shake motion, not gravity)
    const deltaX = Math.abs(acc.x - this.lastAcceleration.x)
    const deltaY = Math.abs(acc.y - this.lastAcceleration.y)
    const deltaZ = Math.abs(acc.z - this.lastAcceleration.z)

    const deltaMagnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ)

    // Store current acceleration for next frame
    this.lastAcceleration = { x: acc.x, y: acc.y, z: acc.z }

    const isShaking = deltaMagnitude > this.shakeThreshold

    // Accumulate shake time
    if (isShaking) {
      this.shakeTimer += 16 // Approx 60hz
    }

    // Update UI
    const percent = (this.shakeTimer / this.requiredShakeTime) * 100
    const shakeProgress = document.getElementById('shake-progress')
    if (shakeProgress) {
      shakeProgress.style.height = `${Math.min(percent, 100)}%`
    }

    const shakeTimer = document.querySelector('#level-3-ui .shake-timer')
    if (shakeTimer) {
      const seconds = (this.shakeTimer / 1000).toFixed(1)
      shakeTimer.textContent = `${seconds}s`
    }

    // Debug
    if (this.app.debugMode) {
      const shakePercent = Math.min((this.shakeTimer / this.requiredShakeTime) * 100, 100)
      this.app.ui.debug.innerHTML = `
Level 3 - Shake Detection<br>
Accel X: ${acc.x?.toFixed(2)}<br>
Accel Y: ${acc.y?.toFixed(2)}<br>
Accel Z: ${acc.z?.toFixed(2)}<br>
Delta Magnitude: ${deltaMagnitude?.toFixed(2)} (Threshold: ${this.shakeThreshold})<br>
Shaking: ${isShaking ? 'YES' : 'NO'}<br>
Shake Time: ${this.shakeTimer?.toFixed(0)}ms / ${this.requiredShakeTime}ms<br>
Progress: ${shakePercent?.toFixed(0)}%`
    }

    // Check if required shake time reached
    if (this.shakeTimer >= this.requiredShakeTime) {
      this.complete()
    }
  }

  complete() {
    this.app.state.isLevelActive = false
    window.removeEventListener('devicemotion', this.shakeHandler)
    if (this.app.ui.level3 && this.app.ui.level3.container) {
      this.app.ui.level3.container.classList.add('hidden')
    }

    // Reveal Digit '1'
    this.app.revealDigit('1')

    this.app.ui.nextBtn.textContent = 'Start Level 4'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    if (this.shakeHandler) {
      window.removeEventListener('devicemotion', this.shakeHandler)
    }
    this.shakeTimer = 0
  }
}
