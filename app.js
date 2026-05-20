// TRASFONDO DE LOS TALLERES DE RESPALDO (Por si el archivo del servidor empieza vacío)
const INITIAL_WORKSHOPS = [
    {
        id: '1',
        title: 'Tarot y Creatividad',
        description: 'Explora tu momento vital a través del Tarot y la astrología. Una sesión donde las cartas revelan patrones y posibilidades para tu camino.',
        price: '45',
        date: '2024-05-20T18:00',
        tags: ['TAROT & ASTROLOGÍA', 'PRESENCIAL'],
        location: 'Calle de la Luna, 15, Madrid'
    },
    {
        id: '2',
        title: 'Acuarela Intuitiva',
        description: 'Deja que el agua y el color fluyan sin juicio. Una experiencia guiada para conectar con tu expression más auténtica a través de la acuarela.',
        price: '30',
        date: '2024-05-22T17:30',
        tags: ['CREATIVIDAD INTUITIVA', 'ONLINE'],
        location: 'Zoom (Enlace tras inscripción)'
    },
    {
        id: '3',
        title: 'Taller de Macramé',
        description: 'Aprende el arte del macramé desde cero. Crearás tu primera pieza decorativa mientras te sumerges en la meditación de los nudos.',
        price: '35',
        date: '2024-05-25T11:00',
        tags: ['ARTESANÍA', 'PRESENCIAL'],
        location: 'Av. de las Artes, 42, Valencia'
    }
];

let activeFilter = 'TODOS';

// ELEMENTOS DEL DOM
const workshopsGrid = document.getElementById('workshops-grid');
const filtersContainer = document.getElementById('filters');
const noResults = document.getElementById('no-results');
const yearSpan = document.getElementById('year');
const bookingModal = document.getElementById('booking-modal');
const bookingForm = document.getElementById('booking-form');
const modalWorkshopTitle = document.getElementById('modal-workshop-title');
const adminModal = document.getElementById('admin-modal');
const clientsCount = document.getElementById('clients-count');
const clientsBody = document.getElementById('clients-body');

let selectedWorkshop = null;
let workshops = []; // Esta lista se llenará con lo que diga el servidor en vivo

// INICIALIZACIÓN CON CONEXIÓN AL SERVIDOR
async function init() {
    try {
        // CAMBIO 1: Apuntar a la tubería de /api/talleres en español
        const response = await fetch('/api/talleres');
        const data = await response.json();
        
        // Mapeamos lo que viene de la base de datos (español) al formato de tu interfaz (inglés) para no romper tus tarjetas fijas
        workshops = data.map(w => ({
            id: w.id,
            title: w.titulo,
            description: w.descripcion,
            price: w.precio,
            date: w.fecha,
            location: w.direccion,
            tags: Array.isArray(w.categoria) ? w.categoria : [w.categoria, w.modalidad].filter(Boolean)
        }));
        
        if (workshops.length === 0) {
            workshops = [...INITIAL_WORKSHOPS];
        }
    } catch (error) {
        console.error("Error cargando del servidor, usando copia de seguridad local:", error);
        workshops = [...INITIAL_WORKSHOPS];
    }

    renderFilters();
    renderWorkshops();
    
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();
    
    if (bookingForm) {
        bookingForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(bookingForm);
            
            // Recogemos los datos del cliente para mandarlos al cajón 'reservas' de Neon
            const booking = {
                taller_id: selectedWorkshop.id,
                nombre_cliente: `${formData.get('name')} ${formData.get('lastName')}`,
                email_cliente: formData.get('email'),
                telefono_cliente: formData.get('phone')
            };

            try {
                const response = await fetch('/api/reservas', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(booking)
                });

                if (response.ok) {
                    closeBookingModal();
                    alert('¡Reserva realizada con éxito y guardada en Neon!');
                    loadBookingsToTable();
                } else {
                    alert('Hubo un problema al guardar tu reserva.');
                }
            } catch (err) {
                console.error(err);
                alert('Error al conectar con el servidor.');
            }
        };
    }
}

