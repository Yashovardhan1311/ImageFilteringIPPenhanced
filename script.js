const originalCanvas = document.getElementById('originalCanvas');
const filteredCanvas = document.getElementById('filteredCanvas');
const origCtx = originalCanvas.getContext('2d');
const filtCtx = filteredCanvas.getContext('2d');
const cropOverlay = document.getElementById('cropOverlay');

let originalImageData = null;
let currentFilter = null;
let img = new Image();
let intensity = 1;
let brightness = 0;
let contrast = 1;
let hue = 0;
let saturation = 1;
let isCropping = false;
let cropStartX, cropStartY, cropEndX, cropEndY;
let rotation = 0;
let flipH = 1, flipV = 1;
let showOriginal = false;

function adjustCanvasSizes(width, height) {
  originalCanvas.width = filteredCanvas.width = width;
  originalCanvas.height = filteredCanvas.height = height;
}

document.getElementById('upload').addEventListener('change', function(e) {
  if (e.target.files && e.target.files[0]) {
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
        drawImage();
        originalImageData = origCtx.getImageData(0, 0, width, height);
        applyAdjustments();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
});

// Slider event listeners
const intensitySlider = document.getElementById('intensity');
const brightnessSlider = document.getElementById('brightness');
const contrastSlider = document.getElementById('contrast');
const hueSlider = document.getElementById('hue');
const saturationSlider = document.getElementById('saturation');

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

hueSlider.addEventListener('input', function(e) {
  hue = parseInt(e.target.value);
  document.getElementById('hueValue').textContent = hue;
  applyAdjustments();
});

saturationSlider.addEventListener('input', function(e) {
  saturation = parseFloat(e.target.value);
  document.getElementById('saturationValue').textContent = saturation.toFixed(1);
  applyAdjustments();
});

// Crop functionality
function startCrop() {
  isCropping = true;
  cropOverlay.style.display = 'block';
  cropOverlay.style.left = '0px';
  cropOverlay.style.top = '0px';
  cropOverlay.style.width = '0px';
  cropOverlay.style.height = '0px';

  originalCanvas.addEventListener('mousedown', startCropDrag);
  originalCanvas.addEventListener('mousemove', updateCropDrag);
  originalCanvas.addEventListener('mouseup', endCropDrag);
}

function startCropDrag(e) {
  const rect = originalCanvas.getBoundingClientRect();
  cropStartX = e.clientX - rect.left;
  cropStartY = e.clientY - rect.top;
}

function updateCropDrag(e) {
  if (!isCropping) return;
  const rect = originalCanvas.getBoundingClientRect();
  cropEndX = e.clientX - rect.left;
  cropEndY = e.clientY - rect.top;

  const x = Math.min(cropStartX, cropEndX);
  const y = Math.min(cropStartY, cropEndY);
  const width = Math.abs(cropEndX - cropStartX);
  const height = Math.abs(cropEndY - cropStartY);

  cropOverlay.style.left = `${x}px`;
  cropOverlay.style.top = `${y}px`;
  cropOverlay.style.width = `${width}px`;
  cropOverlay.style.height = `${height}px`;
}

function endCropDrag() {
  isCropping = false;
  originalCanvas.removeEventListener('mousedown', startCropDrag);
  originalCanvas.removeEventListener('mousemove', updateCropDrag);
  originalCanvas.removeEventListener('mouseup', endCropDrag);
}

function applyCrop() {
  if (!originalImageData) return;
  const x = Math.min(cropStartX, cropEndX);
  const y = Math.min(cropStartY, cropEndY);
  const width = Math.abs(cropEndX - cropStartX);
  const height = Math.abs(cropEndY - cropStartY);

  const croppedData = origCtx.getImageData(x, y, width, height);
  adjustCanvasSizes(width, height);
  origCtx.putImageData(croppedData, 0, 0);
  originalImageData = croppedData;
  applyAdjustments();
  cropOverlay.style.display = 'none';
}

// Rotate and Flip
function rotateImage(degrees) {
  rotation = (rotation + degrees) % 360;
  drawImage();
  originalImageData = origCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  applyAdjustments();
}

function flipImage(direction) {
  if (direction === 'horizontal') flipH *= -1;
  if (direction === 'vertical') flipV *= -1;
  drawImage();
  originalImageData = origCtx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  applyAdjustments();
}

function drawImage() {
  origCtx.clearRect(0, 0, originalCanvas.width, originalCanvas.height);
  origCtx.save();
  origCtx.translate(originalCanvas.width / 2, originalCanvas.height / 2);
  origCtx.rotate(rotation * Math.PI / 180);
  origCtx.scale(flipH, flipV);
  origCtx.drawImage(img, -originalCanvas.width / 2, -originalCanvas.height / 2, originalCanvas.width, originalCanvas.height);
  origCtx.restore();
}

// Before/After Toggle
function toggleBeforeAfter() {
  showOriginal = !showOriginal;
  if (showOriginal) {
    filtCtx.putImageData(originalImageData, 0, 0);
  } else {
    applyAdjustments();
  }
}

function resetFiltered() {
  if (originalImageData) {
    filtCtx.putImageData(originalImageData, 0, 0);
    currentFilter = null;
    intensity = 1;
    brightness = 0;
    contrast = 1;
    hue = 0;
    saturation = 1;
    rotation = 0;
    flipH = 1;
    flipV = 1;
    updateSliders();
    applyAdjustments();
  }
}

function handleFilter(filter) {
  if (currentFilter === filter) {
    console.log(`${filter} filter is already applied.`);
    return;
  }
  currentFilter = filter;
  applyAdjustments();
}

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
  }
  return output;
}

