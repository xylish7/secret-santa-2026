class Level7Location {
  constructor(app) {
    this.app = app

    // Level 7 Logic - Location
    this.targetLatitude = 44.4179171
    this.targetLongitude = 26.0019865
    this.requiredAccuracy = 5 // meters
    this.checkInterval = null
    this.watchId = null
    this.lastKnownPosition = null
    this.isWithinRange = false
    this.proximityCheckDelay = 5000 // 5 seconds
    this.proximityTimer = 0
  }

  start() {
    this.app.state.isLevelActive = true
    // Update Riddle
    document.querySelector('.riddle-title').textContent = 'The Seventh Key'
    this.app.ui.riddleText.textContent = '"The answer waits where you get the food."'

    // Show Level 7 UI
    this.app.ui.level7.container.classList.remove('hidden')

    // Cache the gradient circle element
    this.gradientCircle = document.getElementById('location-gradient-circle')

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      this.showError('Geolocation is not supported by this browser.')
      return
    }

    // Request location permission and start watching position
    this.startLocationTracking()
  }

  startLocationTracking() {
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000
    }

    // Watch position continuously
    this.watchId = navigator.geolocation.watchPosition(
      (position) => this.handlePosition(position),
      (error) => this.handleLocationError(error),
      options
    )

    // Start checking proximity periodically
    this.checkInterval = setInterval(() => this.checkProximity(), 1000)
  }

  handlePosition(position) {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return

    this.lastKnownPosition = position
    const { latitude, longitude, accuracy } = position.coords

    // Debug
    if (this.app.debugMode) {
      this.app.ui.debug.innerHTML = `
        Current: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}<br>
        Target: ${this.targetLatitude}, ${this.targetLongitude}<br>
        Accuracy: ${accuracy.toFixed(0)}m<br>
        Distance: ${this.calculateDistance(latitude, longitude).toFixed(0)}m<br>
        Within Range: ${this.isWithinRange}
      `
    }

    const distance = this.calculateDistance(latitude, longitude)

    // Update UI with current status
    if (accuracy > 50) {
    } else if (distance > 1000) {
    } else if (distance > 200) {
    } else if (distance > 100) {
    } else {
      this.isWithinRange = true
    }

    this.updateProgress(distance)
  }

  handleLocationError(error) {
    let message = 'Location error: '
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = '❌ Location access denied. Please enable location permissions.'
        break
      case error.POSITION_UNAVAILABLE:
        message = '📡 Location information unavailable. Try going outside.'
        break
      case error.TIMEOUT:
        message = '⏰ Location request timed out. Trying again...'
        break
      default:
        message = '❓ Unknown location error occurred.'
        break
    }

    if (this.app.debugMode) {
      this.app.ui.debug.innerHTML = `Location Error: ${error.code} - ${error.message}`
    }
  }

  calculateDistance(lat1, lon1) {
    const lat2 = this.targetLatitude
    const lon2 = this.targetLongitude

    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  updateProgress(distance) {
    if (!this.gradientCircle) return

    // Calculate proximity ratio: 0 = very far (hot/red), 1 = very close (cold/blue)
    // Max distance for gradient calculation: 1000m
    const maxDistance = 1000
    const ratio = Math.max(0, Math.min(1, 1 - distance / maxDistance))

    // Interpolate color from red (hot) to blue (cold)
    const red = Math.round(255 - ratio * 180) // 255 (red) → 75 (blue)
    const green = Math.round(68 + ratio * 20) // 68 → 88
    const blue = Math.round(68 + ratio * 180) // 68 (red) → 248 (blue)

    // Glow size and intensity increase as you get closer
    const glowSize = 30 + ratio * 30
    const glowIntensity = 0.3 + ratio * 0.5

    this.gradientCircle.style.boxShadow = `0 0 ${glowSize}px rgba(${red}, ${green}, ${blue}, ${glowIntensity}), inset 0 0 20px rgba(0, 0, 0, 0.5)`
  }

  checkProximity() {
    if (!this.app.state.isLevelActive || this.app.state.currentLevel !== 7) return

    if (this.isWithinRange && this.lastKnownPosition) {
      const distance = this.calculateDistance(
        this.lastKnownPosition.coords.latitude,
        this.lastKnownPosition.coords.longitude
      )

      if (distance <= this.requiredAccuracy) {
        this.proximityTimer += 1000 // Add 1 second

        if (this.proximityTimer >= this.proximityCheckDelay) {
          this.completePuzzle()
        } else {
          const remaining = Math.ceil((this.proximityCheckDelay - this.proximityTimer) / 1000)
        }
      } else {
        this.proximityTimer = 0 // Reset timer if moved away
        this.isWithinRange = false
      }
    }
  }

  completePuzzle() {
    // Success! Unlock digit 7
    this.app.state.isLevelActive = false
    this.cleanup()

    // Hide level 7 UI
    this.app.ui.level7.container.classList.add('hidden')

    // Reveal Digit '3'
    this.app.revealDigit('2')

    // Prepare for next level
    this.app.ui.nextBtn.textContent = 'Start Level 8'
    this.app.ui.nextBtn.classList.remove('hidden')
  }

  cleanup() {
    // Clear intervals and watchers
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }

    // Reset state
    this.isWithinRange = false
    this.proximityTimer = 0
    this.lastKnownPosition = null
  }
}
