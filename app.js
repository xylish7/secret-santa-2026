class GameState {
  constructor() {
    this.currentLevel = 1
    this.unlockedDigits = []
    this.isLevelActive = false
  }
}

class SensorManager {
  constructor() {
    this.hasPermission = false
  }

  async requestPermission() {
    // Check if permissions are needed (iOS 13+)
    let motionGranted = false
    let orientationGranted = false

    // 1. DeviceMotionEvent
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceMotionEvent.requestPermission()
        motionGranted = response === 'granted'
      } catch (error) {
        console.error('Motion permission error:', error)
      }
    } else {
      motionGranted = true // Not required
    }

    // 2. DeviceOrientationEvent
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      try {
        const response = await DeviceOrientationEvent.requestPermission()
        orientationGranted = response === 'granted'
      } catch (error) {
        console.error('Orientation permission error:', error)
      }
    } else {
      orientationGranted = true // Not required
    }

    this.hasPermission = motionGranted && orientationGranted
    return this.hasPermission
  }
}

class App {
  constructor() {
    this.state = new GameState()
    this.sensors = new SensorManager()

    // DOM Elements
    this.screens = {
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen')
    }
    this.ui = {
      startBtn: document.getElementById('start-btn'),
      levelNumber: document.getElementById('level-number'),
      riddleText: document.getElementById('riddle-text'),
      level1: {
        progress: document.getElementById('stillness-progress'),
        container: document.getElementById('level-1-ui')
      },
      reveal: {
        container: document.getElementById('digit-reveal'),
        digit: document.getElementById('unlocked-digit')
      },
      digitsContainer: document.getElementById('unlocked-digits-container'),
      debug: document.getElementById('debug-stats')
    }

    // Level 1 Logic
    this.stillnessTimer = 0
    this.lastMotion = { x: 0, y: 0, z: 0 }
    this.stillnessThreshold = 0.3 // Sensitivity
    this.targetTime = 1 // Seconds
    this.lastFrameTime = 0

    // Level 2 Logic
    this.orientationDebounce = 0
    this.requiredInversionTime = 1000 // 2 seconds upside down to trigger
    this.inversionTimer = 0
    this.upsideDownTimer = 0
    this.requiredUpsideDownTime = 2200 // 5 seconds upside down to trigger fill

    // Level 3 Logic (Shake)
    this.shakeThreshold = 5 // Acceleration magnitude for shake detection (change from previous)
    this.shakeTimer = 0
    this.requiredShakeTime = 3000 // 3 seconds of continuous shaking
    this.lastAcceleration = { x: 0, y: 0, z: 0 }

    this.debugMode = true // Set to false to hide debug info

    this.init()
  }

  init() {
    if (!this.debugMode) {
      this.ui.debug.style.display = 'none'
    }
    this.ui.startBtn.addEventListener('click', () => this.handleStart())

    // Add Next Level button listener
    const nextBtn = document.getElementById('next-level-btn')
    if (nextBtn) {
      this.ui.nextBtn = nextBtn
      this.ui.nextBtn.addEventListener('click', () => this.startNextLevel())
    }

    // Add level 2 UI ref
    this.ui.level2 = {
      container: document.getElementById('level-2-ui'),
      icon: document.getElementById('phone-icon'),
      fillAnimation: document.getElementById('fill-animation'),
      fillBar: null
    }

    // Add level 3 UI ref
    this.ui.level3 = {
      container: document.getElementById('level-3-ui')
    }

    // Initialize fill bar reference
    if (this.ui.level2.fillAnimation) {
      this.ui.level2.fillBar = this.ui.level2.fillAnimation.querySelector('.fill-bar::after')
    }
  }

  async handleStart() {
    const granted = await this.sensors.requestPermission()
    if (granted) {
      this.switchScreen('game')
      if (this.state.currentLevel === 1) {
        this.startLevel1()
      } else if (this.state.currentLevel === 2) {
        this.startLevel2()
      } else if (this.state.currentLevel === 3) {
        this.startLevel3()
      }
    }
  }

  startNextLevel() {
    // Hide reveal
    this.ui.reveal.container.classList.add('hidden')
    this.ui.reveal.digit.textContent = '?'

    this.state.currentLevel++
    this.ui.levelNumber.textContent = this.state.currentLevel

    if (this.state.currentLevel === 2) {
      this.startLevel2()
    } else if (this.state.currentLevel === 3) {
      this.startLevel3()
    }
  }

