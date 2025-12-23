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
    let cameraGranted = false
    let microphoneGranted = false
    let locationGranted = false

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

    // 4. Microphone Permission
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStream.getTracks().forEach((track) => track.stop())
      microphoneGranted = true
    } catch (error) {
      console.warn('Microphone permission denied or unavailable:', error)
      microphoneGranted = false
    }

    // 3. Camera Permission
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true })
      cameraStream.getTracks().forEach((track) => track.stop())
      cameraGranted = true
    } catch (error) {
      console.warn('Camera permission denied or unavailable:', error)
      cameraGranted = false
    }

    // 5. Location Permission
    if ('geolocation' in navigator) {
      try {
        const position = await Promise.race([
          new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject)
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Geolocation timeout')), 5000)
          )
        ])
        locationGranted = true
      } catch (error) {
        console.warn('Location permission denied or unavailable:', error)
        locationGranted = false
      }
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

    // Initialize level UI references
    this.ui.level2 = {
      container: document.getElementById('level-2-ui'),
      icon: document.getElementById('phone-icon'),
      fillAnimation: document.getElementById('fill-animation'),
      fillBar: null
    }

    this.ui.level3 = {
      container: document.getElementById('level-3-ui')
    }

    this.ui.level4 = {
      container: document.getElementById('level-4-ui'),
      progress: document.getElementById('silence-progress')
    }

    this.ui.level5 = {
      container: document.getElementById('level-5-ui'),
      progress: document.getElementById('darkness-progress')
    }

    this.ui.level6 = {
      container: document.getElementById('level-6-ui')
    }

    this.ui.level7 = {
      container: document.getElementById('level-7-ui')
    }

    this.ui.level8 = {
      container: document.getElementById('level-8-ui'),
      resultDisplay: document.getElementById('multiply-result')
    }

    // Initialize fill bar reference
    if (this.ui.level2.fillAnimation) {
      this.ui.level2.fillBar = this.ui.level2.fillAnimation.querySelector('.fill-bar::after')
    }

    this.debugMode = false // Set to false to hide debug info

    // Level instances
    this.levels = {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null
    }
    this.currentLevelInstance = null

    this.init()
  }

  init() {
    if (!this.debugMode) {
      this.ui.debug.style.display = 'none'
    }

    if (!this.ui.startBtn) {
      console.error('Start button not found')
      return
    }

    this.ui.startBtn.addEventListener('click', () => this.handleStart())

    // Setup debug level selector
    const debugSelector = document.getElementById('debug-level-selector')
    if (this.debugMode && debugSelector) {
      debugSelector.classList.remove('hidden')
      const levelButtons = debugSelector.querySelectorAll('.debug-level-btn')
      levelButtons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          const level = parseInt(e.target.dataset.level)
          this.jumpToLevel(level)
        })
      })
    }

    // Add Next Level button listener
    const nextBtn = document.getElementById('next-level-btn')
    if (nextBtn) {
      this.ui.nextBtn = nextBtn
      this.ui.nextBtn.addEventListener('click', () => this.startNextLevel())
    }

    // Initialize level instances
    this.levels[1] = new Level1Stillness(this)
    this.levels[2] = new Level2Inversion(this)
    this.levels[3] = new Level3Shake(this)
    this.levels[4] = new Level4Silence(this)
    this.levels[5] = new Level5Darkness(this)
    this.levels[6] = new Level6Shape(this)
    this.levels[7] = new Level7TouchSeal(this)
    this.levels[8] = new Level8Multiply(this)
  }

  jumpToLevel(level) {
    // Clean up previous level
    if (this.currentLevelInstance) {
      this.currentLevelInstance.cleanup()
    }

    // Hide all level UIs
    if (this.ui.level1 && this.ui.level1.container) {
      this.ui.level1.container.style.display = 'none'
    }
    if (this.ui.level2 && this.ui.level2.container) {
      this.ui.level2.container.classList.add('hidden')
    }
    if (this.ui.level3 && this.ui.level3.container) {
      this.ui.level3.container.classList.add('hidden')
    }
    if (this.ui.level4 && this.ui.level4.container) {
      this.ui.level4.container.classList.add('hidden')
    }
    if (this.ui.level5 && this.ui.level5.container) {
      this.ui.level5.container.classList.add('hidden')
    }
    if (this.ui.level6 && this.ui.level6.container) {
      this.ui.level6.container.classList.add('hidden')
    }
    if (this.ui.level7 && this.ui.level7.container) {
      this.ui.level7.container.classList.add('hidden')
    }
    if (this.ui.level8 && this.ui.level8.container) {
      this.ui.level8.container.classList.add('hidden')
    }

    // Reset timers
    this.state.isLevelActive = false

    // Hide reveal
    this.ui.reveal.container.classList.add('hidden')
    this.ui.reveal.digit.textContent = '?'

    // Set the current level and start the game
    this.state.currentLevel = level
    this.handleStart()
  }

  async handleStart() {
    console.log('Start button clicked')
    try {
      const granted = await this.sensors.requestPermission()
      console.log('Permissions granted:', granted)
      if (granted) {
        this.switchScreen('game')
        if (this.state.currentLevel === 1) {
          this.currentLevelInstance = this.levels[1]
          this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 2) {
          this.currentLevelInstance = this.levels[2]
          this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 3) {
          this.currentLevelInstance = this.levels[3]
          this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 4) {
          this.currentLevelInstance = this.levels[4]
          await this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 5) {
          this.currentLevelInstance = this.levels[5]
          await this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 6) {
          this.currentLevelInstance = this.levels[6]
          this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 7) {
          this.currentLevelInstance = this.levels[7]
          this.currentLevelInstance.start()
        } else if (this.state.currentLevel === 8) {
          this.currentLevelInstance = this.levels[8]
          this.currentLevelInstance.start()
        }
      } else {
        console.log('Permissions not granted')
      }
    } catch (error) {
      console.error('Error in handleStart:', error)
    }
  }

  startNextLevel() {
    // Reset level active state
    this.state.isLevelActive = false

    // Clean up previous level
    if (this.currentLevelInstance) {
      this.currentLevelInstance.cleanup()
    }

    // Hide all level UIs
    if (this.ui.level1 && this.ui.level1.container) {
      this.ui.level1.container.style.display = 'none'
    }
    if (this.ui.level2 && this.ui.level2.container) {
      this.ui.level2.container.classList.add('hidden')
    }
    if (this.ui.level3 && this.ui.level3.container) {
      this.ui.level3.container.classList.add('hidden')
    }
    if (this.ui.level4 && this.ui.level4.container) {
      this.ui.level4.container.classList.add('hidden')
    }
    if (this.ui.level5 && this.ui.level5.container) {
      this.ui.level5.container.classList.add('hidden')
    }
    if (this.ui.level6 && this.ui.level6.container) {
      this.ui.level6.container.classList.add('hidden')
    }
    if (this.ui.level7 && this.ui.level7.container) {
      this.ui.level7.container.classList.add('hidden')
    }
    if (this.ui.level7 && this.ui.level7.container) {
      this.ui.level7.container.classList.add('hidden')
    }
    if (this.ui.level8 && this.ui.level8.container) {
      this.ui.level8.container.classList.add('hidden')
    }

    // Hide reveal
    this.ui.reveal.container.classList.add('hidden')
    this.ui.reveal.digit.textContent = '?'

    // Reset next button state
    if (this.ui.nextBtn) {
      this.ui.nextBtn.disabled = false
      this.ui.nextBtn.classList.add('hidden')
      this.ui.nextBtn.textContent = 'Wait for update...'
    }

    this.state.currentLevel++

    if (this.state.currentLevel === 2) {
      this.currentLevelInstance = this.levels[2]
      this.currentLevelInstance.start()
    } else if (this.state.currentLevel === 3) {
      this.currentLevelInstance = this.levels[3]
      this.currentLevelInstance.start()
    } else if (this.state.currentLevel === 4) {
      this.currentLevelInstance = this.levels[4]
      this.currentLevelInstance.start()
    } else if (this.state.currentLevel === 5) {
      this.currentLevelInstance = this.levels[5]
      this.currentLevelInstance.start()
    } else if (this.state.currentLevel === 6) {
      this.currentLevelInstance = this.levels[6]
      this.currentLevelInstance.start()
    } else if (this.state.currentLevel === 7) {
      this.currentLevelInstance = this.levels[7]
      this.currentLevelInstance.start()
    } else if (this.state.currentLevel === 8) {
      this.currentLevelInstance = this.levels[8]
      this.currentLevelInstance.start()
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

  // --- LEVEL MANAGEMENT (handled by level classes) ---

  revealDigit(digit) {
    this.ui.reveal.container.classList.remove('hidden')
    this.ui.reveal.digit.textContent = digit

    // Add to unlocked digits
    this.state.unlockedDigits.push(digit)
    this.updateUnlockedDigitsUI()
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
