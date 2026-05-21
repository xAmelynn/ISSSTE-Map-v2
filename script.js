// ======================
// CREAR MAPA
// ======================

const map = L.map('map', {
  zoomControl: false
}).setView([23.6345, -102.5528], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap'
}).addTo(map);

L.control.scale().addTo(map);

// ======================
// CLUSTER
// ======================

const clusters = L.markerClusterGroup({
  chunkedLoading: true,

  iconCreateFunction(cluster) {
    const total = cluster.getChildCount();

    let claseTamano = 'cluster-pequeno';

    if (total >= 100) {
      claseTamano = 'cluster-grande';
    } else if (total >= 30) {
      claseTamano = 'cluster-mediano';
    }

    return L.divIcon({
      html: `
        <div class="cluster-custom ${claseTamano}">
          <span>${total}</span>
        </div>
      `,
      className: '',
      iconSize: [48, 48]
    });
  }
});

map.addLayer(clusters);

// ======================
// REFERENCIAS DOM
// ======================

const panel = document.getElementById('panelInfo');

const panelNombre = document.getElementById('panelNombre');
const panelClues = document.getElementById('panelClues');
const panelTipo = document.getElementById('panelTipo');
const panelNivel = document.getElementById('panelNivel');
const panelEstatus = document.getElementById('panelEstatus');
const panelUbicacion = document.getElementById('panelUbicacion');
const panelDireccion = document.getElementById('panelDireccion');
const panelRuta = document.getElementById('panelRuta');
const panelIconoNivel = document.getElementById('panelIconoNivel');
const panelTipoBadge = document.getElementById('panelTipoBadge');
const panelNivelTexto = document.getElementById('panelNivelTexto');
const panelDerechohabientes = document.getElementById('panelDerechohabientes');
const btnCopiarDireccion = document.getElementById('btnCopiarDireccion');
const btnCopiarDireccionTexto = document.getElementById('btnCopiarDireccionTexto');

const cerrarPanelBtn = document.getElementById('cerrarPanel');

const btnUbicacion = document.getElementById('btnUbicacion');
const btnVista = document.getElementById('btnVista');

const btnNearestToggle = document.getElementById('btnNearestToggle');
const btnUnidadCercanaHeader = document.getElementById('btnUnidadCercana');
const nearestMenu = document.getElementById('nearestMenu');

// Filtros
const filtroEntidad = document.getElementById('filtroEntidad');
const filtroMunicipio = document.getElementById('filtroMunicipio');
const filtroTipo = document.getElementById('filtroTipo');
const filtroNivel = document.getElementById('filtroNivel');
const busqueda = document.getElementById('busqueda');
const btnLimpiar = document.getElementById('btnLimpiar');

const contadorResultados = document.getElementById('contadorResultados');
const contadorTexto = document.getElementById('contadorTexto');
const mensajeVacio = document.getElementById('mensajeVacio');
const btnRestablecer = document.getElementById('btnRestablecer');
// ======================
// VARIABLES
// ======================

let datosGeojson = null;
let boundsIniciales = null;
let capaActual = null;
let ubicacionUsuario = null;
let marcadorUnidadCercana = null;
let marcadorUbicacionUsuario = null;
let temporizadorBusqueda = null;
let derechohabientesPorId = new Map();
let derechohabientesPorClave = new Map();
let derechohabientesPorClues = new Map();
let serviciosPorId = new Map();
let serviciosPorClave = new Map();
let serviciosPorClues = new Map();

// ======================
// CERRAR PANEL
// ======================

cerrarPanelBtn.addEventListener('click', () => {
  panel.classList.remove('activo');
});

document
  .getElementById('zoomInBtn')
  .addEventListener('click', () => {

    map.zoomIn();

  });

document
  .getElementById('zoomOutBtn')
  .addEventListener('click', () => {

    map.zoomOut();

  });

// ======================
// HELPERS
// ======================