  switchScreen(screenName) {
    Object.values(this.screens).forEach((s) => s.classList.add('hidden'))
    Object.values(this.screens).forEach((s) => s.classList.remove('active'))

    this.screens[screenName].classList.remove('hidden')
    // Small delay to allow CSS transition to work
    setTimeout(() => {
      this.screens[screenName].classList.add('active')
    }, 50)
  }

  // --- LEVEL 1 ---

  startLevel1() {
    this.state.isLevelActive = true
    this.ui.riddleText.textContent = '"Begin where nothing moves..."'
    this.ui.level1.container.style.display = 'block'

    // Ensure Level 2 is hidden
    if (this.ui.level2 && this.ui.level2.container) {
      this.ui.level2.container.classList.add('hidden')
    }

    window.addEventListener('devicemotion', (e) => this.handleMotion(e))

    // Start RequestAnimationFrame loop for smoother timer updates
    this.lastFrameTime = performance.now()
    requestAnimationFrame(() => this.gameLoop())
  }

  resetStillness(reason) {
    this.stillnessTimer = 0
    this.ui.level1.container.classList.add('shake')
    setTimeout(() => this.ui.level1.container.classList.remove('shake'), 500)
  }

  gameLoop() {
    // Only for Level 1 so far?
    if (!this.state.isLevelActive || this.state.currentLevel !== 1) return

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
      this.completeLevel1()
      return // Stop loop
    }

