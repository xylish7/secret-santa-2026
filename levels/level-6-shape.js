class Level6Shape {
  constructor(app) {
    this.app = app

    // Level 6 Logic - Triangle Drawing
    this.canvas = null
    this.ctx = null
    this.isDrawing = false
    this.points = []
    this.minDistance = 20 // Minimum distance between points to avoid noise
    this.triangleDetected = false
    this.touchHandler = null
    this.moveHandler = null
    this.endHandler = null
  }

  start() {
    this.app.state.isLevelActive = true
    this.points = []
    this.triangleDetected = false

    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Sixth Key'
    this.app.ui.riddleText.textContent = '"Draw the mark of passage."'

    // Show Level 6 UI
    if (this.app.ui.level6 && this.app.ui.level6.container) {
      this.app.ui.level6.container.classList.remove('hidden')
    }

    // Get or create canvas
    this.canvas = document.getElementById('drawing-canvas')
    if (!this.canvas) {
      console.error('Drawing canvas not found')
      return
    }

    // Set canvas size to match container
    const rect = this.canvas.parentElement.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height

    this.ctx = this.canvas.getContext('2d')
    this.clearCanvas()

    // Add touch event listeners
    this.touchHandler = (e) => this.handleTouchStart(e)
    this.moveHandler = (e) => this.handleTouchMove(e)
    this.endHandler = (e) => this.handleTouchEnd(e)

    this.canvas.addEventListener('touchstart', this.touchHandler)
    this.canvas.addEventListener('touchmove', this.moveHandler)
    this.canvas.addEventListener('touchend', this.endHandler)

    // Also support mouse events for desktop testing
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e))
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e))
  }

  handleTouchStart = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 6) return
    e.preventDefault()
    this.isDrawing = true
    this.points = []
    const touch = e.touches[0]
    const rect = this.canvas.getBoundingClientRect()
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }
    this.points.push(point)
    this.drawPoint(point)
  }

  handleTouchMove = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 6) return
    if (!this.isDrawing) return
    e.preventDefault()

    const touch = e.touches[0]
    const rect = this.canvas.getBoundingClientRect()
    const point = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    }

    // Only add point if it's far enough from the last one
    const lastPoint = this.points[this.points.length - 1]
    const distance = Math.sqrt((point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2)

    if (distance > this.minDistance) {
      this.points.push(point)
      this.drawLine(lastPoint, point)
    }
  }

  handleTouchEnd = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 6) return
    e.preventDefault()
    this.isDrawing = false
    this.analyzeShape()
  }

  handleMouseDown = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 6) return
    this.isDrawing = true
    this.points = []
    const rect = this.canvas.getBoundingClientRect()
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    this.points.push(point)
    this.drawPoint(point)
  }

  handleMouseMove = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 6) return
    if (!this.isDrawing) return

    const rect = this.canvas.getBoundingClientRect()
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }

    const lastPoint = this.points[this.points.length - 1]
    const distance = Math.sqrt((point.x - lastPoint.x) ** 2 + (point.y - lastPoint.y) ** 2)

    if (distance > this.minDistance) {
      this.points.push(point)
      this.drawLine(lastPoint, point)
    }
  }

  handleMouseUp = (e) => {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 6) return
    this.isDrawing = false
    this.analyzeShape()
  }

  drawPoint(point) {
    this.ctx.fillStyle = 'rgba(212, 175, 55, 0.8)'
    this.ctx.beginPath()
    this.ctx.arc(point.x, point.y, 3, 0, Math.PI * 2)
    this.ctx.fill()
  }

  drawLine(from, to) {
    this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)'
    this.ctx.lineWidth = 3
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()
  }

  clearCanvas() {
    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.2)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(0, 0, this.canvas.width, this.canvas.height)
  }

  analyzeShape() {
    if (this.points.length < 3) {
      this.clearCanvas()
      return
    }

    // Detect corners using angle analysis
    const corners = this.detectCorners()

    // Draw circles at detected corners on the canvas for visual feedback
    this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'
    this.ctx.lineWidth = 3
    corners.forEach((c) => {
      this.ctx.beginPath()
      this.ctx.arc(c.point.x, c.point.y, 15, 0, Math.PI * 2)
      this.ctx.stroke()
    })

    // Debug
    if (this.app.debugMode) {
      this.app.ui.debug.innerHTML = `
Level 6 - Shape Detection<br>
Total Points: ${this.points.length}<br>
Detected Corners: ${corners.length}<br>
Corner Angles: ${corners.map((c) => c.angle.toFixed(0) + '°').join(', ')}<br>
Status: ${
        corners.length === 3
          ? '✅ TRIANGLE DETECTED!'
          : corners.length < 3
          ? '⏳ Need more definition'
          : '⚠️ Too many corners'
      }`
    }

    // Check if we have exactly 3 corners
    if (corners.length === 3) {
      // Check that corners are reasonably sharp (40-140 degrees from straight)
      const allAnglesValid = corners.every((c) => c.angle > 30 && c.angle < 150)

      if (allAnglesValid) {
        // Additional validation: check if the shape is reasonably closed
        const startPoint = this.points[0]
        const endPoint = this.points[this.points.length - 1]
        const closureDistance = Math.sqrt(
          (endPoint.x - startPoint.x) ** 2 + (endPoint.y - startPoint.y) ** 2
        )

        // Shape should be closed (end near start) or have a reasonable closure
        const maxClosureDistance = Math.min(this.canvas.width, this.canvas.height) * 0.15 // 15% of canvas size

        // Check that corners form a triangle (not just any 3 points)
        const triangleArea = this.calculateTriangleArea(
          corners[0].point,
          corners[1].point,
          corners[2].point
        )
        const minTriangleArea = 1000 // Minimum area to be considered a valid triangle

        if (closureDistance < maxClosureDistance && triangleArea > minTriangleArea) {
          this.triangleDetected = true
          this.complete()
        } else {
          this.clearCanvas()
        }
      } else {
        this.clearCanvas()
      }
    } else {
      this.clearCanvas()
    }
  }

  detectCorners() {
    let corners = []
    const angleThreshold = 45 // Degrees - look for turns between 45-135 degrees (more forgiving)
    const minDistance = 40 // Minimum distance between corners
    const lookAhead = 8 // Points to look ahead for angle calculation - balanced smoothing

    // Need enough points to analyze
    if (this.points.length < lookAhead * 2 + 1) {
      console.log(`Not enough points: ${this.points.length}, need at least ${lookAhead * 2 + 1}`)
      return corners
    }

    // Collect all angles for analysis
    const allAngles = []

    // Scan through points looking for corners
    for (let i = lookAhead; i < this.points.length - lookAhead; i++) {
      const p0 = this.points[i - lookAhead]
      const p1 = this.points[i]
      const p2 = this.points[i + lookAhead]

      // Calculate vectors
      const v1 = {
        x: p1.x - p0.x,
        y: p1.y - p0.y
      }
      const v2 = {
        x: p2.x - p1.x,
        y: p2.y - p1.y
      }

      // Calculate angle between vectors using dot product and cross product
      const dotProduct = v1.x * v2.x + v1.y * v2.y
      const crossProduct = v1.x * v2.y - v1.y * v2.x
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)

      if (mag1 === 0 || mag2 === 0) continue

      // Calculate the angle between vectors (0-180 degrees)
      const cosAngle = dotProduct / (mag1 * mag2)
      const angleBetween = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI)

      allAngles.push(angleBetween)

      // Look for sharp corners: angles significantly less than 180 degrees
      // A straight line = 180°, a sharp corner like in a triangle = 60-90°
      if (angleBetween < 180 - angleThreshold) {
        // Only add if far enough from last corner
        if (
          corners.length === 0 ||
          Math.sqrt(
            (p1.x - corners[corners.length - 1].point.x) ** 2 +
              (p1.y - corners[corners.length - 1].point.y) ** 2
          ) > minDistance
        ) {
          corners.push({
            point: p1,
            angle: angleBetween,
            index: i
          })
          console.log(`Corner found at index ${i}: angle=${angleBetween.toFixed(1)}°`)
        }
      }
    }

    // Debug: log statistics
    if (allAngles.length > 0) {
      const avgAngle = allAngles.reduce((a, b) => a + b, 0) / allAngles.length
      const maxAngle = Math.max(...allAngles)
      const minAngle = Math.min(...allAngles)
      console.log(
        `Angle stats - Min: ${minAngle.toFixed(1)}°, Avg: ${avgAngle.toFixed(
          1
        )}°, Max: ${maxAngle.toFixed(1)}°, Threshold: <${180 - angleThreshold}°, Corners found: ${
          corners.length
        }`
      )
    }

    // If we found more than 3 corners, keep only the 3 with the smallest angles (sharpest)
    if (corners.length > 3) {
      corners.sort((a, b) => a.angle - b.angle)
      corners = corners.slice(0, 3)
      // Re-sort by position in the drawing to maintain order
      corners.sort((a, b) => a.index - b.index)
    }

    return corners
  }

  calculateTriangleArea(p1, p2, p3) {
    // Use the cross product formula for triangle area
    return Math.abs((p1.x * (p2.y - p3.y) + p2.x * (p3.y - p1.y) + p3.x * (p1.y - p2.y)) / 2)
  }

  complete() {
    this.app.state.isLevelActive = false

    // Remove event listeners
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.touchHandler)
      this.canvas.removeEventListener('touchmove', this.moveHandler)
      this.canvas.removeEventListener('touchend', this.endHandler)
      this.canvas.removeEventListener('mousedown', (e) => this.handleMouseDown(e))
      this.canvas.removeEventListener('mousemove', (e) => this.handleMouseMove(e))
      this.canvas.removeEventListener('mouseup', (e) => this.handleMouseUp(e))
    }

    if (this.app.ui.level6 && this.app.ui.level6.container) {
      this.app.ui.level6.container.classList.add('hidden')
    }

    // Reveal Digit '2'
    this.app.revealDigit('3')

    this.app.ui.nextBtn.textContent = 'Start Level 7'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.touchHandler)
      this.canvas.removeEventListener('touchmove', this.moveHandler)
      this.canvas.removeEventListener('touchend', this.endHandler)
    }

    this.points = []
    this.triangleDetected = false
  }
}