function normalizarTexto(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function llenarSelect(select, valores, textoDefault) {
  select.innerHTML = `<option value="TODOS">${textoDefault}</option>`;

  [...valores]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'es'))
    .forEach(valor => {
      const option = document.createElement('option');
      option.value = valor;
      option.textContent = valor;
      select.appendChild(option);
    });
}


function obtenerIconoNivel(nivel) {
  const texto = normalizarTexto(nivel);

  if (texto.includes('primer') || texto.includes('1')) {
    return 'assets/icons/unidad-primer-nivel.svg';
  }

  if (texto.includes('segundo') || texto.includes('2')) {
    return 'assets/icons/unidad-segundo-nivel.svg';
  }

  if (texto.includes('tercer') || texto.includes('3')) {
    return 'assets/icons/unidad-tercer-nivel.svg';
  }

  return 'assets/icons/unidad-primer-nivel.svg';
}

function obtenerColorTipo(siglaTipo) {
  const colores = {
    CAF: '#f7c405',
    CE: '#ff9b4d',
    CEQ: '#bb4a05',
    CH: '#d5385c',
    CMCT: '#457692',
    CMF: '#5ca563',
    CMFE: '#ff704e',
    CMFEQ: '#780002',
    CMN: '#b39717',
    HG: '#fa463f',
    HR: '#ff6b5d',
    UMF: '#3c8254',
    default: '#777777'
  };

  return colores[siglaTipo] || colores.default;
}

function obtenerClaseEstatus(estatus) {
  const texto = normalizarTexto(estatus);

  if (texto.includes('operacion')) return 'estatus-operacion';
  if (texto.includes('proceso') || texto.includes('construccion')) return 'estatus-proceso';
  if (texto.includes('fuera') || texto.includes('baja') || texto.includes('cerrada')) return 'estatus-inactivo';

  return 'estatus-desconocido';
}

async function cargarSvgInline(ruta, contenedor, clase = 'svg-icon-inline') {
  try {
    if (!ruta || !contenedor) return;

    const response = await fetch(ruta);

    if (!response.ok) {
      throw new Error('No se pudo cargar el SVG');
    }

    const svgTexto = await response.text();

    contenedor.innerHTML = svgTexto;

    const svg = contenedor.querySelector('svg');

    if (svg) {
      svg.classList.add(clase);
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.display = 'block';
      svg.style.color = 'currentColor';
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    }
  } catch (error) {
    console.error('No se pudo cargar el SVG:', ruta, error);
    contenedor.innerHTML = '';
  }
}

function inicializarIconosSvgInline() {
  document.querySelectorAll('[data-src].svg-inline-icon').forEach(elemento => {
    cargarSvgInline(elemento.dataset.src, elemento);
  });
}


function esPantallaPequena() {
  return window.matchMedia('(max-width: 700px)').matches;
}

function obtenerPaddingMapa() {
  return esPantallaPequena()
    ? [18, 18]
    : [30, 30];
}

function ajustarMapaDespuesDeCambios() {
  window.requestAnimationFrame(() => {
    map.invalidateSize();
  });
}

// ======================
// FUNCIÓN PANEL
// ======================

