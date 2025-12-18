class Level1Stillness {
  constructor(app) {
    this.app = app

    // Level 1 Logic
    this.stillnessTimer = 0
    this.lastMotion = { x: 0, y: 0, z: 0 }
    this.stillnessThreshold = 0.3 // Sensitivity
    this.targetTime = 1 // Seconds
    this.lastFrameTime = 0
    this.isMoving = false
  }

  start() {
    this.app.state.isLevelActive = true
    this.app.ui.riddleText.textContent = '"Begin where nothing moves..."'
    this.app.ui.level1.container.style.display = 'block'

    // Ensure Level 2 is hidden
    if (this.app.ui.level2 && this.app.ui.level2.container) {
      this.app.ui.level2.container.classList.add('hidden')
    }

    window.addEventListener('devicemotion', (e) => this.handleMotion(e))

    // Start RequestAnimationFrame loop for smoother timer updates
    this.lastFrameTime = performance.now()
    this.gameLoopId = requestAnimationFrame(() => this.gameLoop())
  }

  resetStillness(reason) {
    this.stillnessTimer = 0
    this.app.ui.level1.container.classList.add('shake')
    setTimeout(() => this.app.ui.level1.container.classList.remove('shake'), 500)
  }

  gameLoop = () => {
    // Only for Level 1
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 1) return

    const now = performance.now()
    const dt = (now - this.lastFrameTime) / 1000
    this.lastFrameTime = now

    if (this.isMoving) {
      this.stillnessTimer = 0
      this.isMoving = false
    } else {
      this.stillnessTimer += dt
    }

    // Update UI
    this.updateLevel1UI()

    // Win Condition
    if (this.stillnessTimer >= this.targetTime) {
      this.complete()
      return // Stop loop
    }

    this.gameLoopId = requestAnimationFrame(() => this.gameLoop())
  }

  handleMotion = (event) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 1) return

    const acc = event.accelerationIncludingGravity || event.acceleration
    if (!acc) return

    // Visual Debug
    if (this.app.debugMode && this.app.ui.debug) {
      this.app.ui.debug.innerHTML = `
            X: ${acc.x?.toFixed(2)}<br>
            Y: ${acc.y?.toFixed(2)}<br>
            Z: ${acc.z?.toFixed(2)}<br>
            Timer: ${this.stillnessTimer?.toFixed(2)}`
    }

    // Check delta
    const deltaX = Math.abs(acc.x - this.lastMotion.x)
    const deltaY = Math.abs(acc.y - this.lastMotion.y)
    const deltaZ = Math.abs(acc.z - this.lastMotion.z)
    this.lastMotion = { x: acc.x, y: acc.y, z: acc.z }

    const totalDelta = deltaX + deltaY + deltaZ

    if (totalDelta > this.stillnessThreshold) {
      this.isMoving = true
    } else {
      this.isMoving = false
    }
  }

  updateLevel1UI() {
    const percent = (this.stillnessTimer / this.targetTime) * 100
    this.app.ui.level1.progress.style.height = `${Math.min(percent, 100)}%`
  }

  complete() {
    this.app.state.isLevelActive = false
    this.app.ui.level1.progress.style.height = '100%'
    this.app.ui.level1.container.style.display = 'none'

    // Clean up listeners
    window.removeEventListener('devicemotion', this.handleMotion)
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId)
    }

    // Reveal Digit '7'
    this.app.revealDigit('7')

    // Prepare for next level
    this.app.ui.nextBtn.textContent = 'Start Level 2'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    window.removeEventListener('devicemotion', this.handleMotion)
    if (this.gameLoopId) {
      cancelAnimationFrame(this.gameLoopId)
    }
    this.stillnessTimer = 0
    this.isMoving = false
  }
}