function applyAdjustments() {
  if (!originalImageData) return;
  
  let imageData = filtCtx.createImageData(originalImageData.width, originalImageData.height);
  imageData.data.set(new Uint8ClampedArray(originalImageData.data));
  let data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // RGB to HSL conversion for hue and saturation
    let r = data[i] / 255;
    let g = data[i + 1] / 255;
    let b = data[i + 2] / 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Apply hue shift
    h = (h + hue / 360) % 1;
    if (h < 0) h += 1;

    // Apply saturation
    s = Math.min(1, Math.max(0, s * saturation));

    // HSL to RGB conversion
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      let p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    // Apply brightness, contrast, and intensity
    r = Math.min(1, Math.max(0, r + brightness / 255));
    g = Math.min(1, Math.max(0, g + brightness / 255));
    b = Math.min(1, Math.max(0, b + brightness / 255));

    let factor = contrast;
    r = Math.min(1, Math.max(0, ((r - 0.5) * factor) + 0.5));
    g = Math.min(1, Math.max(0, ((g - 0.5) * factor) + 0.5));
    b = Math.min(1, Math.max(0, ((b - 0.5) * factor) + 0.5));

    r *= intensity;
    g *= intensity;
    b *= intensity;

    data[i] = Math.min(255, Math.max(0, r * 255));
    data[i + 1] = Math.min(255, Math.max(0, g * 255));
    data[i + 2] = Math.min(255, Math.max(0, b * 255));
  }

  if (currentFilter) {
    imageData = applyFilter(imageData, currentFilter);
  }

  filtCtx.putImageData(imageData, 0, 0);
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

function downloadFiltered() {
  if (!originalImageData) return alert('Please upload an image first!');
  const link = document.createElement('a');
  link.download = 'filtered_image.png';
  link.href = filteredCanvas.toDataURL('image/png');
  link.click();
}

function updateSliders() {
  intensitySlider.value = intensity;
  brightnessSlider.value = brightness;
  contrastSlider.value = contrast;
  hueSlider.value = hue;
  saturationSlider.value = saturation;
  document.getElementById('intensityValue').textContent = intensity.toFixed(1);
  document.getElementById('brightnessValue').textContent = brightness;
  document.getElementById('contrastValue').textContent = contrast.toFixed(1);
  document.getElementById('hueValue').textContent = hue;
  document.getElementById('saturationValue').textContent = saturation.toFixed(1);
}