async function mostrarPanel(props) {
  panelNombre.textContent =
    props.nombre_corto ||
    props.nombre_oficial ||
    props.nombre_unidad ||
    'Sin nombre';

  panelClues.textContent = props.clues || '-';

  const siglaTipo = props.sigla_tipo || props.tipo_unidad || 'default';
  const colorTipo = obtenerColorTipo(siglaTipo);
  const iconoNivel = obtenerIconoNivel(props.nivel_atencion);

  panelTipoBadge.textContent = props.sigla_tipo || '-';
  panelTipoBadge.style.background = colorTipo;
  panelTipoBadge.style.color = '#ffffff';

  panelTipo.textContent =
    props.tipo_unidad ||
    props.sigla_tipo ||
    '-';
  panelTipo.style.background = 'transparent';
  panelTipo.style.color = '#111111';

  panelNivel.textContent = props.nivel_atencion || '-';
  panelNivelTexto.textContent = props.nivel_atencion || '-';

  const derechohabientes = obtenerDerechohabientesUnidad(props);
  panelDerechohabientes.textContent = formatearDerechohabientes(derechohabientes);

  panelEstatus.textContent = props.estatus_operativo || '-';
  panelEstatus.className = 'panel-badge';
  panelEstatus.classList.add(obtenerClaseEstatus(props.estatus_operativo));

  await cargarSvgInline(iconoNivel, panelIconoNivel, 'svg-nivel-inline');

  panelUbicacion.textContent =
    `${props.municipio || '-'}, ${props.entidad || '-'}`;

  panelDireccion.textContent =
    props.direccion_completa || '-';

  if (props.latitud && props.longitud) {
    panelRuta.href =
      `https://www.google.com/maps?q=${props.latitud},${props.longitud}`;

    panelRuta.style.display = 'inline-flex';
  } else {
    panelRuta.style.display = 'none';
  }

  btnCopiarDireccion.onclick = async () => {
    const direccion = props.direccion_completa || '';

    if (!direccion) return;

    await navigator.clipboard.writeText(direccion);

    if (btnCopiarDireccionTexto) {
      btnCopiarDireccionTexto.textContent = 'Dirección copiada';
    }

    setTimeout(() => {
      if (btnCopiarDireccionTexto) {
        btnCopiarDireccionTexto.textContent = 'Copiar dirección';
      }
    }, 1400);
  };

  const servicios = obtenerServiciosDisponibles(
    obtenerServiciosUnidad(props)
  );

  renderServicios(servicios);

  panel.classList.add('activo');
}

// ======================
// PINES
// ======================

function obtenerIconoPorTipo(siglaTipo) {
  const sigla = siglaTipo || 'default';

  return L.icon({
    iconUrl: `assets/pines/${sigla}.svg`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -38]
  });
}

// ======================
// POBLAR FILTROS
// ======================

function poblarFiltros() {
  const entidades = new Set();
  const tipos = new Set();
  const niveles = new Set();

  datosGeojson.features.forEach(feature => {
    const props = feature.properties || {};

    entidades.add(props.entidad);
    tipos.add(props.sigla_tipo || props.tipo_unidad);
    niveles.add(props.nivel_atencion);
  });

  llenarSelect(filtroEntidad, entidades, 'Todas las entidades');
  llenarSelect(filtroTipo, tipos, 'Todos los tipos');
  llenarSelect(filtroNivel, niveles, 'Todos los niveles');

  poblarMunicipios();
}

function poblarMunicipios() {
  const entidadSeleccionada = filtroEntidad.value;
  const municipios = new Set();

  datosGeojson.features.forEach(feature => {
    const props = feature.properties || {};

    if (
      entidadSeleccionada === 'TODOS' ||
      props.entidad === entidadSeleccionada
    ) {
      municipios.add(props.municipio);
    }
  });

  llenarSelect(filtroMunicipio, municipios, 'Todos los municipios');
}

// ======================
// CREAR CAPA FILTRADA
// ======================

