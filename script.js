var userLocationMarker; // Variable para el marcador de la ubicación del usuario
var destinationMarker; // Variable para el marcador del destino
var currentZoom = 15; // Variable para almacenar el nivel de zoom actual
var workLocation; // Variable para almacenar la ubicación del lugar de trabajo
var homeLocation; // Variable para almacenar la ubicación del lugar del hogar
var map = L.map('map').setView([40.544, -4.012], currentZoom); // Variable para almacenar el mapa
var circle; // Variable para el marcador de destino
var trail; // Variable para el marcador de ubicación
var noAlarmsMode = false; // Variable de Modo sin Alarmas (Alarmas activadas por defecto)
const canVibrate = window.navigator.vibrate;
if (canVibrate) window.navigator.vibrate(100);

// OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);



// --------------- FUNCIONALIDAD 1: DEFINIR UN LUGAR DE DESTINO EN EL MAPA ---------------


// Función para colocar destino en mapa
function setDestination(latlng) {
  if (destinationMarker) {
    // Si ya hay marcador en el mapa se quita el marcador y su radio
    map.removeLayer(destinationMarker);
    map.removeLayer(circle);
  }
  // Se coloca el marcador en el destino
  destinationMarker = L.marker(latlng).addTo(map).bindPopup(`<b>Destino:</b><br>Latitud: ${latlng.lat}<br>Longitud: ${latlng.lng} <br><button onclick='saveWorkLocation(${latlng.lat}, ${latlng.lng})'>Guardar como Trabajo</button> <button onclick='saveHomeLocation(${latlng.lat}, ${latlng.lng})'>Guardar como Hogar</button>`).openPopup();
  circle = L.circle(latlng, {radius: 50}).addTo(map);
  map.setView(latlng, currentZoom);
}


// Función para colocar destino al hacer click y obtener direccion destino
function onMapClick(e) {
  // Colocar el destino (con latitud y longitud)
  setDestination(e.latlng);

  // Obtener la dirección del destino seleccionado con la API de geocodificación inversa de OpenStreetMap Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${e.latlng.lat}&lon=${e.latlng.lng}&format=json`)
    .then(response => response.json())
    .then(data => {
      const address = data.display_name;
      document.getElementById('destination').textContent = "Dirección de destino: " + address;
    })
    .catch(error => console.error('Error al obtener la dirección del destino:', error));
}


// Cuando se hace click se coloca el destino con la función onMapClick
map.on('click', onMapClick);



// --------------- FUNCIONALIDAD 2: OBTENER LA UBICACIÓN ACTUAL ---------------


// API de geolocalización para obtener la ubicación del usuario en todo momento
navigator.geolocation.watchPosition(onGeolocationSuccess, onGeolocationError);


// Si se tiene la ubicacion del usuario se actualiza la variable userLocation
function onGeolocationSuccess(position) {
  var userLat = position.coords.latitude;
  var userLng = position.coords.longitude;
  
  if (userLocationMarker) {
    // Si ya hay marcador en el mapa se quita el marcador y su radio
    map.removeLayer(userLocationMarker);
  }

  // Se coloca el marcador en el destino
  userLocationMarker = L.marker([userLat, userLng]).addTo(map).bindPopup(`<b>Estas aquí:</b><br>Latitud: ${userLat}<br>Longitud: ${userLng}`).openPopup(); // Añadimos marker con popup con coordenadas
  trail = L.circle([userLat, userLng], {radius: 50}).addTo(map); // No se quita el marcador circle para que se vea el trayecto realizado por el usuario
  map.setView([userLat, userLng], currentZoom);
  
  // Obtener la dirección del destino seleccionado con la API de geocodificación inversa de OpenStreetMap Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`)
    .then(response => response.json())
    .then(data => {
      const address = data.display_name;
      document.getElementById('departure').textContent = "Tu ubicacion: "+address;
    })
}


// Si no se puede obtener la ubicacion del usuario se avisa el error
function onGeolocationError() {
    console.log('Error al obtener la ubicación.');
    document.getElementById('departure').textContent = "No se ha podido obtener su ubicación actual";
}



// --------------- FUNCIONALIDAD 3: AVISO DE CERCANIA Y LLEGADA AL DESTINO ---------------