// FUNCIONES DEL MODAL DE RESERVAS
window.openBookingModal = function(workshopId) {
    selectedWorkshop = workshops.find(w => w.id === workshopId.toString());
    if (selectedWorkshop) {
        modalWorkshopTitle.textContent = selectedWorkshop.title;
        bookingModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
};

window.closeBookingModal = function() {
    bookingModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
    bookingForm.reset();
};

window.openAdminModal = function() {
    adminModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadBookingsToTable();
};

window.closeAdminModal = function() {
    adminModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
};

// RENDERIZAR TARJETAS EN LA WEB
function renderWorkshops() {
    const filtered = activeFilter === 'TODOS' 
        ? workshops 
        : workshops.filter(w => w.tags && w.tags.map(t => t.toUpperCase()).includes(activeFilter));

    workshopsGrid.innerHTML = '';
    
    if (filtered.length === 0) {
        noResults.classList.remove('hidden');
    } else {
        noResults.classList.add('hidden');
        
        filtered.forEach((w, index) => {
            workshopsGrid.appendChild(createWorkshopCard(w, index));
        });
    }
    renderCalendar();
}

function renderCalendar() {
    const calendarContainer = document.getElementById('calendar-timeline');
    if (!calendarContainer) return;
    
    const sortedWorkshops = [...workshops].sort((a, b) => new Date(a.date) - new Date(b.date));
    calendarContainer.innerHTML = sortedWorkshops.length === 0 ? '<p>No hay fechas.</p>' : '';
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

    sortedWorkshops.forEach((w) => {
        const dateObj = new Date(w.date);
        const day = isNaN(dateObj.getTime()) ? '00' : dateObj.getDate().toString().padStart(2, '0');
        const month = isNaN(dateObj.getTime()) ? 'MIN' : months[dateObj.getMonth()];
        const status = w.tags && w.tags.includes('ONLINE') ? 'Online' : 'Presencial';

        calendarContainer.innerHTML += `
            <div class="cal-date-card" onclick="openBookingModal('${w.id}')">
                <div class="cal-day">${day}</div>
                <div class="cal-month">${month}</div>
                <div class="cal-title">${w.title}</div>
                <div class="cal-status">${status}</div>
            </div>
        `;
    });
}

function createWorkshopCard(workshop, index) {
    const cardColors = [
        { border: '#6366f1', tag: '#4338ca' },
        { border: '#f43f5e', tag: '#be123c' },
        { border: '#f59e0b', tag: '#b45309' },
        { border: '#06b6d4', tag: '#0e7490' },
    ];
    const color = cardColors[index % cardColors.length];

    const card = document.createElement('article');
    card.className = 'workshop-card';
    card.style.background = `linear-gradient(135deg, ${color.border}12 0%, #ffffff 70%)`;
    
    const tape = document.createElement('div');
    tape.className = 'washi-tape';
    tape.style.backgroundColor = color.border;
    card.appendChild(tape);
    
    const dateObj = new Date(workshop.date);
    const formattedDate = isNaN(dateObj.getTime()) 
        ? workshop.date 
        : dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
        <div class="card-tags">
            ${workshop.tags ? workshop.tags.map(tag => `<span class="tag" style="color: ${color.tag}">#${tag}</span>`).join('') : ''}
        </div>
        <h3>${workshop.title}</h3>
        <p class="workshop-desc">${workshop.description || ''}</p>
        <div class="workshop-info-group">
            <p class="workshop-info-item">📅 ${formattedDate}</p>
            <p class="workshop-info-item">📍 ${workshop.location || 'Consultar'}</p>
        </div>
        <div class="card-footer">
            <span class="price-value">${workshop.price}€</span>
            <button class="btn-small" onclick="openBookingModal('${workshop.id}')">Reservar</button>
        </div>
    `;
    return card;
}

// MANDAR NUEVO TALLER AL SERVIDOR
window.addWorkshop = async function(event) {
    event.preventDefault();
    const form = event.target;
    
    const category = document.getElementById('workshop-category').value;
    const modalidad = document.getElementById('check-online').checked ? 'ONLINE' : 'PRESENCIAL';
    
    // Traducimos los nombres para que la base de datos los meta en sus cajones correctos
    const datosTaller = {
        titulo: form.querySelector('input[type="text"]').value,
        precio: parseInt(document.getElementById('workshop-price').value) || 0,
        fecha: document.getElementById('workshop-date').value,
        direccion: document.getElementById('workshop-location').value,
        categoria: category,
        modalidad: modalidad,
        descripcion: form.querySelector('textarea').value,
        imagen_url: 'ink-splash.png' // Cartel por defecto temporal hasta meter Cloudinary
    };

    try {
        // CAMBIO 2: Fetch a la ruta correcta en español
        const response = await fetch('/api/talleres', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosTaller)
        });
        
        if (response.ok) {
            // CAMBIO 3: Recargar la lista en español
            const resData = await fetch('/api/talleres');
            const data = await resData.json();
            
            workshops = data.map(w => ({
                id: w.id,
                title: w.titulo,
                description: w.descripcion,
                price: w.precio,
                date: w.fecha,
                location: w.direccion,
                tags: [w.categoria, w.modalidad].filter(Boolean)
            }));
            
            renderWorkshops();
            renderFilters();
            form.reset();
            switchTab('manage');
            alert('¡Taller publicado con éxito en Neon!');
        }
    } catch (error) {
        alert('Error al conectar con el servidor.');
    }
};

function loadWorkshopsToManage() {
    const manageContainer = document.getElementById('content-manage');
    manageContainer.innerHTML = workshops.length > 0
        ? `<div class="manage-list">
            ${workshops.map(w => `
                <div class="manage-item">
                    <div class="manage-info">
                        <strong>${w.title}</strong>
                        <span>${w.price}€</span>
                    </div>
                    <button class="btn-delete" onclick="deleteWorkshop('${w.id}')">Eliminar</button>
                </div>
            `).join('')}
        </div>`
        : '<p class="empty-msg">No hay talleres para gestionar.</p>';
}

window.deleteWorkshop = async function(id) {
    if (confirm('¿Estás seguro de que quieres eliminar este taller del servidor?')) {
        try {
            // CAMBIO 4: Ruta de borrado adaptada a español
            const response = await fetch(`/api/talleres/${id}`, { method: 'DELETE' });
            if (response.ok) {
                workshops = workshops.filter(w => w.id !== id.toString());
                renderWorkshops();
                loadWorkshopsToManage();
                alert('Taller eliminado.');
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    }
};

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
    
    document.getElementById(`tab-${tabName}`).classList.add('active');
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    if (tabName === 'clients') loadBookingsToTable();
    if (tabName === 'manage') loadWorkshopsToManage();
    if (tabName === 'new') {
        const form = document.querySelector('#content-new form');
        if (form) form.onsubmit = window.addWorkshop;
    }
};

function loadBookingsToTable() {
    const bookings = JSON.parse(localStorage.getItem('lapeculiar_bookings') || '[]');
    clientsCount.textContent = bookings.length;
    
    clientsBody.innerHTML = bookings.length > 0 
        ? bookings.map(b => `
            <tr>
                <td>${b.name} ${b.lastName}</td>
                <td>${b.email} • ${b.phone}</td>
                <td>${b.workshopTitle}</td>
                <td>${b.paymentMethod}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="4">No hay reservas todavía.</td></tr>';
}

function renderFilters() {
    filtersContainer.innerHTML = '';
    const allTags = new Set(['TODOS']);
    workshops.forEach(w => {
        if (w.tags) w.tags.forEach(t => allTags.add(t.toUpperCase()));
    });

    Array.from(allTags).forEach(tag => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${activeFilter === tag ? 'active' : ''}`;
        btn.textContent = tag;
        btn.onclick = () => {
            activeFilter = tag;
            renderFilters();
            renderWorkshops();
        };
        filtersContainer.appendChild(btn);
    });
}

window.scrollToId = function(id) {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
};

window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
};

init();