function aplicarFiltros(opciones = {}) {
  const { ajustarVista = true } = opciones;

  clusters.clearLayers();

  if (capaActual) {
    capaActual.clearLayers();
  }

  const entidadSeleccionada = filtroEntidad.value;
  const municipioSeleccionado = filtroMunicipio.value;
  const tipoSeleccionado = filtroTipo.value;
  const nivelSeleccionado = filtroNivel.value;
  const textoBusqueda = normalizarTexto(busqueda.value);

  capaActual = L.geoJSON(datosGeojson, {
    filter(feature) {
      const props = feature.properties || {};

      const tipoUnidad = props.sigla_tipo || props.tipo_unidad || '';

      const pasaEntidad =
        entidadSeleccionada === 'TODOS' ||
        props.entidad === entidadSeleccionada;

      const pasaMunicipio =
        municipioSeleccionado === 'TODOS' ||
        props.municipio === municipioSeleccionado;

      const pasaTipo =
        tipoSeleccionado === 'TODOS' ||
        tipoUnidad === tipoSeleccionado;

      const pasaNivel =
        nivelSeleccionado === 'TODOS' ||
        props.nivel_atencion === nivelSeleccionado;

      const textoCampos = normalizarTexto([
        props.nombre_corto,
        props.nombre_oficial,
        props.nombre_unidad,
        props.clues,
        props.clave_presupuestal,
        props.tipo_unidad,
        props.sigla_tipo,
        props.nivel_atencion,
        props.entidad,
        props.municipio,
        props.direccion_completa
      ].join(' '));

      const pasaBusqueda =
        !textoBusqueda ||
        textoCampos.includes(textoBusqueda);

      return (
        pasaEntidad &&
        pasaMunicipio &&
        pasaTipo &&
        pasaNivel &&
        pasaBusqueda
      );
    },

    pointToLayer(feature, latlng) {
      const props = feature.properties || {};
      const siglaTipo = props.sigla_tipo || 'default';

      const marker = L.marker(latlng, {
        icon: obtenerIconoPorTipo(siglaTipo)
      });

      marker.on('click', () => {
        mostrarPanel(props);
      });

      return marker;
    }
  });

  clusters.addLayer(capaActual);

  const totalResultados = capaActual.getLayers().length;

  const textoContador =
    `${totalResultados.toLocaleString('es-MX')} unidad${totalResultados === 1 ? '' : 'es'}`;

  contadorTexto.textContent = textoContador;

  mensajeVacio.hidden = totalResultados !== 0;

  const bounds = capaActual.getBounds();

  if (bounds.isValid()) {
    boundsIniciales = bounds;

    if (ajustarVista) {
      map.fitBounds(bounds, {
        padding: obtenerPaddingMapa(),
        maxZoom: esPantallaPequena() ? 13 : 15
      });
    }
  }
}

// ======================
// LIMPIAR FILTROS
// ======================

function limpiarFiltros() {
  filtroEntidad.value = 'TODOS';
  poblarMunicipios();
  filtroMunicipio.value = 'TODOS';
  filtroTipo.value = 'TODOS';
  filtroNivel.value = 'TODOS';
  busqueda.value = '';

  panel.classList.remove('activo');

  aplicarFiltros();
}

// ======================
// UNIDAD CERCANA
// ======================

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function obtenerUbicacionUsuario(callback) {
  if (ubicacionUsuario) {
    callback(ubicacionUsuario);
    return;
  }

  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    posicion => {
      ubicacionUsuario = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude
      };

      callback(ubicacionUsuario);
    },
    () => {
      alert('No se pudo obtener tu ubicación');
    }
  );
}

function buscarUnidadMasCercana(nivelBuscado) {
  obtenerUbicacionUsuario(posicion => {
    let unidadMasCercana = null;
    let distanciaMinima = Infinity;

    datosGeojson.features.forEach(feature => {
      const props = feature.properties || {};

      const siglaTipo = normalizarTexto(props.sigla_tipo || props.tipo_unidad);

      if (siglaTipo === 'cmct') return;
      if (props.nivel_atencion !== nivelBuscado) return;
      if (!props.latitud || !props.longitud) return;

      const distancia = calcularDistanciaKm(
        posicion.lat,
        posicion.lng,
        Number(props.latitud),
        Number(props.longitud)
      );

      if (distancia < distanciaMinima) {
        distanciaMinima = distancia;
        unidadMasCercana = feature;
      }
    });

    if (!unidadMasCercana) {
      alert(`No se encontró ninguna unidad de ${nivelBuscado}`);
      return;
    }

    const props = unidadMasCercana.properties;
    const lat = Number(props.latitud);
    const lng = Number(props.longitud);

    map.setView([lat, lng], 14);

    if (marcadorUnidadCercana) {
      map.removeLayer(marcadorUnidadCercana);
    }

    marcadorUnidadCercana = L.circleMarker([lat, lng], {
      radius: 16,
      color: '#c9a14a',
      weight: 4,
      fillColor: '#7a1e2c',
      fillOpacity: 0.35
    }).addTo(map);

    mostrarPanel(props);

    alert(
      `La unidad de ${nivelBuscado} más cercana es:\n\n` +
      `${props.nombre_corto || props.nombre_oficial}\n` +
      `Distancia aproximada: ${distanciaMinima.toFixed(2)} km`
    );

    nearestMenu.hidden = true;
  });
}

