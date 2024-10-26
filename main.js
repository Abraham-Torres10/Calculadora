import './style.css'

const bmiCategories = [
  { range: 'Underweight', min: 0, max: 18.5, color: '#87CEEB' },
  { range: 'Normal', min: 18.5, max: 24.9, color: '#90EE90' },
  { range: 'Overweight', min: 25, max: 29.9, color: '#FFD700' },
  { range: 'Obese', min: 30, max: 100, color: '#FF6B6B' }
]

function calculateBMI(weight, height) {
  const heightInMeters = height / 100
  return (weight / (heightInMeters * heightInMeters)).toFixed(1)
}

function getBMICategory(bmi) {
  return bmiCategories.find(category => bmi >= category.min && bmi <= category.max)
}

function createGauge() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 120 80')
  
  const radius = 55
  const centerX = 60
  const centerY = 60
  
  svg.innerHTML = `
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    
    <!-- Background Arc -->
    <path class="gauge-bg" 
          d="M 5 60 A ${radius} ${radius} 0 0 1 115 60" 
          fill="none" 
          stroke="#444" 
          stroke-width="6"
          stroke-linecap="round"/>
    
    <!-- Category Segments -->
    ${bmiCategories.map((category, index) => {
      const startAngle = 180 - (180 * (category.min - 15) / 25)
      const endAngle = 180 - (180 * (category.max - 15) / 25)
      const start = polarToCartesian(centerX, centerY, radius, startAngle)
      const end = polarToCartesian(centerX, centerY, radius, endAngle)
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
      
      const labelAngle = (startAngle + endAngle) / 2
      const labelRadius = radius - 12
      const valueRadius = radius + 15
      const labelPos = polarToCartesian(centerX, centerY, labelRadius, labelAngle)
      const valuePos = polarToCartesian(centerX, centerY, valueRadius, labelAngle)
      
      // Adjust text-anchor based on position
      const textAnchor = labelAngle > 150 ? "end" : 
                        labelAngle < 30 ? "start" : 
                        "middle"
      
      return `
        <path class="gauge-segment" 
              d="M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}"
              fill="none" 
              stroke="${category.color}" 
              stroke-width="6"
              stroke-linecap="round"/>
        <text x="${labelPos.x}" 
              y="${labelPos.y}" 
              fill="${category.color}"
              text-anchor="${textAnchor}" 
              class="gauge-label"
              transform="rotate(${labelAngle > 90 ? labelAngle - 180 : labelAngle} ${labelPos.x} ${labelPos.y})">
          ${category.range}
        </text>
        <text x="${valuePos.x}" 
              y="${valuePos.y}" 
              fill="${category.color}"
              text-anchor="${textAnchor}" 
              class="gauge-value"
              transform="rotate(${labelAngle > 90 ? labelAngle - 180 : labelAngle} ${valuePos.x} ${valuePos.y})">
          ${category.min}${category.max === 100 ? '+' : '-' + category.max}
        </text>`
    }).join('')}
    
    <!-- Needle -->
    <g id="needle-group" filter="url(#glow)">
      <circle id="gauge-needle-pivot" cx="${centerX}" cy="${centerY}" r="3" fill="#fff"/>
      <path id="gauge-needle" 
            d="M${centerX} ${centerY} L${centerX} ${centerY - radius + 8}" 
            stroke="#fff" 
            stroke-width="2"
            stroke-linecap="round"/>
    </g>
  `
  return svg
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  }
}

function updateNeedle(bmi) {
  const angle = 180 - (180 * (Math.min(Math.max(bmi, 15), 40) - 15) / 25)
  const needleGroup = document.getElementById('needle-group')
  needleGroup.style.transform = `rotate(${angle}deg)`
  needleGroup.style.transformOrigin = '60px 60px'
}

document.querySelector('#app').innerHTML = `
  <div class="container">
    <h1>BMI Calculator</h1>
    <div class="calculator">
      <div class="input-group">
        <label for="weight">Weight (kg)</label>
        <input type="number" id="weight" min="30" max="300" step="0.1" placeholder="Enter weight">
      </div>
      <div class="input-group">
        <label for="height">Height (cm)</label>
        <input type="number" id="height" min="100" max="250" placeholder="Enter height">
      </div>
      <button id="calculate">Calculate BMI</button>
      
      <div class="result hidden" id="result">
        <h2>Your BMI: <span id="bmi-value"></span></h2>
        <p>Category: <span id="bmi-category"></span></p>
        <div class="gauge-container">
          ${createGauge().outerHTML}
        </div>
      </div>
    </div>
  </div>
`

const calculateBtn = document.querySelector('#calculate')
const resultDiv = document.querySelector('#result')
const bmiValue = document.querySelector('#bmi-value')
const bmiCategory = document.querySelector('#bmi-category')

calculateBtn.addEventListener('click', () => {
  const weight = parseFloat(document.querySelector('#weight').value)
  const height = parseFloat(document.querySelector('#height').value)

  if (!weight || !height) {
    alert('Please enter valid weight and height')
    return
  }

  const bmi = calculateBMI(weight, height)
  const category = getBMICategory(bmi)
  
  bmiValue.textContent = bmi
  bmiCategory.textContent = category.range
  bmiCategory.style.color = category.color
  
  updateNeedle(bmi)
  resultDiv.classList.remove('hidden')
})