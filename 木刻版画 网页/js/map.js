const mapWrapper = document.getElementById('mapWrapper');

let scale = 1;
let posX = 0;
let posY = 0;
let startX, startY;
let isDragging = false;

mapWrapper.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX - posX;
    startY = e.clientY - posY;
    mapWrapper.style.cursor = 'grabbing';
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    posX = e.clientX - startX;
    posY = e.clientY - startY;
    updateTransform();
});

document.addEventListener('mouseup', () => {
    isDragging = false;
    mapWrapper.style.cursor = 'grab';
});

mapWrapper.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    scale = Math.min(Math.max(0.5, scale + delta), 3);
    updateTransform();
});

function updateTransform() {
    mapWrapper.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
}

updateTransform();