// ======================
// EVENTOS DE FILTROS
// ======================

filtroEntidad.addEventListener('change', () => {
  poblarMunicipios();
  filtroMunicipio.value = 'TODOS';
  aplicarFiltros();
});

filtroMunicipio.addEventListener('change', aplicarFiltros);
filtroTipo.addEventListener('change', aplicarFiltros);
filtroNivel.addEventListener('change', aplicarFiltros);
busqueda.addEventListener('input', () => {
  clearTimeout(temporizadorBusqueda);

  temporizadorBusqueda = setTimeout(() => {
    aplicarFiltros({ ajustarVista: false });
  }, 220);
});
btnLimpiar.addEventListener('click', limpiarFiltros);
btnRestablecer.addEventListener('click', limpiarFiltros);

btnVista.addEventListener('click', () => {

  if (boundsIniciales && boundsIniciales.isValid()) {

    map.fitBounds(boundsIniciales, {
      padding: obtenerPaddingMapa()
    });

  }

});

btnUbicacion.addEventListener('click', () => {

  if (!navigator.geolocation) {
    alert('Tu navegador no soporta geolocalización');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    posicion => {

      const lat = posicion.coords.latitude;
      const lng = posicion.coords.longitude;

      map.setView([lat, lng], 13);

      ubicacionUsuario = { lat, lng };

      if (marcadorUbicacionUsuario) {
        map.removeLayer(marcadorUbicacionUsuario);
      }

      marcadorUbicacionUsuario = L.circleMarker([lat, lng], {
        radius: 10,
        fillColor: '#2b7cff',
        color: '#ffffff',
        weight: 3,
        fillOpacity: 1
      }).addTo(map);

    },

    () => {
      alert('No se pudo obtener tu ubicación');
    }

  );

});

function alternarMenuUnidadCercana() {
  nearestMenu.hidden = !nearestMenu.hidden;
}

btnNearestToggle.addEventListener('click', alternarMenuUnidadCercana);

if (btnUnidadCercanaHeader) {
  btnUnidadCercanaHeader.addEventListener('click', alternarMenuUnidadCercana);
}

document.addEventListener('click', event => {
  const clickDentroMenu = nearestMenu.contains(event.target);
  const clickEnBoton =
    btnNearestToggle.contains(event.target) ||
    (btnUnidadCercanaHeader && btnUnidadCercanaHeader.contains(event.target));

  if (!clickDentroMenu && !clickEnBoton) {
    nearestMenu.hidden = true;
  }
});

window.addEventListener('resize', ajustarMapaDespuesDeCambios);

nearestMenu.querySelectorAll('button').forEach(button => {
  button.addEventListener('click', () => {
    buscarUnidadMasCercana(button.dataset.nivel);
  });
});

// ======================
// LECTURA CSV DERECHOHABIENTES 
// ======================

function parseCSV(texto) {
  const filas = [];
  let fila = [];
  let celda = '';
  let dentroDeComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    const siguiente = texto[i + 1];

    if (caracter === '"' && dentroDeComillas && siguiente === '"') {
      celda += '"';
      i++;
    } else if (caracter === '"') {
      dentroDeComillas = !dentroDeComillas;
    } else if (caracter === ',' && !dentroDeComillas) {
      fila.push(celda.trim());
      celda = '';
    } else if ((caracter === '\n' || caracter === '\r') && !dentroDeComillas) {
      if (caracter === '\r' && siguiente === '\n') i++;

      fila.push(celda.trim());
      celda = '';

      if (fila.some(valor => valor !== '')) {
        filas.push(fila);
      }

      fila = [];
    } else {
      celda += caracter;
    }
  }

  if (celda || fila.length) {
    fila.push(celda.trim());
    if (fila.some(valor => valor !== '')) {
      filas.push(fila);
    }
  }

  const encabezados = filas.shift().map(h => h.trim());

  return filas.map(valores => {
    const obj = {};

    encabezados.forEach((h, i) => {
      obj[h] = valores[i] || '';
    });

    return obj;
  });
}

