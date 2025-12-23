class Level8Multiply {
  constructor(app) {
    this.app = app
  }

  start() {
    this.app.state.isLevelActive = true
    this.app.ui.level8.container.classList.remove('hidden')

    // Hide all other level UIs
    if (this.app.ui.level1 && this.app.ui.level1.container) {
      this.app.ui.level1.container.style.display = 'none'
    }
    if (this.app.ui.level2 && this.app.ui.level2.container) {
      this.app.ui.level2.container.classList.add('hidden')
    }
    if (this.app.ui.level3 && this.app.ui.level3.container) {
      this.app.ui.level3.container.classList.add('hidden')
    }
    if (this.app.ui.level4 && this.app.ui.level4.container) {
      this.app.ui.level4.container.classList.add('hidden')
    }
    if (this.app.ui.level5 && this.app.ui.level5.container) {
      this.app.ui.level5.container.classList.add('hidden')
    }
    if (this.app.ui.level6 && this.app.ui.level6.container) {
      this.app.ui.level6.container.classList.add('hidden')
    }
    if (this.app.ui.level7 && this.app.ui.level7.container) {
      this.app.ui.level7.container.classList.add('hidden')
    }
    if (this.app.ui.level8 && this.app.ui.level8.container) {
      this.app.ui.level8.container.classList.add('hidden')
    }

    // Set the riddle text
    this.app.ui.riddleText.textContent =
      '"The answer lies not in the numbers you found, but in their union. Multiply them all to unlock the final secret."'

    // Calculate the product of all digits
    const product = this.app.state.unlockedDigits.reduce((acc, digit) => {
      return acc * parseInt(digit)
    }, 1)

    // Update the multiplied result display
    this.updateMultipliedResultUI(product)

    // Automatically reveal the result after a short delay
    setTimeout(() => {
      this.revealFinalSecret(product)
    }, 2000)
  }

  updateMultipliedResultUI(product) {
    const resultElement = this.app.ui.level8.resultDisplay
    if (resultElement) {
      resultElement.textContent = product
    }
  }

  revealFinalSecret(product) {
    if (!this.app.state.isLevelActive) return

    this.app.ui.reveal.container.classList.remove('hidden')
    this.app.ui.reveal.digit.textContent = product

    // Mark level complete
    this.complete()
  }

  complete() {
    this.app.state.isLevelActive = false

    // Show completion message
    if (this.app.ui.nextBtn) {
      this.app.ui.nextBtn.textContent = 'All Riddles Solved!'
      this.app.ui.nextBtn.classList.remove('hidden')
      this.app.ui.nextBtn.disabled = true
    }
  }

  cleanup() {
    this.app.state.isLevelActive = false
    if (this.app.ui.level8 && this.app.ui.level8.container) {
      this.app.ui.level8.container.classList.add('hidden')
    }
  }
}