// Función para controlar la distancia del usuario a su destino
function checkDistance() {
  // Primero tiene que haber un destino seleccionado
  if (destinationMarker && userLocationMarker) {
    // Calculamos la distancia entre ubicación y destino
    var distance = map.distance(userLocationMarker.getLatLng(), destinationMarker.getLatLng());
    
    // Ajustar la vibración según la distancia
    var vibrationDuration = Math.max(1000 - distance * 10, 100); // Cuanto más cerca, más vibra
    if (!noAlarmsMode) {
      if (distance <= 50) {
        navigator.vibrate([vibrationDuration, 100, vibrationDuration, 100, vibrationDuration]); // Vibra 3 veces según la duración calculada con dos parones de 0.1s
        document.getElementById('proximityMessage').textContent = '     ¡Has llegado a tu destino!';
        document.getElementById('proximityAlert').style.display = 'flex'; // Mostrar la alerta
      }
      else if (distance <= 200) {
        navigator.vibrate(vibrationDuration); // Vibra según la duración calculada
        document.getElementById('proximityMessage').textContent = '     Estás cerca de tu destino';
        document.getElementById('proximityAlert').style.display = 'flex'; // Mostrar la alerta
      }
    }
  }
}


setInterval(checkDistance, 10000); // Se actualiza el cálculo de distancia cada 10s



// --------------- FUNCIONALIDAD 4: MANTENIMIENTO DEL ZOOM SELECCIONADO ---------------


// Función para manejar el evento de cambio de nivel de zoom
map.on('zoomend', function() {
  currentZoom = map.getZoom(); // Actualizar el nivel de zoom actual
});



// --------------- FUNCIONALIDAD 5: CENTRAR MAPA AL HACER CLICK EN DIRECCION (MENU) ---------------


// Al hacer click en Tu Ubicación se centra el mapa en la ubicacion del usuario
document.getElementById("departure").addEventListener("click", function() {
  map.setView(userLocationMarker.getLatLng(), currentZoom);
});


// Al hacer click en Destino se centra el mapa en la ubicacion del destino seleccionado
document.getElementById("destination").addEventListener("click", function() {
  map.setView(destinationMarker.getLatLng(), currentZoom);
});



//  --------------- FUNCIONALIDAD 6: PARAR AVISO ---------------

// Manejar el clic en el botón de cerrar alerta de cercanía
document.getElementById('closeProximityAlert').addEventListener('click', function() {
  document.getElementById('proximityAlert').style.display = 'none'; // Ocultar la alerta al cerrarla
  navigator.vibrate(0); // Parar el patron de vibración
});

    document.getElementById('noAlarms').addEventListener('click', function() {
      // Cambiar el contenido del div según el estado actual de noAlarmsMode
      if (noAlarmsMode) {
          this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell-fill" viewBox="0 0 16 16">
              <path d="M8 16a2 2 0 0 0 2-2H6a2 2 0 0 0 2 2m.995-14.901a1 1 0 1 0-1.99 0A5 5 0 0 0 3 6c0 1.098-.5 6-2 7h14c-1.5-1-2-5.902-2-7 0-2.42-1.72-4.44-4.005-4.901"/>
          </svg>`;
      } else {
          this.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-bell-slash-fill" viewBox="0 0 16 16">
              <path d="M5.164 14H15c-1.5-1-2-5.902-2-7q0-.396-.06-.776zm6.288-10.617A5 5 0 0 0 8.995 2.1a1 1 0 1 0-1.99 0A5 5 0 0 0 3 7c0 .898-.335 4.342-1.278 6.113zM10 15a2 2 0 1 1-4 0zm-9.375.625a.53.53 0 0 0 .75.75l14.75-14.75a.53.53 0 0 0-.75-.75z"/>
          </svg>`;
      }
      // Cambiar el estado de noAlarmsMode al hacer clic en el div
      noAlarmsMode = !noAlarmsMode;
    });


//  --------------- FUNCIONALIDAD 7: BOTON COMPARTIR ---------------