// ======================
// SERVICIOS
// ======================

async function cargarServicios() {
  const response = await fetch('data/servicios.csv');

  if (!response.ok) {
    throw new Error('No se pudo cargar servicios.csv');
  }

  const texto = await response.text();
  const filas = parseCSV(texto);

  filas.forEach(row => {

    if (row.id_unidad) {
      serviciosPorId.set(String(row.id_unidad).trim(), row);
    }

    if (row.clave_presupuestal) {
      serviciosPorClave.set(
        String(row.clave_presupuestal).trim(),
        row
      );
    }

    if (
      row.clues &&
      normalizarTexto(row.clues) !== 'pendiente'
    ) {
      serviciosPorClues.set(
        String(row.clues).trim(),
        row
      );
    }

  });

  console.log('Servicios cargados:', filas.length);
}

function obtenerServiciosUnidad(props) {

  const id =
    props.id_unidad
      ? String(props.id_unidad).trim()
      : '';

  const clave =
    props.clave_presupuestal
      ? String(props.clave_presupuestal).trim()
      : '';

  const clues =
    props.clues
      ? String(props.clues).trim()
      : '';

  if (id && serviciosPorId.has(id)) {
    return serviciosPorId.get(id);
  }

  if (clave && serviciosPorClave.has(clave)) {
    return serviciosPorClave.get(clave);
  }

  if (
    clues &&
    normalizarTexto(clues) !== 'pendiente' &&
    serviciosPorClues.has(clues)
  ) {
    return serviciosPorClues.get(clues);
  }

  return null;
}

function servicioDisponible(valor) {
  const texto = normalizarTexto(valor);

  return (
    texto === 'si' ||
    texto === 'sí' ||
    texto === '1' ||
    texto === 'true'
  );
}

