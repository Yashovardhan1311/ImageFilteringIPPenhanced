// Canvas setup
const originalCanvas = document.getElementById('originalCanvas');
const filteredCanvas = document.getElementById('filteredCanvas');
const origCtx = originalCanvas.getContext('2d');
const filtCtx = filteredCanvas.getContext('2d');

let originalImageData = null;
let img = new Image();
let currentFilter = null;
let intensity = 1;
let brightness = 0;
let contrast = 1;
let history = [];
let historyIndex = -1;
let zoomLevel = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startX, startY;

// Initialize UI elements
const intensitySlider = document.getElementById('intensity');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const dropArea = document.getElementById('dropArea');
const loadingIndicator = document.getElementById('loadingIndicator');
const controlsPanel = document.getElementById('controlsPanel');
const toggleControls = document.getElementById('toggleControls');
const presetSelect = document.getElementById('presetSelect');
const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const resetZoomBtn = document.getElementById('resetZoom');
const themeToggle = document.getElementById('themeToggle');

function showLoading() {
  loadingIndicator.style.display = 'flex';
}

function hideLoading() {
  loadingIndicator.style.display = 'none';
}

function adjustCanvasSizes(width, height) {
  originalCanvas.width = filteredCanvas.width = width;
  originalCanvas.height = filteredCanvas.height = height;
  updateCanvas();
}

function saveState() {
  history = history.slice(0, historyIndex + 1);
  history.push({
    filter: currentFilter,
    intensity,
    brightness,
    contrast,
    imageData: filtCtx.getImageData(0, 0, filteredCanvas.width, filteredCanvas.height)
  });
  historyIndex++;
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    const state = history[historyIndex];
    currentFilter = state.filter;
    intensity = state.intensity;
    brightness = state.brightness;
    contrast = state.contrast;
    filtCtx.putImageData(state.imageData, 0, 0);
    updateSliders();
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    const state = history[historyIndex];
    currentFilter = state.filter;
    intensity = state.intensity;
    brightness = state.brightness;
    contrast = state.contrast;
    filtCtx.putImageData(state.imageData, 0, 0);
    updateSliders();
  }
}

function updateSliders() {
  intensitySlider.value = intensity;
  brightnessSlider.value = brightness;
  contrastSlider.value = contrast;
  document.getElementById('intensityValue').textContent = intensity.toFixed(1);
  document.getElementById('brightnessValue').textContent = brightness;
  document.getElementById('contrastValue').textContent = contrast.toFixed(1);
}

// Image upload handling
document.getElementById('upload').addEventListener('change', function(e) {
  handleImageUpload(e.target.files[0]);
});

// Drag and drop handling
dropArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropArea.classList.add('dragover');
});

dropArea.addEventListener('dragleave', () => {
  dropArea.classList.remove('dragover');
});

dropArea.addEventListener('drop', (e) => {
  e.preventDefault();
  dropArea.classList.remove('dragover');
  handleImageUpload(e.dataTransfer.files[0]);
});

