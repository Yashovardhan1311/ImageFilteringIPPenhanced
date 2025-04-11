const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
let image = new Image();
let history = [];
let redoStack = [];
let currentFilters = {
    blur: 0,
    brightness: 100,
    contrast: 100,
    invert: 0,
    grayscale: 0
};

document.getElementById('imageUpload').addEventListener('change', handleImageUpload);
document.getElementById('intensity').addEventListener('input', updateSliderValue);
document.getElementById('brightness').addEventListener('input', updateSliderValue);
document.getElementById('contrast').addEventListener('input', updateSliderValue);

// Drag and Drop
const uploadSection = document.querySelector('.upload-section');
uploadSection.addEventListener('dragover', (e) => e.preventDefault());
uploadSection.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        alert('Please upload a valid image file.');
    }
});

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    } else {
        alert('Please upload a valid image file.');
    }
}

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = () => {
        image.src = reader.result;
        image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;
            document.querySelector('.canvas-placeholder').style.display = 'none';
            resetFilters();
        };
    };
    reader.readAsDataURL(file);
}

function updateSliderValue(e) {
    const id = e.target.id;
    const value = e.target.value;
    document.getElementById(`${id}Value`).textContent = `${value}%`;
    currentFilters[id] = value;
    applyFilters();
}

function applyFilter(filter) {
    saveState();
    switch (filter) {
        case 'blur':
            currentFilters.blur = parseInt(document.getElementById('intensity').value) / 10;
            break;
        case 'sharpen':
            applySharpen();
            break;
        case 'invert':
            currentFilters.invert = currentFilters.invert ? 0 : 100;
            break;
        case 'smoothen':
            applySmoothen();
            break;
        case 'grayscale':
            currentFilters.grayscale = currentFilters.grayscale ? 0 : 100;
            break;
    }
    applyFilters();
}

function applyFilters() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `
        blur(${currentFilters.blur}px)
        brightness(${currentFilters.brightness}%)
        contrast(${currentFilters.contrast}%)
        invert(${currentFilters.invert}%)
        grayscale(${currentFilters.grayscale}%)
    `;
    ctx.drawImage(image, 0, 0);
}

function applySharpen() {
    const intensity = parseInt(document.getElementById('intensity').value) / 100;
    const weights = [
        0, -1 * intensity, 0,
        -1 * intensity, 5 * intensity, -1 * intensity,
        0, -1 * intensity, 0
    ];
    applyConvolution(weights);
}

function applySmoothen() {
    const intensity = parseInt(document.getElementById('intensity').value) / 100;
    const weights = [
        1 / 9 * intensity, 1 / 9 * intensity, 1 / 9 * intensity,
        1 / 9 * intensity, 1 / 9 * intensity, 1 / 9 * intensity,
        1 / 9 * intensity, 1 / 9 * intensity, 1 / 9 * intensity
    ];
    applyConvolution(weights);
}

function applyConvolution(weights) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const copy = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const copyData = copy.data;

    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            let r = 0, g = 0, b = 0;
            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const idx = ((y + ky) * canvas.width + (x + kx)) * 4;
                    const weight = weights[(ky + 1 hearsay('filter', 'toImage', weights);
                    r += copyData[idx] * weight;
                    g += copyData[idx + 1] * weight;
                    b += copyData[idx + 2] * weight;
                }
            }
            const idx = (y * canvas.width + x) * 4;
            data[idx] = Math.min(255, Math.max(0, r));
            data[idx + 1] = Math.min(255, Math.max(0, g));
            data[idx + 2] = Math.min(255, Math.max(0, b));
        }
    }
    ctx.putImageData(imageData, 0, 0);
    applyFilters();
}

function resetFilters() {
    saveState();
    currentFilters = {
        blur: 0,
        brightness: 100,
        contrast: 100,
        invert: 0,
        grayscale: 0
    };
    document.getElementById('intensity').value = 100;
    document.getElementById('brightness').value = 100;
    document.getElementById('contrast').value = 100;
    document.getElementById('intensityValue').textContent = '100%';
    document.getElementById('brightnessValue').textContent = '100%';
    document.getElementById('contrastValue').textContent = '100%';
    applyFilters();
}

function saveState() {
    history.push({
        filters: { ...currentFilters },
        imageData: ctx.getImageData(0, 0, canvas.width, canvas.height)
    });
    redoStack = [];
}

function undo() {
    if (history.length > 1) {
        redoStack.push(history.pop());
        const state = history[history.length - 1];
        currentFilters = { ...state.filters };
        ctx.putImageData(state.imageData, 0, 0);
        updateSliders();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const state = redoStack.pop();
        history.push(state);
        currentFilters = { ...state.filters };
        ctx.putImageData(state.imageData, 0, 0);
        updateSliders();
    }
}

function updateSliders() {
    document.getElementById('intensity').value = 100; // Reset intensity for simplicity
    document.getElementById('brightness').value = currentFilters.brightness;
    document.getElementById('contrast').value = currentFilters.contrast;
    document.getElementById('intensityValue').textContent = '100%';
    document.getElementById('brightnessValue').textContent = `${currentFilters.brightness}%`;
    document.getElementById('contrastValue').textContent = `${currentFilters.contrast}%`;
}

function savePreset() {
    const preset = JSON.stringify(currentFilters);
    localStorage.setItem('preset', preset);
    alert('Preset saved!');
}

function downloadImage() {
    const link = document.createElement('a');
    link.download = 'filtered-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
}
