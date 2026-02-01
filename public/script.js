document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const controls = document.getElementById('controls');
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValue = document.getElementById('quality-value');
    const compressBtn = document.getElementById('compress-btn');
    const loading = document.getElementById('loading');
    const resultDiv = document.getElementById('result');
    const errorMsg = document.getElementById('error-msg');
    const resetBtn = document.getElementById('reset-btn');

    // Result Text Elements (Updated for New UI)
    const resOriginal = document.getElementById('res-original');
    const resCompressed = document.getElementById('res-compressed');
    const resSavings = document.getElementById('res-savings');

    let currentFile = null;

    // --- Event Listeners ---
    
    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        // Optional: Style change on drag over
        dropZone.style.opacity = '0.7';
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.style.opacity = '1';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.opacity = '1';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    // File Input
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // Slider
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    // Compress Action
    compressBtn.addEventListener('click', uploadAndCompress);
    
    // Reset
    resetBtn.addEventListener('click', resetUI);

    // --- Functions ---

    function handleFile(file) {
        if (!file.type.match('image.*')) {
            showError('Mohon unggah file gambar yang valid (JPG, PNG, WebP).');
            return;
        }
        if (file.size > 5 * 1024 * 1024) { // 5MB Limit
            showError('Ukuran file melebihi batas 5MB.');
            return;
        }

        currentFile = file;
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('original-size').textContent = formatBytes(file.size);
        
        // UI Transition: Hide Upload, Show Controls
        dropZone.classList.add('hidden');
        controls.classList.remove('hidden');
        errorMsg.classList.add('hidden');
    }

    async function uploadAndCompress() {
        if (!currentFile) return;

        controls.classList.add('hidden');
        loading.classList.remove('hidden');
        errorMsg.classList.add('hidden');

        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('quality', qualitySlider.value);

        try {
            // Backend API call (TIDAK DIUBAH)
            const response = await fetch('/api/compress', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || 'Gagal mengompres gambar');
            }

            const blob = await response.blob();
            displayResult(blob);

        } catch (error) {
            showError(error.message);
            loading.classList.add('hidden');
            controls.classList.remove('hidden');
        }
    }

    function displayResult(compressedBlob) {
        loading.classList.add('hidden');
        resultDiv.classList.remove('hidden');

        const originalSize = currentFile.size;
        const compressedSize = compressedBlob.size;
        const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

        // Update Before/After UI
        resOriginal.textContent = formatBytes(originalSize);
        resCompressed.textContent = formatBytes(compressedSize);
        resSavings.textContent = `Hemat ${savings}%`;

        // Create download link
        const url = URL.createObjectURL(compressedBlob);
        const downloadBtn = document.getElementById('download-btn');
        downloadBtn.href = url;
        downloadBtn.download = `compressed_${currentFile.name}`;
    }

    function resetUI() {
        resultDiv.classList.add('hidden');
        controls.classList.add('hidden');
        dropZone.classList.remove('hidden');
        fileInput.value = '';
        currentFile = null;
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
});