function handleImageUpload(file) {
  if (file) {
    showLoading();
    const reader = new FileReader();
    reader.onload = function(event) {
      img.onload = function() {
        const maxWidth = 600;
        const maxHeight = 600;
        let width = img.width;
        let height = img.height;
        const scaleFactor = Math.min(maxWidth / width, maxHeight / height, 1);
        width = width * scaleFactor;
        height = height * scaleFactor;
        
        adjustCanvasSizes(width, height);
        origCtx.drawImage(img, 0, 0, width, height);
        filtCtx.drawImage(img, 0, 0, width, height);
        originalImageData = origCtx.getImageData(0, 0, width, height);
        resetFiltered();
        hideLoading();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
}

// Slider event listeners
intensitySlider.addEventListener('input', function(e) {
  intensity = parseFloat(e.target.value);
  document.getElementById('intensityValue').textContent = intensity.toFixed(1);
  applyAdjustments();
});

brightnessSlider.addEventListener('input', function(e) {
  brightness = parseInt(e.target.value);
  document.getElementById('brightnessValue').textContent = brightness;
  applyAdjustments();
});

contrastSlider.addEventListener('input', function(e) {
  contrast = parseFloat(e.target.value);
  document.getElementById('contrastValue').textContent = contrast.toFixed(1);
  applyAdjustments();
});

// Zoom and Pan
zoomInBtn.addEventListener('click', () => {
  zoomLevel *= 1.2;
  updateCanvas();
});

zoomOutBtn.addEventListener('click', () => {
  zoomLevel /= 1.2;
  if (zoomLevel < 0.1) zoomLevel = 0.1;
  updateCanvas();
});

resetZoomBtn.addEventListener('click', () => {
  zoomLevel = 1;
  panX = 0;
  panY = 0;
  updateCanvas();
});

filteredCanvas.addEventListener('mousedown', (e) => {
  isPanning = true;
  startX = e.offsetX - panX;
  startY = e.offsetY - panY;
});

filteredCanvas.addEventListener('mousemove', (e) => {
  if (isPanning) {
    panX = e.offsetX - startX;
    panY = e.offsetY - startY;
    updateCanvas();
  }
});

filteredCanvas.addEventListener('mouseup', () => {
  isPanning = false;
});

filteredCanvas.addEventListener('mouseleave', () => {
  isPanning = false;
});

function updateCanvas() {
  origCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
  filtCtx.clearRect(0, 0, filteredCanvas.width, filteredCanvas.height);
  
  origCtx.setTransform(1, 0, 0, 1, 0, 0);
  filtCtx.setTransform(1, 0, 0, 1, 0, 0);
  
  origCtx.translate(panX, panY);
  filtCtx.translate(panX, panY);
  
  origCtx.scale(zoomLevel, zoomLevel);
  filtCtx.scale(zoomLevel, zoomLevel);
  
  if (img.complete) {
    origCtx.drawImage(img, 0, 0, originalCanvas.width / zoomLevel, originalCanvas.height / zoomLevel);
  }
  if (originalImageData) {
    applyAdjustments();
  }
}

// Filter handling
function previewFilter(filter) {
  if (originalImageData) {
    let tempData = filtCtx.createImageData(originalImageData.width, originalImageData.height);
    tempData.data.set(new Uint8ClampedArray(originalImageData.data));
    tempData = applyFilter(tempData, filter);
    filtCtx.putImageData(tempData, 0, 0);
  }
}

function clearPreview() {
  if (originalImageData) {
    applyAdjustments();
  }
}

function handleFilter(filter) {
  if (currentFilter === filter) {
    console.log(`${filter} filter is already applied.`);
    return;
  }
  showLoading();
  currentFilter = filter;
  applyAdjustments();
  saveState();
  hideLoading();
}

function resetFiltered() {
  if (originalImageData) {
    showLoading();
    filtCtx.putImageData(originalImageData, 0, 0);
    currentFilter = null;
    intensity = 1;
    brightness = 0;
    contrast = 1;
    updateSliders();
    saveState();
    hideLoading();
  }
}

// Filter application
function applyFilter(imageData, filter) {
  let output = imageData;
  switch (filter) {
    case 'blur':
      output = convolution(imageData, [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]);
      break;
    case 'sharpen':
      output = convolution(imageData, [0, -1, 0, -1, 5, -1, 0, -1, 0]);
      break;
    case 'invert':
      output = invert(imageData);
      break;
    case 'smooth':
      output = convolution(imageData, [1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9, 1/9]);
      break;
    case 'grayscale':
      output = grayscale(imageData);
      break;
    case 'sepia':
      output = sepia(imageData);
      break;
    case 'edge':
      output = convolution(imageData, [-1, -1, -1, -1, 8, -1, -1, -1, -1]);
      break;
    case 'emboss':
      output = convolution(imageData, [-2, -1, 0, -1, 1, 1, 0, 1, 2]);
      break;
    case 'posterize':
      output = posterize(imageData);
      break;
  }
  return output;
}

function invert(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i];
    data[i + 1] = 255 - data[i + 1];
    data[i + 2] = 255 - data[i + 2];
  }
  return imageData;
}

function grayscale(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = data[i + 1] = data[i + 2] = avg;
  }
  return imageData;
}

function sepia(imageData) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    data[i] = Math.min(255, (r * 0.393) + (g * 0.769) + (b * 0.189));
    data[i + 1] = Math.min(255, (r * 0.349) + (g * 0.686) + (b * 0.168));
    data[i + 2] = Math.min(255, (r * 0.272) + (g * 0.534) + (b * 0.131));
  }
  return imageData;
}