document.getElementById("shareButton").addEventListener("click", function() {
  // Verificar si el navegador soporta la geolocalización
  if ("geolocation" in navigator) {
    // Obtener la ubicación del usuario
    navigator.geolocation.getCurrentPosition(function(position) {
      // Obtener las coordenadas
      var latitude = position.coords.latitude;
      var longitude = position.coords.longitude;
      
      // Crear el enlace para compartir la ubicación
      var shareLink = "https://www.google.com/maps?q=" + latitude + "," + longitude;
      
      // Crear un elemento de tipo input oculto para almacenar el enlace
      var tempInput = document.createElement("input");
      tempInput.setAttribute("type", "text");
      tempInput.setAttribute("value", shareLink);
      document.body.appendChild(tempInput);
      
      // Seleccionar el contenido del input
      tempInput.select();
      
      // Copiar el contenido seleccionado al portapapeles
      document.execCommand("copy");
      
      // Eliminar el input temporal
      document.body.removeChild(tempInput);
      
      // Informar al usuario que el enlace ha sido copiado
      alert("El enlace de tu ubicación ha sido copiado al portapapeles.");
    });
  } else {
    // Si el navegador no soporta la geolocalización, mostrar un mensaje de error
    alert("Tu navegador no soporta la geolocalización.");
  }
});



//  --------------- FUNCIONALIDAD 8: ALTERNAR MODO CLARO Y MODO OSCURO  ---------------

const modeToggleBtn = document.getElementById('modeToggle');
const menu = document.getElementById('menu');
const share = document.getElementById('shareButton');
const github = document.getElementById('github');
const home = document.getElementById('home');
const work = document.getElementById('work');
const zoomInButton = document.querySelector('.leaflet-control-zoom-in');
const zoomOutButton = document.querySelector('.leaflet-control-zoom-out');

let isDarkMode = false;

modeToggleBtn.addEventListener('click', function() {
  if (isDarkMode) { 
    // Cambiar a light mode
    isDarkMode = false;
    // Modificar apariencia de menu
    menu.style.backgroundColor = '#fefefe';
    menu.style.color = 'black';
    // Modificar modeToggle
    modeToggleBtn.style.backgroundColor = '#fefefe';
    modeToggleBtn.style.color = 'black';
    modeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brilliance" viewBox="0 0 16 16">
    <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16M1 8a7 7 0 0 0 7 7 3.5 3.5 0 1 0 0-7 3.5 3.5 0 1 1 0-7 7 7 0 0 0-7 7"/>
  </svg>`;
    // Modificar apariencia de share
    share.style.backgroundColor = '#fefefe';
    share.style.color = 'black';
    // Modificar apariencia de github
    github.style.backgroundColor = '#fefefe';
    github.style.color = 'black';
    // Modificar apariencia de home
    home.style.backgroundColor = '#fefefe';
    home.style.color = 'black';
    // Modificar apariencia de work
    work.style.backgroundColor = '#fefefe';
    work.style.color = 'black';

    // Modificar apariencia de botones zoom
    zoomInButton.style.backgroundColor = '#fefefe'; // Cambiar el color de fondo del botón de zoom in a azul
    zoomInButton.style.color = 'black'; // Cambiar el color del texto del botón de zoom in a blanco
    zoomOutButton.style.backgroundColor = '#fefefe'; // Cambiar el color de fondo del botón de zoom out a rojo
    zoomOutButton.style.color = 'black'; // Cambiar el color del texto del botón de zoom out a blanco

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
  } else {
    // Cambiar a dark mode
    isDarkMode = true;
    // Modificar apariencia de menu
    menu.style.backgroundColor = '#272829';
    menu.style.color = '#fefefe';
    // Modificar modeToggle
    modeToggleBtn.style.backgroundColor = '#272829';
    modeToggleBtn.style.color = '#fefefe';
    modeToggleBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-brilliance" viewBox="0 0 16 16">
    <path d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16M1 8a7 7 0 0 0 7 7 3.5 3.5 0 1 0 0-7 3.5 3.5 0 1 1 0-7 7 7 0 0 0-7 7"/>
    </svg> `; 
    // Modificar apariencia de share
    share.style.backgroundColor = '#272829';
    share.style.color = '#fefefe';
    // Modificar apariencia de github
    github.style.backgroundColor = '#272829';
    github.style.color = '#fefefe';
    // Modificar apariencia de home
    home.style.backgroundColor = '#272829';
    home.style.color = '#fefefe';
    // Modificar apariencia de work
    work.style.backgroundColor = '#272829';
    work.style.color = '#fefefe';
    // Modificar apariencia de botones zoom
    zoomInButton.style.backgroundColor = '#272829'; // Cambiar el color de fondo del botón de zoom in a azul
    zoomInButton.style.color = '#fefefe'; // Cambiar el color del texto del botón de zoom in a blanco
    zoomOutButton.style.backgroundColor = '#272829'; // Cambiar el color de fondo del botón de zoom out a rojo
    zoomOutButton.style.color = '#fefefe'; // Cambiar el color del texto del botón de zoom out a blanco
    
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.stadiamaps.com/">Stadia Maps</a>'
    }).addTo(map);
  }
});



