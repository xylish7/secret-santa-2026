class Level8Multiply {
  constructor(app) {
    this.app = app
    this.expectedProduct = null
    this.handleSubmitBound = null
    this.handleEnterBound = null
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
      this.app.ui.level8.container.classList.remove('hidden')
    }

    // Set the riddle text
    this.app.ui.riddleText.textContent =
      '"Cuvântul lui Dumnezeu se răspândea tot mai mult, numărul ucenicilor se înmulţea mult în Ierusalim şi o mare mulţime de preoţi veneau la credinţă." - Faptele apostolilor 6:7'

    // Calculate the product of all digits
    this.expectedProduct = this.app.state.unlockedDigits.reduce((acc, digit) => {
      return acc * parseInt(digit)
    }, 1)

    // Set up input field and button
    this.setupInputField()
  }

  setupInputField() {
    const input = document.getElementById('multiply-input')
    const submitBtn = document.getElementById('multiply-submit')
    const feedback = document.getElementById('multiply-feedback')

    if (!input || !submitBtn) {
      console.error('Multiply input or submit button not found')
      return
    }

    // Clear previous input and feedback
    input.value = ''
    feedback.classList.add('hidden')
    feedback.textContent = ''

    // Bind handlers to preserve 'this'
    this.handleSubmitBound = () => this.handleSubmit()
    this.handleEnterBound = (e) => {
      if (e.key === 'Enter') {
        this.handleSubmit()
      }
    }

    // Add event listeners
    submitBtn.addEventListener('click', this.handleSubmitBound)
    input.addEventListener('keypress', this.handleEnterBound)

    // Focus input for user convenience
    input.focus()
  }

  handleSubmit() {
    if (!this.app.state.isLevelActive) return

    const input = document.getElementById('multiply-input')
    const feedback = document.getElementById('multiply-feedback')
    const userAnswer = parseInt(input.value)

    if (isNaN(userAnswer)) {
      feedback.classList.remove('hidden')
      feedback.textContent = 'Please enter a valid number'
      feedback.style.color = '#c0392b'
      return
    }

    if (userAnswer === this.expectedProduct) {
      // Correct answer!
      feedback.classList.remove('hidden')
      feedback.textContent = 'Correct! The code is complete!'
      feedback.style.color = '#d4af37'
      this.complete()
    } else {
      // Wrong answer
      feedback.classList.remove('hidden')
      feedback.textContent = `Incorrect. Try again.`
      feedback.style.color = '#c0392b'
      input.value = ''
      input.focus()
    }
  }

  complete() {
    this.app.state.isLevelActive = false

    // Remove event listeners
    const input = document.getElementById('multiply-input')
    const submitBtn = document.getElementById('multiply-submit')
    if (input && this.handleEnterBound) {
      input.removeEventListener('keypress', this.handleEnterBound)
    }
    if (submitBtn && this.handleSubmitBound) {
      submitBtn.removeEventListener('click', this.handleSubmitBound)
    }

    // Disable input and button
    if (input) input.disabled = true
    if (submitBtn) submitBtn.disabled = true

    // Show the final code
    this.app.ui.reveal.container.classList.remove('hidden')
    this.app.ui.reveal.digit.textContent = this.expectedProduct

    // Show completion message
    if (this.app.ui.nextBtn) {
      this.app.ui.nextBtn.textContent = 'All Riddles Solved!'
      this.app.ui.nextBtn.classList.remove('hidden')
      this.app.ui.nextBtn.disabled = true
    }
  }

  cleanup() {
    this.app.state.isLevelActive = false

    // Remove event listeners
    const input = document.getElementById('multiply-input')
    const submitBtn = document.getElementById('multiply-submit')
    if (input && this.handleEnterBound) {
      input.removeEventListener('keypress', this.handleEnterBound)
    }
    if (submitBtn && this.handleSubmitBound) {
      submitBtn.removeEventListener('click', this.handleSubmitBound)
    }

    if (this.app.ui.level8 && this.app.ui.level8.container) {
      this.app.ui.level8.container.classList.add('hidden')
    }
  }
}