function posterize(imageData) {
  const data = imageData.data;
  const levels = 4;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.floor(data[i] / (255 / levels)) * (255 / levels);
    data[i + 1] = Math.floor(data[i + 1] / (255 / levels)) * (255 / levels);
    data[i + 2] = Math.floor(data[i + 2] / (255 / levels)) * (255 / levels);
  }
  return imageData;
}

function convolution(imageData, kernel) {
  const side = Math.round(Math.sqrt(kernel.length));
  const halfSide = Math.floor(side / 2);
  const src = imageData.data;
  const sw = imageData.width;
  const sh = imageData.height;
  const output = filtCtx.createImageData(sw, sh);
  const dst = output.data;

  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      const dstOff = (y * sw + x) * 4;
      let r = 0, g = 0, b = 0;
      for (let cy = 0; cy < side; cy++) {
        for (let cx = 0; cx < side; cx++) {
          const scy = y + cy - halfSide;
          const scx = x + cx - halfSide;
          if (scy >= 0 && scy < sh && scx >= 0 && scx < sw) {
            const srcOff = (scy * sw + scx) * 4;
            const wt = kernel[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
      }
      dst[dstOff] = Math.min(255, Math.max(0, r));
      dst[dstOff + 1] = Math.min(255, Math.max(0, g));
      dst[dstOff + 2] = Math.min(255, Math.max(0, b));
      dst[dstOff + 3] = src[dstOff + 3];
    }
  }
  return output;
}

// Adjustments
function applyAdjustments() {
  if (!originalImageData) return;
  
  showLoading();
  let imageData = filtCtx.createImageData(originalImageData.width, originalImageData.height);
  imageData.data.set(new Uint8ClampedArray(originalImageData.data));
  let data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, data[i] + brightness));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness));
    
    let factor = contrast;
    data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * factor) + 128));
    data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * factor) + 128));
    data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * factor) + 128));
    
    data[i] = Math.min(255, Math.max(0, data[i] * intensity));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * intensity));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * intensity));
  }
  
  if (currentFilter) {
    imageData = applyFilter(imageData, currentFilter);
  }
  
  filtCtx.putImageData(imageData, 0, 0);
  saveState();
  hideLoading();
}

// Presets
function savePreset() {
  const name = document.getElementById('presetName').value;
  if (!name) return alert('Please enter a preset name');
  const preset = { name, filter: currentFilter, intensity, brightness, contrast };
  let presets = JSON.parse(localStorage.getItem('presets') || '[]');
  presets.push(preset);
  localStorage.setItem('presets', JSON.stringify(presets));
  updatePresetSelect();
  document.getElementById('presetName').value = '';
}

function loadPreset() {
  const value = presetSelect.value;
  if (!value) return;
  const presets = JSON.parse(localStorage.getItem('presets') || '[]');
  const preset = presets.find(p => p.name === value);
  if (preset) {
    currentFilter = preset.filter;
    intensity = preset.intensity;
    brightness = preset.brightness;
    contrast = preset.contrast;
    updateSliders();
    applyAdjustments();
  }
}

function updatePresetSelect() {
  const presets = JSON.parse(localStorage.getItem('presets') || '[]');
  presetSelect.innerHTML = '<option value="">Select Preset</option>';
  presets.forEach(preset => {
    const option = document.createElement('option');
    option.value = preset.name;
    option.textContent = preset.name;
    presetSelect.appendChild(option);
  });
}

// Download
function downloadFiltered() {
  if (!originalImageData) return alert('Please upload an image first!');
  const link = document.createElement('a');
  link.download = 'filtered_image.png';
  link.href = filteredCanvas.toDataURL('image/png');
  link.click();
}

// Toggle controls
toggleControls.addEventListener('click', () => {
  controlsPanel.classList.toggle('collapsed');
  toggleControls.textContent = controlsPanel.classList.contains('collapsed') ? 'Show Controls' : 'Hide Controls';
});

// Dark mode
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  themeToggle.textContent = document.body.classList.contains('dark-mode') ? '☀️' : '🌙';
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  }
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    redo();
  }
});

// Initialize presets
updatePresetSelect();
