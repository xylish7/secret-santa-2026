class Level7TouchSeal {
  constructor(app) {
    this.app = app

    // Level 7 Logic - Touch Seal (5 fingers in rainbow order)
    this.circles = []
    this.activeTouches = new Map() // Map of touchId -> circle
    this.requiredFingers = 5
    this.circleRadius = 50 // Increased for better touch detection
    this.touchBuffer = 15 // Extra buffer for touch detection
    this.touchHandlers = {
      start: null,
      move: null,
      end: null,
      cancel: null
    }
    this.levelComplete = false
    this.gridGap = 40
    this.touchOrder = [] // Track which circles have been correctly touched in order
    this.correctOrder = [0, 1, 2, 3, 4] // Red, Orange, Yellow, Green, Blue
    this.correctlyTouched = new Set() // Track which circle IDs are correctly touched and held
  }

  start() {
    this.app.state.isLevelActive = true
    this.levelComplete = false
    this.activeTouches.clear()
    this.correctlyTouched.clear()

    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Seventh Key'
    this.app.ui.riddleText.textContent = '"Touch the rainbow in order."'

    // Show Level 7 UI
    if (this.app.ui.level7 && this.app.ui.level7.container) {
      this.app.ui.level7.container.classList.remove('hidden')
    }

    // Create canvas element
    this.createCanvas()

    // Setup touch event listeners
    this.setupEventListeners()

    // Generate circles
    this.generateCircles()

    // Draw initial state
    this.draw()
  }

  createCanvas() {
    let canvas = document.getElementById('touch-seal-canvas')

    if (!canvas) {
      canvas = document.createElement('canvas')
      canvas.id = 'touch-seal-canvas'
      canvas.className = 'touch-seal-canvas'

      const container = this.app.ui.level7.container
      const existingCanvas = container.querySelector('.touch-seal-canvas')
      if (existingCanvas) {
        existingCanvas.remove()
      }

      container.insertBefore(canvas, container.firstChild)
    }

    this.canvas = canvas

    // Set canvas size to match window/container
    const updateCanvasSize = () => {
      this.canvas.width = window.innerWidth
      this.canvas.height = window.innerHeight * 0.6
    }
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    this.ctx = this.canvas.getContext('2d')
  }

  setupEventListeners() {
    this.touchHandlers.start = (e) => this.handleTouchStart(e)
    this.touchHandlers.move = (e) => this.handleTouchMove(e)
    this.touchHandlers.end = (e) => this.handleTouchEnd(e)
    this.touchHandlers.cancel = (e) => this.handleTouchCancel(e)

    this.canvas.addEventListener('touchstart', this.touchHandlers.start, { passive: false })
    this.canvas.addEventListener('touchmove', this.touchHandlers.move, { passive: false })
    this.canvas.addEventListener('touchend', this.touchHandlers.end, { passive: false })
    this.canvas.addEventListener('touchcancel', this.touchHandlers.cancel, { passive: false })

    // Also support mouse events for testing
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e))
  }

  generateCircles() {
    this.circles = []

    // Use much wider spacing - only 3 circles on top, 2 on bottom
    const topY = 120
    const bottomY = this.canvas.height - 120

    // Spread circles far apart horizontally
    const leftX = 100
    const centerX = this.canvas.width / 2
    const rightX = this.canvas.width - 100

    // Define positions
    const positions = [
      { x: leftX, y: topY }, // Top left
      { x: centerX, y: topY }, // Top middle
      { x: rightX, y: topY }, // Top right
      { x: leftX, y: bottomY }, // Bottom left
      { x: rightX, y: bottomY } // Bottom right
    ]

    // Randomize which color (id) goes to which position
    const ids = [0, 1, 2, 3, 4] // Red, Orange, Yellow, Green, Blue
    this.shuffleArray(ids)

    // Create circles with randomized positions
    for (let i = 0; i < positions.length; i++) {
      this.circles.push({
        x: positions[i].x,
        y: positions[i].y,
        radius: this.circleRadius,
        activeTouches: [],
        id: ids[i]
      })
    }
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[array[i], array[j]] = [array[j], array[i]]
    }
  }

  handleTouchStart = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    e.preventDefault()
    e.stopPropagation()

    // Only process the new touches (changedTouches)
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const point = this.getTouchPoint(touch)

      const circle = this.getCircleAtPoint(point)
      if (circle && !circle.activeTouches.includes(touch.identifier)) {
        // Allow touching any circle
        circle.activeTouches.push(touch.identifier)

        // Check if this is the next correct circle in sequence
        const expectedNext = this.correctOrder[this.correctlyTouched.size]
        if (circle.id === expectedNext && !this.correctlyTouched.has(circle.id)) {
          this.correctlyTouched.add(circle.id)
          this.playTouchFeedback(circle)
        } else {
          // Wrong circle - just vibrate but don't reset
          this.playErrorFeedback()
        }
      }
    }

    this.draw()
    this.updateStatus()
  }

  handleTouchMove = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    e.preventDefault()
    e.stopPropagation()

    // Check all current touches to verify they're still in their circles
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i]
      const point = this.getTouchPoint(touch)

      // Find which circle (if any) this touch is currently tracked on
      let trackedCircle = null
      for (let circle of this.circles) {
        if (circle.activeTouches.includes(touch.identifier)) {
          trackedCircle = circle
          break
        }
      }

      // Check if touch is still in its circle
      if (trackedCircle) {
        if (!this.isPointInCircle(point, trackedCircle)) {
          // Touch moved out - remove it
          const idx = trackedCircle.activeTouches.indexOf(touch.identifier)
          if (idx !== -1) {
            trackedCircle.activeTouches.splice(idx, 1)

            // If this was a correctly touched circle, reset progress
            if (this.correctlyTouched.has(trackedCircle.id)) {
              this.resetTouches()
              this.playErrorFeedback()
            }
          }
        }
      }
    }

    this.draw()
  }

  handleTouchEnd = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    e.preventDefault()
    e.stopPropagation()

    // Remove ended touches and check if we need to reset
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      for (let circle of this.circles) {
        const idx = circle.activeTouches.indexOf(touch.identifier)
        if (idx !== -1) {
          circle.activeTouches.splice(idx, 1)

          // If this was a correctly touched circle, reset progress
          if (this.correctlyTouched.has(circle.id)) {
            this.resetTouches()
            this.playErrorFeedback()
          }
          break
        }
      }
    }

    this.draw()
  }

  handleTouchCancel = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    e.preventDefault()
    e.stopPropagation()

    // Reset all touches on cancel
    this.circles.forEach((circle) => {
      circle.activeTouches = []
    })

    this.draw()
  }

  handleMouseDown = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    const point = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
    const circle = this.getCircleAtPoint(point)

    if (circle) {
      this.activeTouches.set('mouse', circle)
      circle.touched = true
      this.playTouchFeedback(circle)
    }

    this.draw()
  }

  handleMouseMove = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    const point = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }

    if (this.activeTouches.has('mouse')) {
      const circle = this.activeTouches.get('mouse')
      if (!this.isPointInCircle(point, circle)) {
        circle.touched = false
        this.activeTouches.delete('mouse')
      }
    }

    this.draw()
  }

  handleMouseUp = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return
    const circle = this.activeTouches.get('mouse')
    if (circle) {
      circle.touched = false
      this.activeTouches.delete('mouse')
    }

    this.draw()
  }

  getTouchPoint(touch) {
    const rect = this.canvas.getBoundingClientRect()
    // Scale touch coordinates to match canvas coordinate space
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY
    }
  }

  getCircleAtPoint(point) {
    for (let circle of this.circles) {
      if (this.isPointInCircle(point, circle)) {
        return circle
      }
    }
    return null
  }

  isPointInCircle(point, circle) {
    const dx = point.x - circle.x
    const dy = point.y - circle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    // Add buffer for easier touch detection
    return distance <= circle.radius + this.touchBuffer
  }

  playTouchFeedback(circle) {
    // Simple haptic feedback - try multiple methods
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(50)
      }
    } catch (e) {
      console.log('Vibration not supported:', e)
    }
  }

  playErrorFeedback() {
    // Error haptic pattern - try multiple methods
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100])
      }
    } catch (e) {
      console.log('Vibration not supported:', e)
    }
  }

  resetTouches() {
    this.correctlyTouched.clear()
    this.circles.forEach((circle) => {
      circle.activeTouches = []
    })
  }

  updateStatus() {
    const touchedCount = this.correctlyTouched.size
    const fingersNeeded = this.requiredFingers - touchedCount

    if (touchedCount === this.requiredFingers) {
      if (!this.levelComplete) {
        this.complete()
      }
    }

    if (this.app.debugMode && this.app.ui.debug) {
      this.app.ui.debug.innerHTML = `
        Touched Circles: ${touchedCount}/${this.requiredFingers}<br>
        Active Touches: ${this.circles.reduce((sum, c) => sum + c.activeTouches.length, 0)}<br>
        Level Complete: ${this.levelComplete}
      `
    }
  }

  draw() {
    // Clear canvas completely (no transparency)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw circles
    this.circles.forEach((circle) => {
      this.drawCircle(circle)
    })
  }

  drawCircle(circle) {
    const isTouched = circle.activeTouches.length > 0
    const isCorrectlyTouched = this.correctlyTouched.has(circle.id)

    // Rainbow colors: Red, Orange, Yellow, Green, Blue
    const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF']
    const colorNames = ['Red', 'Orange', 'Yellow', 'Green', 'Blue']

    this.ctx.beginPath()
    this.ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2)

    // Circle border and fill
    if (isCorrectlyTouched) {
      // Fill with color when correctly touched
      this.ctx.fillStyle = colors[circle.id]
      this.ctx.fill()
      this.ctx.strokeStyle = colors[circle.id]
      this.ctx.lineWidth = 4
    } else if (isTouched) {
      // Show as touched but not correct (gray fill)
      this.ctx.fillStyle = 'rgba(150, 150, 150, 0.5)'
      this.ctx.fill()
      this.ctx.strokeStyle = colors[circle.id]
      this.ctx.lineWidth = 3
    } else {
      // Not touched - just colored border
      this.ctx.strokeStyle = colors[circle.id]
      this.ctx.lineWidth = 3
    }
    this.ctx.stroke()

    // Add checkmark only for correctly touched circles
    if (isCorrectlyTouched) {
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillStyle = '#fff'
      this.ctx.font = 'bold 28px Arial'
      this.ctx.fillText('✓', circle.x, circle.y)
    }
  }

  complete() {
    this.levelComplete = true
    this.app.state.isLevelActive = false

    if (this.app.ui.level7 && this.app.ui.level7.status) {
      this.app.ui.level7.status.textContent = '✋ All fingers detected! Level Complete!'
    }

    // Haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([50, 30, 50])
    }

    // Wait a moment, then reveal the digit
    setTimeout(() => {
      this.app.revealDigit('4')
      this.app.ui.nextBtn.disabled = false
      this.app.ui.nextBtn.textContent = 'Final Level →'
      this.app.ui.nextBtn.classList.remove('hidden')
    }, 1500)
  }

  cleanup() {
    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.touchHandlers.start)
      this.canvas.removeEventListener('touchmove', this.touchHandlers.move)
      this.canvas.removeEventListener('touchend', this.touchHandlers.end)
      this.canvas.removeEventListener('touchcancel', this.touchHandlers.cancel)
    }

    // Reset touches
    this.correctlyTouched.clear()
    this.circles.forEach((circle) => {
      circle.activeTouches = []
    })
  }
}
