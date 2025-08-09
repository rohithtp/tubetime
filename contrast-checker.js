// Contrast Checker and Display Port Utilization Tool
// This tool analyzes the extension's color contrast and display metrics

class ContrastChecker {
  constructor() {
    this.results = {
      contrast: {},
      display: {},
      recommendations: []
    };
  }

  // Calculate relative luminance
  calculateLuminance(r, g, b) {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  calculateContrastRatio(l1, l2) {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Check contrast for a color pair
  checkContrast(color1, color2, elementName) {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) {
      return { error: 'Invalid color format' };
    }

    const lum1 = this.calculateLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = this.calculateLuminance(rgb2.r, rgb2.g, rgb2.b);
    const ratio = this.calculateContrastRatio(lum1, lum2);

    const result = {
      color1,
      color2,
      ratio: ratio.toFixed(2),
      passes: {
        AA: ratio >= 4.5,
        AALarge: ratio >= 3,
        AAA: ratio >= 7,
        AAALarge: ratio >= 4.5
      },
      grade: this.getContrastGrade(ratio)
    };

    this.results.contrast[elementName] = result;
    return result;
  }

  // Get contrast grade
  getContrastGrade(ratio) {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    if (ratio >= 3) return 'A';
    return 'Fail';
  }

  // Check display port utilization
  checkDisplayUtilization() {
    const container = document.querySelector('.container');
    if (!container) {
      this.results.display.error = 'Container not found';
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const utilization = {
      width: (containerRect.width / viewport.width * 100).toFixed(1),
      height: (containerRect.height / viewport.height * 100).toFixed(1),
      area: ((containerRect.width * containerRect.height) / (viewport.width * viewport.height) * 100).toFixed(1)
    };

    this.results.display = {
      container: {
        width: containerRect.width,
        height: containerRect.height,
        area: containerRect.width * containerRect.height
      },
      viewport,
      utilization,
      recommendations: this.getDisplayRecommendations(utilization)
    };
  }

  // Get display recommendations
  getDisplayRecommendations(utilization) {
    const recommendations = [];
    
    if (parseFloat(utilization.width) > 90) {
      recommendations.push('Consider reducing width for better mobile experience');
    }
    
    if (parseFloat(utilization.height) > 80) {
      recommendations.push('Consider reducing height to avoid scrolling');
    }
    
    if (parseFloat(utilization.area) > 70) {
      recommendations.push('Extension takes up significant screen space');
    }
    
    return recommendations;
  }

  // Run comprehensive contrast analysis
  runAnalysis() {
    console.log('🔍 Running Contrast and Display Analysis...');
    
    // Check all color combinations from CSS variables
    const colorPairs = [
      {
        name: 'Primary Text on Surface',
        color1: '#1C1B1F', // --md-on-surface
        color2: '#FFFBFE'  // --md-surface
      },
      {
        name: 'Primary Text on Primary',
        color1: '#FFFFFF', // --md-on-primary
        color2: '#6750A4'  // --md-primary
      },
      {
        name: 'Secondary Text on Surface',
        color1: '#49454F', // --md-on-surface-variant
        color2: '#FFFBFE'  // --md-surface
      },
      {
        name: 'Gold Text on Primary',
        color1: '#FFD700', // --md-gold
        color2: '#6750A4'  // --md-primary
      },
      {
        name: 'Error Text on Error',
        color1: '#FFFFFF', // --md-on-error
        color2: '#BA1A1A'  // --md-error
      },
      {
        name: 'Text on Surface Container',
        color1: '#1C1B1F', // --md-on-surface
        color2: '#F3F0F4'  // --md-surface-container
      },
      {
        name: 'Outline on Surface',
        color1: '#79747E', // --md-outline
        color2: '#FFFBFE'  // --md-surface
      }
    ];

    colorPairs.forEach(pair => {
      this.checkContrast(pair.color1, pair.color2, pair.name);
    });

    // Check display utilization
    this.checkDisplayUtilization();

    // Generate recommendations
    this.generateRecommendations();

    return this.results;
  }

  // Generate overall recommendations
  generateRecommendations() {
    const recommendations = [];

    // Check contrast issues
    Object.entries(this.results.contrast).forEach(([name, result]) => {
      if (result.grade === 'Fail') {
        recommendations.push(`⚠️ ${name}: Contrast ratio ${result.ratio} fails WCAG guidelines`);
      } else if (result.grade === 'A') {
        recommendations.push(`⚠️ ${name}: Contrast ratio ${result.ratio} only meets WCAG A (large text)`);
      }
    });

    // Add display recommendations
    if (this.results.display.recommendations) {
      recommendations.push(...this.results.display.recommendations);
    }

    this.results.recommendations = recommendations;
  }

  // Generate HTML report
  generateReport() {
    const report = document.createElement('div');
    report.className = 'contrast-report';
    report.innerHTML = `
      <style>
        .contrast-report {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: 80vh;
          background: white;
          border: 2px solid #6750A4;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          overflow-y: auto;
          z-index: 10000;
          font-family: 'Roboto', sans-serif;
        }
        .contrast-report h2 {
          color: #6750A4;
          margin: 0 0 16px 0;
          font-size: 18px;
        }
        .contrast-report h3 {
          color: #1C1B1F;
          margin: 16px 0 8px 0;
          font-size: 14px;
        }
        .contrast-item {
          margin: 8px 0;
          padding: 8px;
          border-radius: 6px;
          background: #F3F0F4;
        }
        .contrast-ratio {
          font-weight: bold;
          font-family: monospace;
        }
        .grade-AAA { color: #4CAF50; }
        .grade-AA { color: #2196F3; }
        .grade-A { color: #FF9800; }
        .grade-Fail { color: #F44336; }
        .display-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 8px 0;
        }
        .stat-item {
          padding: 4px 8px;
          background: #E8DEF8;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }
        .recommendations {
          margin-top: 16px;
          padding: 12px;
          background: #FFF8E1;
          border-radius: 6px;
          border-left: 4px solid #FFC107;
        }
        .recommendations h4 {
          margin: 0 0 8px 0;
          color: #E65100;
        }
        .recommendations ul {
          margin: 0;
          padding-left: 20px;
        }
        .recommendations li {
          margin: 4px 0;
          font-size: 12px;
        }
        .close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: #6750A4;
        }
      </style>
      
      <button class="close-btn" onclick="this.parentElement.remove()">×</button>
      <h2>🎨 Contrast & Display Analysis</h2>
      
      <h3>Contrast Ratios</h3>
      ${Object.entries(this.results.contrast).map(([name, result]) => `
        <div class="contrast-item">
          <div><strong>${name}</strong></div>
          <div class="contrast-ratio grade-${result.grade}">
            Ratio: ${result.ratio} (${result.grade})
          </div>
          <div style="font-size: 12px; color: #666;">
            ${result.color1} on ${result.color2}
          </div>
        </div>
      `).join('')}
      
      <h3>Display Utilization</h3>
      <div class="display-stats">
        <div class="stat-item">
          <div><strong>Width</strong></div>
          <div>${this.results.display.utilization?.width}%</div>
        </div>
        <div class="stat-item">
          <div><strong>Height</strong></div>
          <div>${this.results.display.utilization?.height}%</div>
        </div>
        <div class="stat-item">
          <div><strong>Area</strong></div>
          <div>${this.results.display.utilization?.area}%</div>
        </div>
        <div class="stat-item">
          <div><strong>Container</strong></div>
          <div>${this.results.display.container?.width}×${this.results.display.container?.height}</div>
        </div>
      </div>
      
      ${this.results.recommendations.length > 0 ? `
        <div class="recommendations">
          <h4>💡 Recommendations</h4>
          <ul>
            ${this.results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    `;

    return report;
  }
}

// Initialize and run analysis
function runContrastAnalysis() {
  const checker = new ContrastChecker();
  const results = checker.runAnalysis();
  
  console.log('📊 Analysis Results:', results);
  
  // Display report
  const report = checker.generateReport();
  document.body.appendChild(report);
  
  return results;
}

// Auto-run when extension loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runContrastAnalysis);
} else {
  runContrastAnalysis();
}

// Export for manual use
window.ContrastChecker = ContrastChecker;
window.runContrastAnalysis = runContrastAnalysis; 