//  --------------- FUNCIONALIDAD 9. MENUS DE FAVORITOS y OPCIONES  ---------------


var openfav = document.getElementById('openfav');
var favVisible = true;

// Agregar un event listener para el clic en el div de alternancia
openfav.addEventListener('click', function() {
    // Si los elementos están visibles se ocultan; de lo contrario, se muestran
    if (favVisible) {
        work.style.visibility = 'hidden';
        home.style.visibility = 'hidden';
        favVisible = false;
    } else {
        work.style.visibility = 'visible'; 
        home.style.visibility = 'visible';
        favVisible = true;
    }
});


var openop = document.getElementById('openop');
var opcionesVisible = true;

// Agregar un event listener para el clic en el div de alternancia
openop.addEventListener('click', function() {
    // Si los elementos están visibles se ocultan; de lo contrario, se muestran
    if (opcionesVisible) {
        modeToggleBtn.style.visibility = 'hidden';
        share.style.visibility = 'hidden';
        github.style.visibility = 'hidden'; 
        opcionesVisible = false;
    } else {
        modeToggleBtn.style.visibility = 'visible'; 
        share.style.visibility = 'visible'; 
        github.style.visibility = 'visible'; 
        opcionesVisible = true;
    }
});



//  --------------- FUNCIONALIDAD 10. GUARDAR LOCALIZACIONES EN FAVORITOS  ---------------

// Función para guardar la ubicación seleccionada como lugar de trabajo
function saveWorkLocation(lat, lng) {
    // Actualizar la variable workLocation con las coordenadas de la ubicación seleccionada
    workLocation = { lat: lat, lng: lng };;
    alert("Se ha guardado el destino Trabajo")
};

document.getElementById('work').addEventListener('click', function() {
  // Verificar si hay un destino seleccionado
  if (workLocation) {
    // Establecer el destino como lugar de trabajo
    setDestination(workLocation);
    // Obtener la dirección del destino seleccionado con la API de geocodificación inversa de OpenStreetMap Nominatim
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${workLocation.lat}&lon=${workLocation.lng}&format=json`)
    .then(response => response.json())
    .then(data => {
      const address = data.display_name;
      document.getElementById('destination').textContent = "Dirección de destino: " + address;
    })
    .catch(error => console.error('Error al obtener la dirección del destino:', error));
  } 
  else {
    alert('Primero debe seleccionar su trabajo en el mapa.');
  }
});

// Función para guardar la ubicación seleccionada como lugar de trabajo
function saveHomeLocation(lat, lng) {
  // Actualizar la variable workLocation con las coordenadas de la ubicación seleccionada
  homeLocation = { lat: lat, lng: lng };;
  alert("Se ha guardado el destino Hogar")
};

document.getElementById('home').addEventListener('click', function() {
// Verificar si hay un destino seleccionado
if (homeLocation) {
  // Establecer el destino como lugar de trabajo
  setDestination(homeLocation);
  // Obtener la dirección del destino seleccionado con la API de geocodificación inversa de OpenStreetMap Nominatim
  fetch(`https://nominatim.openstreetmap.org/reverse?lat=${homeLocation.lat}&lon=${homeLocation.lng}&format=json`)
  .then(response => response.json())
  .then(data => {
    const address = data.display_name;
    document.getElementById('destination').textContent = "Dirección de destino: " + address;
  })
  .catch(error => console.error('Error al obtener la dirección del destino:', error));
} 
else {
  alert('Primero debe seleccionar su hogar en el mapa.');
}
});