    requestAnimationFrame(() => this.gameLoop())
  }

  handleMotion(event) {
    // Logic for Level 1 motion detection (already implemented)
    // ...
    // Simplified inline here to fit replace block if needed, but I'll assume valid valid existing code
    // Actually, I am replacing the existing handleMotion, so I must include it.

    if (!this.state.isLevelActive || this.state.currentLevel !== 1) return

    const acc = event.accelerationIncludingGravity || event.acceleration
    if (!acc) return

    // Visual Debug
    if (this.debugMode && this.ui.debug) {
      this.ui.debug.innerHTML = `
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
    this.ui.level1.progress.style.height = `${Math.min(percent, 100)}%`
  }

  completeLevel1() {
    this.state.isLevelActive = false
    this.ui.level1.progress.style.height = '100%'
    this.ui.level1.container.style.display = 'none'

    // Reveal Digit '7'
    this.revealDigit('7')

    // Prepare for next level
    this.ui.nextBtn.textContent = 'Start Level 2'
    this.ui.nextBtn.classList.remove('hidden')
  }

  // --- LEVEL 2 ---

  startLevel2() {
    this.state.isLevelActive = true
    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Second Key'
    this.ui.riddleText.textContent = '"Truth hides beneath the world."'

    // Show Level 2 UI
    this.ui.level2.container.classList.remove('hidden')

    // Start Sensor
    window.addEventListener('deviceorientation', (e) => this.handleOrientation(e))
  }

  handleOrientation(event) {
    if (!this.state.isLevelActive || this.state.currentLevel !== 2) return

    const beta = event.beta // -180 to 180 (front/back tilt)
    // Gamma: -90 to 90 (left/right)

    // Debug
    if (this.debugMode) {
      this.ui.debug.innerHTML = `Beta: ${beta?.toFixed(0)}<br>Gamma: ${event.gamma?.toFixed(
        0
      )}<br>Upside Timer: ${this.upsideDownTimer?.toFixed(0)}`
    }

    // Check for Upside Down
    // Range: Beta around -180 or 180?
    // Actually standard specific:
    // Portrait Upright: Beta ~ 90
    // Face Down: Beta ~ 180
    // Face Up: Beta ~ 0
    // Upside Down (Portrait): Beta ~ -90

    // Let's broaden the range for "Upside down portrait"
    // Beta < -60 && Beta > -120

    // Also potentially check if phone is essentially "inverted"

    const isUpsideDown = (beta < -60 && beta > -120) || beta > 150 || beta < -150 // Also cover face down?
    // The riddle "Truth hides beneath the world" implies looking UNDER (face down?) or Upside Down.
    // The instruction "Turn the phone upside down" suggests Inverted Portrait.

    const isInvertedPortrait = beta < -50 && beta > -130

    if (isInvertedPortrait) {
      this.inversionTimer += 16 // Approx 60hz
      this.ui.level2.icon.classList.add('inverted')

      if (this.inversionTimer > this.requiredInversionTime) {
        // Show fill animation when inverted for 2 seconds
        this.ui.level2.fillAnimation.classList.remove('hidden')

        // Track upside down time for 5 seconds
        this.upsideDownTimer += 16
        const fillPercent = (this.upsideDownTimer / this.requiredUpsideDownTime) * 100

        // Update fill bar width
        const fillBar = this.ui.level2.fillAnimation.querySelector('.fill-bar::after')
        this.ui.level2.fillAnimation
          .querySelector('.fill-bar')
          .style.setProperty('--fill-width', fillPercent + '%')

        // Use a different approach - update the pseudo-element via JavaScript
        if (!this.fillAnimationStyle) {
          this.fillAnimationStyle = document.createElement('style')
          document.head.appendChild(this.fillAnimationStyle)
        }
        this.fillAnimationStyle.innerHTML = `.fill-bar::after { width: ${fillPercent}% !important; }`

        if (this.upsideDownTimer >= this.requiredUpsideDownTime) {
          this.completeLevel2()
        }
      }
    } else {
      this.inversionTimer = 0
      this.upsideDownTimer = 0
      this.ui.level2.icon.classList.remove('inverted')
      this.ui.level2.fillAnimation.classList.add('hidden')
    }
  }

  completeLevel2() {
    this.state.isLevelActive = false
    window.removeEventListener('deviceorientation', this.handleOrientation)
    this.ui.level2.container.classList.add('hidden')

    // Reveal Digit '4'
    this.revealDigit('4')

    this.ui.nextBtn.textContent = 'Start Level 3'
    this.ui.nextBtn.classList.remove('hidden')
  }

  // --- LEVEL 3 (SHAKE) ---

  startLevel3() {
    this.state.isLevelActive = true
    this.shakeTimer = 0

    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Third Key'
    this.ui.riddleText.textContent = '"Wake what sleeps."'

    // Show Level 3 UI
    if (this.ui.level3 && this.ui.level3.container) {
      this.ui.level3.container.classList.remove('hidden')
    }

    // Start Sensor for shake detection with bound handler
    this.shakeHandler = (e) => this.handleShake(e)
    window.addEventListener('devicemotion', this.shakeHandler)
  }

  handleShake(event) {
    if (!this.state.isLevelActive || this.state.currentLevel !== 3) return

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

    // Accumulate shake time (don't reset when not shaking)
    if (isShaking) {
      this.shakeTimer += 16 // Approx 60hz
    }

    // Debug
    if (this.debugMode) {
      const shakePercent = Math.min((this.shakeTimer / this.requiredShakeTime) * 100, 100)
      this.ui.debug.innerHTML = `
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
      this.completeLevel3()
    }
  }

  completeLevel3() {
    this.state.isLevelActive = false
    window.removeEventListener('devicemotion', this.shakeHandler)
    if (this.ui.level3 && this.ui.level3.container) {
      this.ui.level3.container.classList.add('hidden')
    }

    // Reveal Digit '1'
    this.revealDigit('1')

    this.ui.nextBtn.textContent = 'Wait for Level 4...'
    this.ui.nextBtn.classList.add('hidden')
  }

  revealDigit(digit) {
    this.ui.reveal.container.classList.remove('hidden')
    this.ui.reveal.digit.textContent = digit

    // Add to unlocked digits
    if (!this.state.unlockedDigits.includes(digit)) {
      this.state.unlockedDigits.push(digit)
      this.updateUnlockedDigitsUI()
    }
  }

  updateUnlockedDigitsUI() {
    const slots = this.ui.digitsContainer.querySelectorAll('.digit-slot')
    slots.forEach((slot, index) => {
      if (index < this.state.unlockedDigits.length) {
        slot.textContent = this.state.unlockedDigits[index]
        slot.classList.remove('empty')
        slot.classList.add('filled')
      } else {
        slot.textContent = ''
        slot.classList.add('empty')
        slot.classList.remove('filled')
      }
    })
  }
}

// Start
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App()
})
