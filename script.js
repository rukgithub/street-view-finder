document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const addressInput = document.getElementById('address');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const errorMessage = error.querySelector('.error-message');
    const imageContainer = document.getElementById('imageContainer');
    const streetviewImg = document.getElementById('streetview');
    const addressInfo = document.getElementById('addressInfo').querySelector('.address-text');
    const coordinatesInfo = document.getElementById('coordinatesInfo').querySelector('.coordinates-text');
    const cacheInfo = document.getElementById('cacheInfo');
    const rotateLeft = document.getElementById('rotateLeft');
    const rotateRight = document.getElementById('rotateRight');
    const downloadBtn = document.getElementById('downloadBtn');

    // State management
    let currentRotation = 0;
    let currentImageData = null;

    // Fokuser på input ved start
    addressInput.focus();

    // Event Listeners
    addressInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });

    searchBtn.addEventListener('click', async function() {
        await fetchStreetView();
    });

    rotateLeft.addEventListener('click', function() {
        rotateImage(-90);
    });

    rotateRight.addEventListener('click', function() {
        rotateImage(90);
    });

    downloadBtn.addEventListener('click', function() {
        downloadImage();
    });

    // Hovedfunktion til at hente Street View
    async function fetchStreetView() {
        const address = addressInput.value.trim();
        if (!address) {
            showError('Indtast venligst en adresse');
            return;
        }

        showLoading(true);
        
        try {
            const response = await fetch('/get_streetview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: address })
            });

            const data = await response.json();

            if (data.status === 'error') {
                throw new Error(data.message);
            }

            currentImageData = data;
            showStreetView(data);
        } catch (err) {
            showError(err.message || 'Der skete en fejl ved hentning af billedet');
        } finally {
            showLoading(false);
        }
    }

    // UI Funktioner
    function showLoading(show) {
        loading.classList.toggle('d-none', !show);
        error.classList.add('d-none');
        if (show) {
            imageContainer.classList.add('d-none');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        error.classList.remove('d-none');
        loading.classList.add('d-none');
    }

    function showStreetView(data) {
        // Reset rotation
        currentRotation = 0;
        streetviewImg.style.transform = `rotate(${currentRotation}deg)`;

        // Vis billede og information
        streetviewImg.src = data.local_url || data.image_url;
        addressInfo.textContent = data.address;
        coordinatesInfo.textContent = data.coordinates;
        
        // Vis cache status hvis relevant
        cacheInfo.classList.toggle('d-none', !data.cached);
        
        imageContainer.classList.remove('d-none');

        // Smooth scroll til billedet
        imageContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    // Billede manipulation
    function rotateImage(degrees) {
        currentRotation = (currentRotation + degrees) % 360;
        streetviewImg.style.transform = `rotate(${currentRotation}deg)`;
    }

    async function downloadImage() {
        if (!currentImageData) return;

        try {
            const response = await fetch(currentImageData.local_url);
            const blob = await response.blob();
            
            // Opret filnavn baseret på adresse og dato
            const date = new Date().toISOString().split('T')[0];
            const address = currentImageData.address.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `streetview_${address}_${date}.jpg`;

            // Download filen
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(link.href);
        } catch (err) {
            showError('Kunne ikke downloade billedet');
        }
    }
}); 