function nombreServicio(campo) {
  return campo
    .replace('servicio_', '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

function iconoServicio(campo) {
  const nombreArchivo = campo
    .replace('servicio_', 'servicio-')
    .replaceAll('_', '-');

  return `assets/icons/${nombreArchivo}.svg`;
}

function obtenerServiciosDisponibles(row) {

  if (!row) return [];

  return Object.entries(row)

    .filter(([campo, valor]) => {
      return (
        campo.startsWith('servicio_') &&
        servicioDisponible(valor)
      );
    })

    .map(([campo]) => ({
      campo,
      nombre: nombreServicio(campo),
      icono: iconoServicio(campo)
    }));
}

function renderServicios(servicios) {

  const contenedor =
    document.getElementById('panelServiciosIconos');

  const btnVerMas =
    document.querySelector('.btn-ver-mas');

  contenedor.innerHTML = '';

  if (!servicios.length) {

    contenedor.innerHTML = `
      <span class="servicio-placeholder">
        Sin servicios registrados
      </span>
    `;

    btnVerMas.hidden = true;
    return;
  }

  let expandido = false;

  function pintar() {

    contenedor.innerHTML = '';

    const visibles = expandido
      ? servicios
      : servicios.slice(0, 5);

    visibles.forEach(servicio => {

      const item = document.createElement('button');

      item.className = 'servicio-item';
      item.type = 'button';

      item.title = servicio.nombre;

      item.setAttribute(
        'aria-label',
        servicio.nombre
      );

      item.innerHTML = `
        <span
          class="servicio-icono svg-inline-icon"
          data-src="${servicio.icono}"
          aria-hidden="true">
        </span>
      `;

      item.addEventListener('click', () => {
        alert(servicio.nombre);
      });

      contenedor.appendChild(item);

      const icono =
        item.querySelector('.svg-inline-icon');

      cargarSvgInline(icono.dataset.src, icono);
    });

    btnVerMas.hidden =
      servicios.length <= 5;

    btnVerMas.querySelector('span').textContent =
      expandido
        ? 'Ver menos'
        : 'Ver más';

    const iconoFlecha =
      btnVerMas.querySelector('.svg-inline-icon');

    iconoFlecha.dataset.src =
      expandido
        ? 'assets/icons/flecha-arriba.svg'
        : 'assets/icons/flecha-abajo.svg';

    cargarSvgInline(iconoFlecha.dataset.src, iconoFlecha);
  }

  btnVerMas.onclick = () => {
    expandido = !expandido;
    pintar();
  };

  pintar();
}

function limpiarLlave(valor) {
  return String(valor || '').trim();
}

async function cargarDerechohabientes() {
  const response = await fetch('data/derechohabientes.csv');

  if (!response.ok) {
    throw new Error('No se pudo cargar derechohabientes.csv');
  }

  const texto = await response.text();
  const filas = parseCSV(texto);

  derechohabientesPorId.clear();
  derechohabientesPorClave.clear();
  derechohabientesPorClues.clear();

  filas.forEach(row => {
    const id = limpiarLlave(row.id_unidad);
    const clave = limpiarLlave(row.clave_presupuestal);
    const clues = limpiarLlave(row.clues);

    if (id) {
      derechohabientesPorId.set(id, row);
    }

    if (clave) {
      derechohabientesPorClave.set(clave, row);
    }

    if (clues && normalizarTexto(clues) !== 'pendiente') {
      derechohabientesPorClues.set(clues, row);
    }
  });

  console.log('Derechohabientes cargados:', filas.length);
}

function obtenerDerechohabientesUnidad(props) {
  const id = limpiarLlave(props.id_unidad);
  const clave = limpiarLlave(props.clave_presupuestal);
  const clues = limpiarLlave(props.clues);

  if (id && derechohabientesPorId.has(id)) {
    return derechohabientesPorId.get(id);
  }

  if (clave && derechohabientesPorClave.has(clave)) {
    return derechohabientesPorClave.get(clave);
  }

  if (clues && normalizarTexto(clues) !== 'pendiente' && derechohabientesPorClues.has(clues)) {
    return derechohabientesPorClues.get(clues);
  }

  return null;
}

function formatearNumero(valor) {
  if (valor === null || valor === undefined) return '';

  const texto = String(valor).trim();

  if (!texto || normalizarTexto(texto) === 'no aplica') return '';

  const limpio = texto
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();

  const numero = Number(limpio);

  if (!Number.isFinite(numero) || numero === 0) return '';

  return numero.toLocaleString('es-MX');
}

function formatearDerechohabientes(dh) {
  if (!dh) return '-';

  const niveles = [
    ['1er nivel', dh.derechohabientes_primer_nivel],
    ['2do nivel', dh.derechohabientes_segundo_nivel],
    ['3er nivel', dh.derechohabientes_tercer_nivel]
  ];

  const partes = niveles
    .map(([nivel, valor]) => {
      const numero = formatearNumero(valor);
      return numero ? `${nivel}: ${numero}` : '';
    })
    .filter(Boolean);

  return partes.length ? partes.join('\n') : '-';
}

// ======================
// CARGAR GEOJSON
// ======================

async function cargarGeojson() {
  try {
    const response = await fetch('data/unidades.geojson');

    if (!response.ok) {
      throw new Error('No se pudo cargar el GeoJSON');
    }

    const data = await response.json();

    datosGeojson = data;

    poblarFiltros();
    aplicarFiltros();

    console.log('GeoJSON cargado correctamente');
  } catch (error) {
    console.error(error);
    alert('Error cargando unidades.geojson');
  }
}

// ======================
// INICIAR
// ======================

async function iniciarMapa() {

  try {

    inicializarIconosSvgInline();

    await Promise.all([
      cargarDerechohabientes().catch(error => {
        console.warn('No se cargaron derechohabientes:', error);
      }),
      cargarServicios().catch(error => {
        console.warn('No se cargaron servicios:', error);
      })
    ]);

    await cargarGeojson();

    ajustarMapaDespuesDeCambios();

  } catch (error) {

    console.error(error);

    alert('Error cargando datos del mapa');

  }

}

iniciarMapa();