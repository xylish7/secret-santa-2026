class Level2Inversion {
  constructor(app) {
    this.app = app

    // Level 2 Logic
    this.orientationDebounce = 0
    this.requiredInversionTime = 1000 // 2 seconds upside down to trigger
    this.inversionTimer = 0
    this.upsideDownTimer = 0
    this.requiredUpsideDownTime = 2200 // 5 seconds upside down to trigger fill
    this.handleOrientationBound = null
    this.fillAnimationStyle = null
  }

  start() {
    this.app.state.isLevelActive = true
    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Second Key'
    this.app.ui.riddleText.textContent = '"The meek shall inherit the earth." - Matthew 5:5'

    // Show Level 2 UI
    this.app.ui.level2.container.classList.remove('hidden')

    // Start Sensor with bound handler
    this.handleOrientationBound = (e) => this.handleOrientation(e)
    window.addEventListener('deviceorientation', this.handleOrientationBound)
  }

  handleOrientation = (event) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 2) return

    const beta = event.beta // -180 to 180 (front/back tilt)

    // Debug
    if (this.app.debugMode) {
      this.app.ui.debug.innerHTML = `Beta: ${beta?.toFixed(0)}<br>Gamma: ${event.gamma?.toFixed(
        0
      )}<br>Upside Timer: ${this.upsideDownTimer?.toFixed(0)}`
    }

    const isInvertedPortrait = beta < -50 && beta > -130

    if (isInvertedPortrait) {
      this.inversionTimer += 16 // Approx 60hz
      this.app.ui.level2.icon.classList.add('inverted')

      if (this.inversionTimer > this.requiredInversionTime) {
        // Show fill animation when inverted for 2 seconds
        this.app.ui.level2.fillAnimation.classList.remove('hidden')

        // Track upside down time for 5 seconds
        this.upsideDownTimer += 16
        const fillPercent = (this.upsideDownTimer / this.requiredUpsideDownTime) * 100

        // Update fill bar width
        if (!this.fillAnimationStyle) {
          this.fillAnimationStyle = document.createElement('style')
          document.head.appendChild(this.fillAnimationStyle)
        }
        this.fillAnimationStyle.innerHTML = `.fill-bar::after { width: ${fillPercent}% !important; }`

        if (this.upsideDownTimer >= this.requiredUpsideDownTime) {
          this.complete()
        }
      }
    } else {
      this.inversionTimer = 0
      this.upsideDownTimer = 0
      this.app.ui.level2.icon.classList.remove('inverted')
      this.app.ui.level2.fillAnimation.classList.add('hidden')
    }
  }

  complete() {
    this.app.state.isLevelActive = false
    window.removeEventListener('deviceorientation', this.handleOrientationBound)
    this.app.ui.level2.container.classList.add('hidden')

    // Reveal Digit '4'
    this.app.revealDigit('2')

    this.app.ui.nextBtn.textContent = 'Start Level 3'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    if (this.handleOrientationBound) {
      window.removeEventListener('deviceorientation', this.handleOrientationBound)
    }
    if (this.fillAnimationStyle) {
      this.fillAnimationStyle.remove()
    }
    this.inversionTimer = 0
    this.upsideDownTimer = 0
  }
}
