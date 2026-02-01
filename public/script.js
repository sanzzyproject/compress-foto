document.addEventListener('DOMContentLoaded', () => 
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

    let currentFile = null;

    // Drag & Drop Events
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    // File Input Event
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    // Slider Event
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = e.target.value;
    });

    // Buttons Events
    compressBtn.addEventListener('click', uploadAndCompress);
    resetBtn.addEventListener('click', resetUI);

    // Functions
    function handleFile(file) {
        // Validasi tipe file
        if (!file.type.match('image.*')) {
            showError('Mohon unggah file gambar yang valid (JPG, PNG, WebP).');
            return;
        }
        // Validasi ukuran (contoh 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showError('Ukuran file melebihi batas 5MB.');
            return;
        }

        currentFile = file;
        document.getElementById('file-name').textContent = file.name;
        document.getElementById('original-size').textContent = formatBytes(file.size);
        
        // Update UI
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
            // PENTING: Endpoint '/api/compress' harus ada di backend Anda
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

        document.getElementById('res-original').textContent = formatBytes(originalSize);
        document.getElementById('res-compressed').textContent = formatBytes(compressedSize);
        document.getElementById('res-savings').textContent = `${savings}%`;

        // Buat link download
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


    // ==========================================
    // TAMBAHAN: LOGIKA UNTUK SLIDER TESTIMONI
    // ==========================================
    const sliderContainer = document.querySelector('.testimonial-slider-container');
    const prevBtn = document.querySelector('.prev-slide');
    const nextBtn = document.querySelector('.next-slide');

    if (sliderContainer && prevBtn && nextBtn) {
        // Jarak scroll setiap kali tombol ditekan (kira-kira lebar satu kartu + gap)
        const scrollAmount = 380; 

        nextBtn.addEventListener('click', () => {
            sliderContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            sliderContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        });
    }
});
