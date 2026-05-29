// =========================================================
// MAPA ISSSTE - SCRIPT PRINCIPAL
// =========================================================
// Secciones:
// 1. Configuración del mapa
// 2. Referencias DOM
// 3. Estado global y almacenes de datos
// 4. Utilidades generales
// 5. Carga de datos CSV / GeoJSON
// 6. Filtros y renderizado de marcadores
// 7. Panel modo usuario
// 8. Panel modo análisis
// 9. Herramientas del mapa
// 10. Eventos e inicialización
// =========================================================

// =========================================================
// 1. CONFIGURACIÓN DEL MAPA
// =========================================================

const map = L.map("map", {
  zoomControl: false,
}).setView([23.6345, -102.5528], 5);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap",
}).addTo(map);

L.control.scale().addTo(map);

const clusters = L.markerClusterGroup({
  chunkedLoading: true,

  iconCreateFunction(cluster) {
    const total = cluster.getChildCount();
    let claseTamano = "cluster-pequeno";

    if (total >= 100) {
      claseTamano = "cluster-grande";
    } else if (total >= 30) {
      claseTamano = "cluster-mediano";
    }

    return L.divIcon({
      html: `
        <div class="cluster-custom ${claseTamano}">
          <span>${total}</span>
        </div>
      `,
      className: "",
      iconSize: [48, 48],
    });
  },
});

map.addLayer(clusters);

// =========================================================
// 2. REFERENCIAS DOM
// =========================================================

const panel = document.getElementById("panelInfo");
const cerrarPanelBtn = document.getElementById("cerrarPanel");

const panelNombre = document.getElementById("panelNombre");
const panelClues = document.getElementById("panelClues");
const panelTipo = document.getElementById("panelTipo");
const panelNivel = document.getElementById("panelNivel");
const panelEstatus = document.getElementById("panelEstatus");
const panelUbicacion = document.getElementById("panelUbicacion");
const panelDireccion = document.getElementById("panelDireccion");
const panelRuta = document.getElementById("panelRuta");
const panelIconoNivel = document.getElementById("panelIconoNivel");
const panelTipoBadge = document.getElementById("panelTipoBadge");
const panelNivelTexto = document.getElementById("panelNivelTexto");
const btnCopiarDireccion = document.getElementById("btnCopiarDireccion");
const btnCopiarDireccionTexto = document.getElementById(
  "btnCopiarDireccionTexto",
);

const btnUbicacion = document.getElementById("btnUbicacion");
const btnVista = document.getElementById("btnVista");
const btnNearestToggle = document.getElementById("btnNearestToggle");
const nearestMenu = document.getElementById("nearestMenu");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");

const btnModoUsuario = document.getElementById("btnModoUsuario");
const btnModoAnalisis = document.getElementById("btnModoAnalisis");

const filtroEntidad = document.getElementById("filtroEntidad");
const filtroMunicipio = document.getElementById("filtroMunicipio");
const filtroTipo = document.getElementById("filtroTipo");
const filtroNivel = document.getElementById("filtroNivel");
const busqueda = document.getElementById("busqueda");
const btnLimpiar = document.getElementById("btnLimpiar");
const btnRestablecer = document.getElementById("btnRestablecer");
const contadorTexto = document.getElementById("contadorTexto");
const mensajeVacio = document.getElementById("mensajeVacio");

const panelAnalisisDer = document.getElementById("panelAnalisisDer");
const cerrarPanelAnalisis = document.getElementById("cerrarPanelAnalisis");
const selectorNivelDh = document.getElementById("selectorNivelDh");

const analisisNombreUnidad = document.getElementById("analisisNombreUnidad");
const analisisIconoNivel = document.getElementById("analisisIconoNivel");
const analisisTipo = document.getElementById("analisisTipo");
const analisisNivel = document.getElementById("analisisNivel");
const analisisEstatus = document.getElementById("analisisEstatus");
const analisisClues = document.getElementById("analisisClues");
const analisisClavePresupuestal = document.getElementById("analisisClavePresupuestal");
const analisisSubdelegacion = document.getElementById("analisisSubdelegacion")
const analisisSituacionJuridica = document.getElementById("analisisSituacionJuridica");
const analisisTipoUnidadTexto = document.getElementById("analisisTipoUnidadTexto");

const kpiDerechohabientes = document.getElementById("kpiDerechohabientes");
const kpiConsultorios = document.getElementById("kpiConsultorios");
const kpiMedicos = document.getElementById("kpiMedicos");
const kpiDhConsultorio = document.getElementById("kpiDhConsultorio");
const kpiDhMedico = document.getElementById("kpiDhMedico");
const kpiCamas = document.getElementById("kpiCamas");

const comparativaDhMedico = document.getElementById("comparativaDhMedico");
const comparativaDhConsultorio = document.getElementById("comparativaDhConsultorio");
const comparativaCamas = document.getElementById("comparativaCamas");

const tabResumen = document.getElementById("tabResumen");
const tabCapacidad = document.getElementById("tabCapacidad");
const tabPersonal = document.getElementById("tabPersonal");
const tabEquipo = document.getElementById("tabEquipo");
const tabCobertura = document.getElementById("tabCobertura");

const contenidoResumen = document.getElementById("contenidoResumen");
const contenidoCapacidad = document.getElementById("contenidoCapacidad");
const contenidoPersonal = document.getElementById("contenidoPersonal");
const contenidoEquipo = document.getElementById("contenidoEquipo");

const detalleCamasCensables = document.getElementById("detalleCamasCensables");
const detalleCamasTransito = document.getElementById("detalleCamasTransito");
const detalleConsultorios = document.getElementById("detalleConsultorios");
const detalleLaboratorios = document.getElementById("detalleLaboratorios");
const detalleSalas = document.getElementById("detalleSalas");
const detalleApoyoClinico = document.getElementById("detalleApoyoClinico");

const detallePersonalMedico = document.getElementById("detallePersonalMedico");
const detalleEnfermeria = document.getElementById("detalleEnfermeria");
const detalleParamedico = document.getElementById("detalleParamedico");
const detalleApoyoAdministrativo = document.getElementById(
  "detalleApoyoAdministrativo",
);

const detalleImagenologia = document.getElementById("detalleImagenologia");
const detalleUrgenciasEquipo = document.getElementById("detalleUrgenciasEquipo");
const detalleNeonatal = document.getElementById("detalleNeonatal");
const detalleTransporte = document.getElementById("detalleTransporte");
const detalleEspecializado = document.getElementById("detalleEspecializado");



// =========================================================
// 3. ESTADO GLOBAL Y ALMACENES DE DATOS
// =========================================================

let modoActual = "usuario";
let datosGeojson = null;
let boundsIniciales = null;
let capaActual = null;
let ubicacionUsuario = null;
let marcadorUnidadCercana = null;

const derechohabientesPorId = new Map();
const derechohabientesPorClave = new Map();
const derechohabientesPorClues = new Map();

const serviciosPorId = new Map();
const serviciosPorClave = new Map();
const serviciosPorClues = new Map();

const infraestructuraPorId = new Map();
const infraestructuraPorClave = new Map();
const infraestructuraPorClues = new Map();

const personalPorId = new Map();
const personalPorClave = new Map();
const personalPorClues = new Map();

const camasPorId = new Map();
const camasPorClave = new Map();
const camasPorClues = new Map();

const equipoPorId = new Map();
const equipoPorClave = new Map();
const equipoPorClues = new Map();

// =========================================================
// 4. UTILIDADES GENERALES
// =========================================================

// Diccionario para mostrar nombres amigables de los servicios sin renombrar columnas del CSV.
const NOMBRES_SERVICIOS = {
  servicio_medicina_general: "Medicina general o familiar",
  servicio_gineco_obstetria: "Gineco-obstetricia",
  servicio_gineco_obstetricia: "Gineco-obstetricia",
  servicio_pediatria: "Pediatría",
  servicio_geriatria: "Geriatría",
  servicio_oncologia: "Oncología",
  servicio_traumatologia_ortopedia: "Traumatología y ortopedia",
  servicio_traumatologia_y_ortopedia: "Traumatología y ortopedia",
  servicio_odontologia: "Odontología",
  servicio_urgencias: "Urgencias",
  servicio_hemodialisis: "Hemodiálisis",
  servicio_hemodinamia: "Hemodinamia",
  servicio_quimioterapia: "Quimioterapia",
  servicio_banco_sangre: "Banco de sangre",
  servicio_banco_leche: "Banco de leche",
  servicio_rayos_x: "Rayos X",
  servicio_quirofano: "Quirófano",
  servicio_farmacia: "Farmacia"
};

function normalizarTexto(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function limpiarLlave(valor) {
  return String(valor || "").trim();
}

function convertirNumero(valor) {
  if (valor === null || valor === undefined) return 0;

  const texto = String(valor).trim();
  if (!texto || normalizarTexto(texto) === "no aplica") return 0;

  const limpio = texto.replace(/,/g, "").replace(/\s/g, "");
  const numero = Number(limpio);

  return Number.isFinite(numero) ? numero : 0;
}

function formatearNumero(valor) {
  const numero = convertirNumero(valor);
  return numero > 0 ? numero.toLocaleString("es-MX") : "";
}

function mostrarNumero(valor) {
  const numero = convertirNumero(valor);
  return numero > 0 ? formatearNumero(numero) : "-";
}

function llenarSelect(select, valores, textoDefault) {
  select.innerHTML = `<option value="TODOS">${textoDefault}</option>`;

  [...valores]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"))
    .forEach((valor) => {
      const option = document.createElement("option");
      option.value = valor;
      option.textContent = valor;
      select.appendChild(option);
    });
}

function parseCSV(texto) {
  const filas = [];
  let fila = [];
  let celda = "";
  let dentroDeComillas = false;

  for (let i = 0; i < texto.length; i++) {
    const caracter = texto[i];
    const siguiente = texto[i + 1];

    if (caracter === '"' && dentroDeComillas && siguiente === '"') {
      celda += '"';
      i++;
    } else if (caracter === '"') {
      dentroDeComillas = !dentroDeComillas;
    } else if (caracter === "," && !dentroDeComillas) {
      fila.push(celda.trim());
      celda = "";
    } else if ((caracter === "\n" || caracter === "\r") && !dentroDeComillas) {
      if (caracter === "\r" && siguiente === "\n") i++;
      fila.push(celda.trim());
      celda = "";
      if (fila.some((valor) => valor !== "")) filas.push(fila);
      fila = [];
    } else {
      celda += caracter;
    }
  }

  if (celda || fila.length) {
    fila.push(celda.trim());
    if (fila.some((valor) => valor !== "")) filas.push(fila);
  }

  const encabezados = filas.shift()?.map((h) => h.trim()) || [];

  return filas.map((valores) => {
    const obj = {};
    encabezados.forEach((h, i) => {
      obj[h] = valores[i] || "";
    });
    return obj;
  });
}

async function cargarSvgInline(ruta, contenedor, clase = "svg-icon-inline") {
  try {
    if (!ruta || !contenedor) return;

    const response = await fetch(ruta);
    if (!response.ok) throw new Error("No se pudo cargar el SVG");

    contenedor.innerHTML = await response.text();
    const svg = contenedor.querySelector("svg");

    if (svg) {
      svg.classList.add(clase);
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("focusable", "false");
      svg.removeAttribute("width");
      svg.removeAttribute("height");
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.display = "block";
      svg.style.color = "currentColor";
      svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
    }
  } catch (error) {
    console.error("No se pudo cargar el SVG:", ruta, error);
    contenedor.innerHTML = "";
  }
}

function inicializarIconosSvgInline() {
  document
    .querySelectorAll("[data-src].svg-inline-icon")
    .forEach((elemento) => {
      cargarSvgInline(elemento.dataset.src, elemento);
    });
}

function obtenerIconoNivel(nivel) {
  const texto = normalizarTexto(nivel);

  if (texto.includes("primer") || texto.includes("1")) {
    return "assets/icons/unidad-primer-nivel.svg";
  }
  if (texto.includes("segundo") || texto.includes("2")) {
    return "assets/icons/unidad-segundo-nivel.svg";
  }
  if (texto.includes("tercer") || texto.includes("3")) {
    return "assets/icons/unidad-tercer-nivel.svg";
  }

  return "assets/icons/unidad-primer-nivel.svg";
}

function obtenerColorTipo(siglaTipo) {
  const colores = {
    CAF: "#f7c405",
    CE: "#ff9b4d",
    CEQ: "#bb4a05",
    CH: "#d5385c",
    CMCT: "#457692",
    CMF: "#5ca563",
    CMFE: "#ff704e",
    CMFEQ: "#780002",
    CMN: "#b39717",
    HG: "#fa463f",
    HR: "#ff6b5d",
    UMF: "#3c8254",
    default: "#777777",
  };

  return colores[siglaTipo] || colores.default;
}

function obtenerClaseEstatus(estatus) {
  const texto = normalizarTexto(estatus);

  if (texto.includes("operacion")) return "estatus-operacion";
  if (texto.includes("proceso") || texto.includes("construccion"))
    return "estatus-proceso";
  if (
    texto.includes("fuera") ||
    texto.includes("baja") ||
    texto.includes("cerrada")
  )
    return "estatus-inactivo";

  return "estatus-desconocido";
}

function mostrarEtiquetaServicio(nombre) {
  let etiqueta = document.querySelector(".servicio-tooltip-movil");

  if (!etiqueta) {
    etiqueta = document.createElement("div");
    etiqueta.className = "servicio-tooltip-movil";
    document.querySelector(".panel-servicios")?.appendChild(etiqueta);
  }

  if (!etiqueta) return;

  etiqueta.textContent = nombre;
  etiqueta.classList.add("visible");

  clearTimeout(etiqueta._timeout);
  etiqueta._timeout = setTimeout(() => {
    etiqueta.classList.remove("visible");
  }, 1800);
}

// =========================================================
// 5. CARGA DE DATOS CSV / GEOJSON
// =========================================================

function guardarEnMaps(row, maps) {
  const id = limpiarLlave(row.id_unidad);
  const clave = limpiarLlave(row.clave_presupuestal);
  const clues = limpiarLlave(row.clues);

  if (id) maps.porId.set(id, row);
  if (clave) maps.porClave.set(clave, row);
  if (clues && normalizarTexto(clues) !== "pendiente")
    maps.porClues.set(clues, row);
}

async function cargarCSV(ruta, maps, etiqueta) {
  const response = await fetch(ruta);
  if (!response.ok) throw new Error(`No se pudo cargar ${ruta}`);

  const filas = parseCSV(await response.text());
  maps.porId.clear();
  maps.porClave.clear();
  maps.porClues.clear();

  filas.forEach((row) => guardarEnMaps(row, maps));
  console.log(`${etiqueta} cargado:`, filas.length);
}

async function cargarDerechohabientes() {
  await cargarCSV(
    "data/derechohabientes.csv",
    {
      porId: derechohabientesPorId,
      porClave: derechohabientesPorClave,
      porClues: derechohabientesPorClues,
    },
    "Derechohabientes",
  );
}

async function cargarServicios() {
  await cargarCSV(
    "data/servicios.csv",
    {
      porId: serviciosPorId,
      porClave: serviciosPorClave,
      porClues: serviciosPorClues,
    },
    "Servicios",
  );
}

async function cargarInfraestructura() {
  await cargarCSV(
    "data/infraestructura.csv",
    {
      porId: infraestructuraPorId,
      porClave: infraestructuraPorClave,
      porClues: infraestructuraPorClues,
    },
    "Infraestructura",
  );
}

async function cargarPersonal() {
  await cargarCSV(
    "data/personal.csv",
    {
      porId: personalPorId,
      porClave: personalPorClave,
      porClues: personalPorClues,
    },
    "Personal",
  );
}

async function cargarCamas() {
  await cargarCSV(
    "data/camas.csv",
    {
      porId: camasPorId,
      porClave: camasPorClave,
      porClues: camasPorClues,
    },
    "Camas",
  );
}

async function cargarEquipo() {
  await cargarCSV(
    "data/equipo.csv",
    {
      porId: equipoPorId,
      porClave: equipoPorClave,
      porClues: equipoPorClues,
    },
    "Equipo",
  );
}

async function cargarGeojson() {
  const response = await fetch("data/unidades.geojson");
  if (!response.ok) throw new Error("No se pudo cargar unidades.geojson");

  datosGeojson = await response.json();
  poblarFiltros();
  aplicarFiltros();

  console.log("GeoJSON cargado correctamente");
}

function obtenerRegistroUnidad(props, maps) {
  const id = limpiarLlave(props.id_unidad);
  const clave = limpiarLlave(props.clave_presupuestal);
  const clues = limpiarLlave(props.clues);

  return (
    maps.porId.get(id) ||
    maps.porClave.get(clave) ||
    maps.porClues.get(clues) ||
    null
  );
}

function obtenerDerechohabientesUnidad(props) {
  return obtenerRegistroUnidad(props, {
    porId: derechohabientesPorId,
    porClave: derechohabientesPorClave,
    porClues: derechohabientesPorClues,
  });
}

function obtenerServiciosUnidad(props) {
  return obtenerRegistroUnidad(props, {
    porId: serviciosPorId,
    porClave: serviciosPorClave,
    porClues: serviciosPorClues,
  });
}

function obtenerInfraestructuraUnidad(props) {
  return obtenerRegistroUnidad(props, {
    porId: infraestructuraPorId,
    porClave: infraestructuraPorClave,
    porClues: infraestructuraPorClues,
  });
}

function obtenerPersonalUnidad(props) {
  return obtenerRegistroUnidad(props, {
    porId: personalPorId,
    porClave: personalPorClave,
    porClues: personalPorClues,
  });
}

function obtenerCamasUnidad(props) {
  return obtenerRegistroUnidad(props, {
    porId: camasPorId,
    porClave: camasPorClave,
    porClues: camasPorClues,
  });
}

function obtenerEquipoUnidad(props) {
  return obtenerRegistroUnidad(props, {
    porId: equipoPorId,
    porClave: equipoPorClave,
    porClues: equipoPorClues,
  });
}

// =========================================================
// 6. FILTROS Y RENDERIZADO DE MARCADORES
// =========================================================

function obtenerIconoPorTipo(siglaTipo) {
  const sigla = siglaTipo || "default";

  return L.icon({
    iconUrl: `assets/pines/${sigla}.svg`,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -38],
  });
}

function poblarFiltros() {
  const entidades = new Set();
  const tipos = new Set();
  const niveles = new Set();

  datosGeojson.features.forEach((feature) => {
    const props = feature.properties || {};
    entidades.add(props.entidad);
    tipos.add(props.sigla_tipo || props.tipo_unidad);
    niveles.add(props.nivel_atencion);
  });

  llenarSelect(filtroEntidad, entidades, "Todas las entidades");
  llenarSelect(filtroTipo, tipos, "Todos los tipos");
  llenarSelect(filtroNivel, niveles, "Todos los niveles");
  poblarMunicipios();
}

function poblarMunicipios() {
  const entidadSeleccionada = filtroEntidad.value;
  const municipios = new Set();

  datosGeojson.features.forEach((feature) => {
    const props = feature.properties || {};
    if (
      entidadSeleccionada === "TODOS" ||
      props.entidad === entidadSeleccionada
    ) {
      municipios.add(props.municipio);
    }
  });

  llenarSelect(filtroMunicipio, municipios, "Todos los municipios");
}

function aplicarFiltros() {
  clusters.clearLayers();
  if (capaActual) capaActual.clearLayers();

  const entidadSeleccionada = filtroEntidad.value;
  const municipioSeleccionado = filtroMunicipio.value;
  const tipoSeleccionado = filtroTipo.value;
  const nivelSeleccionado = filtroNivel.value;
  const textoBusqueda = normalizarTexto(busqueda.value);

  capaActual = L.geoJSON(datosGeojson, {
    filter(feature) {
      const props = feature.properties || {};
      const tipoUnidad = props.sigla_tipo || props.tipo_unidad || "";

      const pasaEntidad =
        entidadSeleccionada === "TODOS" ||
        props.entidad === entidadSeleccionada;
      const pasaMunicipio =
        municipioSeleccionado === "TODOS" ||
        props.municipio === municipioSeleccionado;
      const pasaTipo =
        tipoSeleccionado === "TODOS" || tipoUnidad === tipoSeleccionado;
      const pasaNivel =
        nivelSeleccionado === "TODOS" ||
        props.nivel_atencion === nivelSeleccionado;

      const textoCampos = normalizarTexto(
        [
          props.nombre_corto,
          props.nombre_oficial,
          props.nombre_unidad,
          props.clues,
          props.tipo_unidad,
          props.sigla_tipo,
          props.nivel_atencion,
          props.entidad,
          props.municipio,
          props.direccion_completa,
        ].join(" "),
      );

      const pasaBusqueda =
        !textoBusqueda || textoCampos.includes(textoBusqueda);

      return (
        pasaEntidad && pasaMunicipio && pasaTipo && pasaNivel && pasaBusqueda
      );
    },

    pointToLayer(feature, latlng) {
      const props = feature.properties || {};
      const marker = L.marker(latlng, {
        icon: obtenerIconoPorTipo(props.sigla_tipo || "default"),
      });

      marker.on("click", () => {
        if (modoActual === "analisis") {
          mostrarPanelAnalisis(props);
        } else {
          mostrarPanelUsuario(props);
        }
      });

      return marker;
    },
  });

  clusters.addLayer(capaActual);

  const totalResultados = capaActual.getLayers().length;
  contadorTexto.textContent = `${totalResultados.toLocaleString("es-MX")} unidad${totalResultados === 1 ? "" : "es"}`;

  const bounds = capaActual.getBounds();
  if (bounds.isValid()) {
    boundsIniciales = bounds;
    map.fitBounds(bounds, { padding: [30, 30] });
  }

  mensajeVacio.hidden = totalResultados > 0;
}

function limpiarFiltros() {
  filtroEntidad.value = "TODOS";
  poblarMunicipios();
  filtroMunicipio.value = "TODOS";
  filtroTipo.value = "TODOS";
  filtroNivel.value = "TODOS";
  busqueda.value = "";
  panel.classList.remove("activo");
  panelAnalisisDer.classList.remove("activo");
  aplicarFiltros();
}

// =========================================================
// 7. PANEL MODO USUARIO
// =========================================================

async function mostrarPanelUsuario(props) {
  panelNombre.textContent =
    props.nombre_corto ||
    props.nombre_oficial ||
    props.nombre_unidad ||
    "Sin nombre";
  panelClues.textContent = props.clues || "-";

  const siglaTipo = props.sigla_tipo || props.tipo_unidad || "default";
  const colorTipo = obtenerColorTipo(siglaTipo);
  const iconoNivel = obtenerIconoNivel(props.nivel_atencion);

  panelTipoBadge.textContent = props.sigla_tipo || "-";
  panelTipoBadge.style.background = colorTipo;
  panelTipoBadge.style.color = "#ffffff";

  panelTipo.textContent = props.tipo_unidad || props.sigla_tipo || "-";
  panelNivel.textContent = props.nivel_atencion || "-";
  panelNivelTexto.textContent = props.nivel_atencion || "-";

  panelEstatus.textContent = props.estatus_operativo || "-";
  panelEstatus.className = "panel-badge";
  panelEstatus.classList.add(obtenerClaseEstatus(props.estatus_operativo));

  await cargarSvgInline(iconoNivel, panelIconoNivel, "svg-nivel-inline");

  panelUbicacion.textContent = `${props.municipio || "-"}, ${props.entidad || "-"}`;
  panelDireccion.textContent = props.direccion_completa || "-";

  if (props.latitud && props.longitud) {
    panelRuta.href = `https://www.google.com/maps?q=${props.latitud},${props.longitud}`;
    panelRuta.style.display = "inline-flex";
  } else {
    panelRuta.style.display = "none";
  }

  btnCopiarDireccion.onclick = async () => {
    const direccion = props.direccion_completa || "";
    if (!direccion) return;
    await navigator.clipboard.writeText(direccion);
    btnCopiarDireccionTexto.textContent = "Dirección copiada";
    setTimeout(() => {
      btnCopiarDireccionTexto.textContent = "Copiar dirección";
    }, 1400);
  };

  renderServicios(obtenerServiciosDisponibles(obtenerServiciosUnidad(props)));
  panel.classList.add("activo");
}

function servicioDisponible(valor) {
  const texto = normalizarTexto(valor);
  return texto === "si" || texto === "sí" || texto === "1" || texto === "true";
}

function nombreServicio(campo) {
  if (NOMBRES_SERVICIOS[campo]) {
    return NOMBRES_SERVICIOS[campo];
  }

  return campo
    .replace("servicio_", "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function iconoServicio(campo) {
  const nombreArchivo = campo
    .replace("servicio_", "servicio-")
    .replaceAll("_", "-");
  return `assets/icons/${nombreArchivo}.svg`;
}

function obtenerServiciosDisponibles(row) {
  if (!row) return [];

  return Object.entries(row)
    .filter(
      ([campo, valor]) =>
        campo.startsWith("servicio_") && servicioDisponible(valor),
    )
    .map(([campo]) => ({
      campo,
      nombre: nombreServicio(campo),
      icono: iconoServicio(campo),
    }));
}

function renderServicios(servicios) {
  const contenedor = document.getElementById("panelServiciosIconos");
  const btnVerMas = document.querySelector(".btn-ver-mas");

  contenedor.innerHTML = "";

  if (!servicios.length) {
    contenedor.innerHTML =
      '<span class="servicio-placeholder">Sin servicios registrados</span>';
    btnVerMas.hidden = true;
    return;
  }

  let expandido = false;

  function pintar() {
    contenedor.innerHTML = "";
    const visibles = expandido ? servicios : servicios.slice(0, 5);

    visibles.forEach((servicio) => {
      const item = document.createElement("button");
      item.className = "servicio-item";
      item.type = "button";

      item.setAttribute("aria-label", servicio.nombre);

      item.innerHTML = `<span class="servicio-icono svg-inline-icon" data-src="${servicio.icono}" aria-hidden="true"></span>`;

      item.addEventListener("click", () => {
        mostrarEtiquetaServicio(servicio.nombre);
      });

      item.addEventListener("mouseenter", () => {
        mostrarEtiquetaServicio(servicio.nombre);
      });

      contenedor.appendChild(item);
      cargarSvgInline(servicio.icono, item.querySelector(".svg-inline-icon"));
    });

    const requiereVerMas = servicios.length > 5;
    btnVerMas.hidden = !requiereVerMas;

    if (!requiereVerMas) {
      btnVerMas.onclick = null;
      return;
    }

    btnVerMas.querySelector("span").textContent = expandido
      ? "Ver menos"
      : "Ver más";

    const iconoFlecha = btnVerMas.querySelector(".svg-inline-icon");
    iconoFlecha.dataset.src = expandido
      ? "assets/icons/flecha-arriba.svg"
      : "assets/icons/flecha-abajo.svg";
    cargarSvgInline(iconoFlecha.dataset.src, iconoFlecha);
  }

  btnVerMas.onclick = () => {
    expandido = !expandido;
    pintar();
  };

  pintar();
}

// =========================================================
// 8. PANEL MODO ANÁLISIS
// =========================================================

function activarTab(tab) {
  const botones = [
    tabResumen,
    tabCapacidad,
    tabPersonal,
    tabEquipo,
    tabCobertura,
  ];

  const contenidos = [
    contenidoResumen,
    contenidoCapacidad,
    contenidoPersonal,
    contenidoEquipo,
  ];

  botones.forEach((btn) => {
    if (btn) btn.classList.remove("activo");
  });

  contenidos.forEach((div) => {
    if (div) div.classList.remove("activo");
  });

  if (tab === "resumen") {
    tabResumen?.classList.add("activo");
    contenidoResumen?.classList.add("activo");
    return;
  }

  if (tab === "capacidad") {
    tabCapacidad?.classList.add("activo");
    contenidoCapacidad?.classList.add("activo");
    return;
  }

  if (tab === "personal") {
    tabPersonal?.classList.add("activo");
    contenidoPersonal?.classList.add("activo");
    return;
  }

  if (tab === "equipo") {
    tabEquipo?.classList.add("activo");
    contenidoEquipo?.classList.add("activo");
  }
}

function obtenerNivelesDhDisponibles(dh) {
  if (!dh) return [];

  const niveles = [
    {
      clave: "primer",
      texto: "Primer nivel",
      valor: dh.derechohabientes_primer_nivel,
    },
    {
      clave: "segundo",
      texto: "Segundo nivel",
      valor: dh.derechohabientes_segundo_nivel,
    },
    {
      clave: "tercer",
      texto: "Tercer nivel",
      valor: dh.derechohabientes_tercer_nivel,
    },
  ];

  return niveles.filter((nivel) => convertirNumero(nivel.valor) > 0);
}

function obtenerNivelDefaultDh(props, niveles) {
  const nivelUnidad = normalizarTexto(props.nivel_atencion);
  return (
    niveles.find((nivel) => nivelUnidad.includes(nivel.clave)) ||
    niveles[0] ||
    null
  );
}

function crearFilaDetalleCapacidad(item) {
  const valor = mostrarNumero(item.valor);
  const clase = convertirNumero(item.valor) > 0 ? "" : " sin-dato";

  return `
    <div class="capacidad-desglose-fila${clase}">
      <span>${item.label}</span>
      <strong>${valor}</strong>
    </div>
  `;
}

function renderDetalleCapacidad(contenedor, titulo, total, items, icono = "") {
  if (!contenedor) return;

  const totalNumero = convertirNumero(total);
  const itemsVisibles = items.filter((item) => item && item.label);

  contenedor.classList.remove("abierto");
  contenedor.classList.toggle("sin-datos", totalNumero <= 0);
  contenedor.innerHTML = `
    <button class="capacidad-desglose-btn" type="button">
      <div class="capacidad-titulo">
        ${
          icono
            ? `<span class="capacidad-icono svg-inline-icon" data-src="${icono}" aria-hidden="true"></span>`
            : ""
        }
        <span>${titulo}</span>
      </div>

      <strong>${mostrarNumero(totalNumero)}</strong>
      <i aria-hidden="true"></i>
    </button>

    <div class="capacidad-desglose">
      ${itemsVisibles.map(crearFilaDetalleCapacidad).join("")}
    </div>
  `;

  const iconoElemento = contenedor.querySelector(".capacidad-icono");
  if (iconoElemento) cargarSvgInline(icono, iconoElemento);

  const boton = contenedor.querySelector(".capacidad-desglose-btn");
  boton.addEventListener("click", () => {
    contenedor.classList.toggle("abierto");
  });
}

function sumarCampos(row, campos) {
  return campos.reduce((total, campo) => total + convertirNumero(row?.[campo]), 0);
}

function calcularPromediosComparativa(propsUnidad, nivelComparacion = null) {
  const entidad = propsUnidad.entidad;

  const nivelUnidad = nivelComparacion
    ? normalizarTexto(nivelComparacion)
    : normalizarTexto(propsUnidad.nivel_atencion);

  const unidades = datosGeojson.features
    .map((feature) => feature.properties || {})
    .filter((props) => normalizarTexto(props.nivel_atencion) === nivelUnidad);

  function calcularPara(lista) {
    let totalMedicos = 0;
    let totalConsultorios = 0;
    let totalCamas = 0;
    let totalDh = 0;
    let conteo = 0;

    lista.forEach((props) => {
      const dh = obtenerDerechohabientesUnidad(props);
      const infraestructura = obtenerInfraestructuraUnidad(props);
      const personal = obtenerPersonalUnidad(props);
      const camas = obtenerCamasUnidad(props);

      const nivelesDh = obtenerNivelesDhDisponibles(dh);
      const nivelDefault = obtenerNivelDefaultDh(props, nivelesDh);
      const derechohabientes = convertirNumero(nivelDefault?.valor);

      const medicos = convertirNumero(personal?.personal_medico_total);
      const consultorios = convertirNumero(infraestructura?.consultorio_total);
      const camasTotales =
        convertirNumero(camas?.camas_censables_total) +
        convertirNumero(camas?.camas_transito_total);

      if (derechohabientes <= 0 && medicos <= 0 && consultorios <= 0 && camasTotales <= 0) return;

      totalDh += derechohabientes;
      totalMedicos += medicos;
      totalConsultorios += consultorios;
      totalCamas += camasTotales;
      conteo++;
    });

    return {
      medicos: conteo ? Math.round(totalMedicos / conteo) : 0,
      consultorios: conteo ? Math.round(totalConsultorios / conteo) : 0,
      camas: conteo ? Math.round(totalCamas / conteo) : 0,
      dhMedico: totalMedicos > 0 ? Math.round(totalDh / totalMedicos) : 0,
      dhConsultorio: totalConsultorios > 0 ? Math.round(totalDh / totalConsultorios) : 0,
    };
  }

  return {
    estatal: calcularPara(unidades.filter((props) => props.entidad === entidad)),
    nacional: calcularPara(unidades),
  };
}

function calcularDiferenciaPorcentual(unidad, referencia) {
  if (!referencia || referencia <= 0 || !unidad) return null;
  return ((unidad - referencia) / referencia) * 100;
}

function renderComparativaIndicador(contenedor, titulo, unidad, estatal, nacional) {
  if (!contenedor) return;

  const maximo = Math.max(unidad, estatal, nacional, 1);

  function fila(label, valor) {
    const porcentaje = Math.max(4, Math.round((valor / maximo) * 100));

    return `
      <div class="comparativa-fila">
        <span>${label}</span>
        <div class="comparativa-barra">
          <b style="width:${porcentaje}%"></b>
        </div>
        <strong>${mostrarNumero(valor)}</strong>
      </div>
    `;
  }

  const diferenciaEstatal = calcularDiferenciaPorcentual(unidad, estatal);
  const textoDiferencia =
    diferenciaEstatal === null
      ? "Sin referencia estatal"
      : `${diferenciaEstatal >= 0 ? "▲" : "▼"} ${Math.abs(diferenciaEstatal).toFixed(1)}% ${diferenciaEstatal >= 0 ? "sobre" : "debajo del"} promedio estatal`;

  contenedor.innerHTML = `
    <div class="comparativa-card">
      <div class="comparativa-card-header">
        <h4>${titulo}</h4>
        <span class="${diferenciaEstatal !== null && diferenciaEstatal > 0 ? "comparativa-alerta" : "comparativa-ok"}">
          ${textoDiferencia}
        </span>
      </div>

    ${fila("Unidad", unidad)}
    ${fila("Promedio estatal", estatal)}
    ${fila("Promedio nacional", nacional)}
  </div>
`;
}

function mostrarPanelAnalisis(props) {
  analisisNombreUnidad.textContent =
    props.nombre_corto ||
    props.nombre_oficial ||
    props.nombre_unidad ||
    "Sin nombre";
  analisisTipo.textContent = props.sigla_tipo || "-";
  analisisNivel.textContent = props.nivel_atencion || "-";
  analisisEstatus.textContent = props.estatus_operativo || "-";
  analisisClues.textContent = props.clues || "-";
  analisisClavePresupuestal.textContent = props.clave_presupuestal || "-";
  analisisSubdelegacion.textContent = props.subdelegacion || "-";
  analisisSituacionJuridica.textContent = props.situacion_juridica_inmueble || "-";
  analisisTipoUnidadTexto.textContent = props.tipo_unidad || "-";

  const siglaTipo = props.sigla_tipo || props.tipo_unidad || "default";
  const colorTipo = obtenerColorTipo(siglaTipo);

  analisisTipo.style.background = colorTipo;
  analisisTipo.style.color = "#ffffff";

  const iconoNivel = obtenerIconoNivel(props.nivel_atencion);
  cargarSvgInline(iconoNivel, analisisIconoNivel, "svg-nivel-inline");
  const dh = obtenerDerechohabientesUnidad(props);
  const infraestructura = obtenerInfraestructuraUnidad(props);
  const personal = obtenerPersonalUnidad(props);
  const camas = obtenerCamasUnidad(props);
  const equipo = obtenerEquipoUnidad(props);

  const consultorios = convertirNumero(infraestructura?.consultorio_total);
  const medicos = convertirNumero(personal?.personal_medico_total);

  const camasCensables = convertirNumero(camas?.camas_censables_total);
  const camasTransito = convertirNumero(camas?.camas_transito_total);
  const camasTotales = camasCensables + camasTransito;
  const camasUci = convertirNumero(camas?.camas_transito_cuidados_intensivos);
  const camasPediatria = convertirNumero(
    camas?.camas_censables_pediatria_total,
  );

  const quirofanos = convertirNumero(infraestructura?.quirofano);
  const laboratorios = convertirNumero(infraestructura?.laboratorio_total);
  const salas = convertirNumero(infraestructura?.sala_total);
  const farmacia = convertirNumero(infraestructura?.farmacia);
  const stockFarmacia = convertirNumero(infraestructura?.stock_farmacia);
  const bancoSangre = convertirNumero(infraestructura?.banco_sangre);
  const bancoLeche = convertirNumero(infraestructura?.banco_leche);

  kpiConsultorios.textContent = mostrarNumero(consultorios);
  kpiMedicos.textContent = mostrarNumero(medicos);
  kpiCamas.textContent = mostrarNumero(camasTotales);
  kpiDhMedico.textContent = "-";

  renderDetalleCapacidad(
    detalleCamasCensables,
    "Camas censables",
    camasCensables,
    [
      {
        label: "Adultos cirugía",
        valor: camas?.camas_censables_adultos_cirugia,
      },
      {
        label: "Adultos medicina interna",
        valor: camas?.camas_censables_adultos_medicina_interna,
      },
      {
        label: "Adultos gineco-obstetricia",
        valor: camas?.camas_censables_adultos_gineco_obstetricia,
      },
      {
        label: "Adultos total",
        valor: camas?.camas_censables_adultos_total,
      },
      {
        label: "Pediatría camas",
        valor: camas?.camas_censables_pediatria_camas,
      },
      {
        label: "Pediatría cunas",
        valor: camas?.camas_censables_pediatria_cunas,
      },
      {
        label: "Pediatría incubadoras",
        valor: camas?.camas_censables_pediatria_incubadoras,
      },
      {
        label: "Pediatría total",
        valor: camas?.camas_censables_pediatria_total,
      },
    ],
    "assets/icons/camas-censables.svg"
  );

  renderDetalleCapacidad(
    detalleCamasTransito,
    "Camas tránsito",
    camasTransito,
    [
      {
        label: "Urgencias adultos",
        valor: camas?.camas_transito_urgencias_adultos,
      },
      {
        label: "Urgencias pediatría",
        valor: camas?.camas_transito_urgencias_pediatria,
      },
      {
        label: "Trabajo de parto",
        valor: camas?.camas_transito_trabajo_de_parto,
      },
      {
        label: "Cuidados intensivos",
        valor: camas?.camas_transito_cuidados_intensivos,
      },
      {
        label: "Recuperación",
        valor: camas?.camas_transito_recuperacion,
      },
      {
        label: "Cunas",
        valor: camas?.camas_transito_cunas,
      },
      {
        label: "Otras",
        valor: camas?.camas_transito_otras,
      },
    ],
    "assets/icons/camas-transito.svg"
  );

  renderDetalleCapacidad(
    detalleConsultorios,
    "Consultorios",
    consultorios,
    [
      {
        label: "Medicina general o familiar",
        valor: infraestructura?.consultorio_medicina_general_o_familiar,
      },
      {
        label: "Especialidad",
        valor: infraestructura?.consultorio_especialidad,
      },
      {
        label: "Odontología",
        valor: infraestructura?.consultorio_odontologia,
      },
      {
        label: "Urgencias",
        valor: infraestructura?.consultorio_urgencias,
      },
      {
        label: "Otros",
        valor: infraestructura?.consultorio_otros,
      },
    ],
    "assets/icons/consultorios.svg"
  );

  renderDetalleCapacidad(
    detalleLaboratorios,
    "Laboratorios",
    laboratorios,
    [
      {
        label: "Análisis clínicos",
        valor: infraestructura?.laboratorio_analisis_clinicos,
      },
      {
        label: "Áreas críticas",
        valor: infraestructura?.laboratorio_areas_criticas,
      },
      {
        label: "Central",
        valor: infraestructura?.laboratorio_central,
      },
      {
        label: "Patológico",
        valor: infraestructura?.laboratorio_patologico,
      },
      {
        label: "Pruebas especiales",
        valor: infraestructura?.laboratorio_pruebas_especiales,
      },
      {
        label: "Urgencias",
        valor: infraestructura?.laboratorio_urgencias,
      },
    ],
    "assets/icons/laboratorios.svg"

  );

  renderDetalleCapacidad(
    detalleSalas,
    "Salas",
    salas,
    [
      {
        label: "Urgencias",
        valor: infraestructura?.sala_urgencias,
      },
      {
        label: "Expulsión",
        valor: infraestructura?.sala_expulsion,
      },
      {
        label: "Diálisis",
        valor: infraestructura?.sala_dialisis,
      },
      {
        label: "Hemodiálisis",
        valor: infraestructura?.sala_hemodialisis,
      },
      {
        label: "Cuidados intensivos",
        valor: infraestructura?.sala_cuidados_intensivos,
      },
      {
        label: "Unidad de quemados",
        valor: infraestructura?.sala_unidad_de_quemados,
      },
      {
        label: "Patología",
        valor: infraestructura?.sala_patologia,
      },
      {
        label: "Hemodinamia",
        valor: infraestructura?.sala_hemodinamia,
      },
      {
        label: "Quimioterapia",
        valor: infraestructura?.sala_quimioterapia,
      },
    ],
    "assets/icons/salas.svg"
  );

  renderDetalleCapacidad(
    detalleApoyoClinico,
    "Apoyo clínico",
    quirofanos + farmacia + stockFarmacia + bancoLeche + bancoSangre,
    [
      {
        label: "Quirófanos",
        valor: infraestructura?.quirofano,
      },
      {
        label: "Farmacia",
        valor: infraestructura?.farmacia,
      },
      {
        label: "Stock farmacia",
        valor: infraestructura?.stock_farmacia,
      },
      {
        label: "Banco de sangre",
        valor: infraestructura?.banco_sangre,
      },
      {
        label: "Banco de leche",
        valor: infraestructura?.banco_leche,
      },
    ],
    "assets/icons/apoyo-clinico.svg"
  );

    renderDetalleCapacidad(
    detallePersonalMedico,
    'Personal médico',
    personal?.personal_medico_total,
    [
      { label: 'General / familiar', valor: personal?.personal_medico_general_familiar },
      { label: 'Gineco-obstetra', valor: personal?.personal_medico_gineco_obstetra },
      { label: 'Pediatra', valor: personal?.personal_medico_pediatra },
      { label: 'Odontólogo', valor: personal?.personal_medico_odontologo },
      { label: 'Cirujano', valor: personal?.personal_medico_cirujano },
      { label: 'Internista', valor: personal?.personal_medico_internista },
      { label: 'Anestesiólogo', valor: personal?.personal_medico_anestesiologo },
      { label: 'Geriatra', valor: personal?.personal_medico_geriatra },
      { label: 'Oncólogos', valor: personal?.personal_medico_oncologos },
      { label: 'Traumatología y ortopedia', valor: personal?.personal_medico_traumatologia_y_ortopedia },
      { label: 'Otras especialidades', valor: personal?.personal_medico_otras_especialidades },
      { label: 'Otras labores', valor: personal?.personal_medico_otras_labores },
      { label: 'Residentes', valor: personal?.personal_medico_etapa_aprendizaje_residentes },
      { label: 'Internos', valor: personal?.personal_medico_etapa_aprendizaje_internos },
      { label: 'Pasantes', valor: personal?.personal_medico_etapa_aprendizaje_pasantes }
    ],
    "assets/icons/personal-medico.svg"
  );

  renderDetalleCapacidad(
    detalleEnfermeria,
    'Enfermería',
    personal?.personal_enfermeria_total,
    [
      { label: 'General', valor: personal?.personal_enfermeria_general },
      { label: 'Especialista', valor: personal?.personal_enfermeria_especialista },
      { label: 'Auxiliar', valor: personal?.personal_enfermeria_auxiliar },
      { label: 'Pasante', valor: personal?.personal_enfermeria_pasante }
    ],
    "assets/icons/personal-enfermeria.svg"
  );

  renderDetalleCapacidad(
    detalleParamedico,
    'Personal paramédico',
    personal?.personal_paramedico_total,
    [
      { label: 'Laboratorista', valor: personal?.personal_paramedico_laboratorista },
      { label: 'Rayos X', valor: personal?.personal_paramedico_rayos_x },
      { label: 'Químicos', valor: personal?.personal_paramedico_quimicos },
      { label: 'Trabajo social', valor: personal?.personal_paramedico_trabajo_social },
      { label: 'Otros', valor: personal?.personal_paramedico_otros }
    ],
    "assets/icons/personal-paramedico.svg"
  );

  renderDetalleCapacidad(
    detalleApoyoAdministrativo,
    'Apoyo administrativo y servicios',
    sumarCampos(personal, [
      "personal_administrativo",
      "personal_servicios_generales"
    ]),
    [
      { label: 'Administrativo', valor: personal?.personal_administrativo },
      { label: 'Servicios generales', valor: personal?.personal_servicios_generales }
    ],
    "assets/icons/personal-administrativo.svg"
  );

  renderDetalleCapacidad(
    detalleImagenologia,
    "Imagenología",
    sumarCampos(equipo, [
      "equipo_rayos_x_equipo_fijo",
      "equipo_rayos_x_equipo_movil",
      "equipo_rayos_x_dental_periapical",
      "equipo_rayos_x_dental_ortopantografo",
      "equipo_arco_en_c",
      "equipo_flouroscopio",
      "equipo_mastografo",
      "equipo_resonador",
      "equipo_tomografo",
      "equipo_ultrasonido",
      "equipo_endoscopia",
      "equipo_colposcopio",
    ]),
    [
      { label: "Rayos X fijo", valor: equipo?.equipo_rayos_x_equipo_fijo },
      { label: "Rayos X móvil", valor: equipo?.equipo_rayos_x_equipo_movil },
      { label: "Rayos X dental periapical", valor: equipo?.equipo_rayos_x_dental_periapical },
      { label: "Rayos X dental ortopantógrafo", valor: equipo?.equipo_rayos_x_dental_ortopantografo },
      { label: "Arco en C", valor: equipo?.equipo_arco_en_c },
      { label: "Fluoroscopio", valor: equipo?.equipo_flouroscopio },
      { label: "Mastógrafo", valor: equipo?.equipo_mastografo },
      { label: "Resonador", valor: equipo?.equipo_resonador },
      { label: "Tomógrafo", valor: equipo?.equipo_tomografo },
      { label: "Ultrasonido", valor: equipo?.equipo_ultrasonido },
      { label: "Endoscopia", valor: equipo?.equipo_endoscopia },
      { label: "Colposcopio", valor: equipo?.equipo_colposcopio },
    ],
    "assets/icons/imagenologia.svg"
  );

  renderDetalleCapacidad(
    detalleUrgenciasEquipo,
    "Urgencias y soporte vital",
    sumarCampos(equipo, [
      "equipo_bomba_de_infusion",
      "equipo_carro_rojo",
      "equipo_desfibrilador",
      "equipo_monitor_de_signos_vitales_general_y_traslado",
      "equipo_monitor_de_signos_vitales_central_de_monitoreo",
      "equipo_ventilador",
    ]),
    [
      { label: "Bomba de infusión", valor: equipo?.equipo_bomba_de_infusion },
      { label: "Carro rojo", valor: equipo?.equipo_carro_rojo },
      { label: "Desfibrilador", valor: equipo?.equipo_desfibrilador },
      { label: "Monitor signos vitales general y traslado", valor: equipo?.equipo_monitor_de_signos_vitales_general_y_traslado },
      { label: "Central de monitoreo", valor: equipo?.equipo_monitor_de_signos_vitales_central_de_monitoreo },
      { label: "Ventilador", valor: equipo?.equipo_ventilador },
    ],
    "assets/icons/soporte-vital.svg"
  );

  renderDetalleCapacidad(
    detalleNeonatal,
    "Equipo neonatal",
    sumarCampos(equipo, [
      "equipo_incubadora_cuidados_generales",
      "equipo_incubadora_recien_nacido",
      "equipo_incubadora_traslado",
    ]),
    [
      { label: "Incubadora cuidados generales", valor: equipo?.equipo_incubadora_cuidados_generales },
      { label: "Incubadora recién nacido", valor: equipo?.equipo_incubadora_recien_nacido },
      { label: "Incubadora traslado", valor: equipo?.equipo_incubadora_traslado },
    ],
    "assets/icons/neonatal.svg"
  );

  renderDetalleCapacidad(
    detalleTransporte,
    "Transporte",
    sumarCampos(equipo, [
      "ambulancia_traslado",
      "ambulancia_urgencia",
      "ambulancia_terapia_intensiva",
    ]),
    [
      { label: "Ambulancia traslado", valor: equipo?.ambulancia_traslado },
      { label: "Ambulancia urgencia", valor: equipo?.ambulancia_urgencia },
      { label: "Ambulancia terapia intensiva", valor: equipo?.ambulancia_terapia_intensiva },
    ],
    "assets/icons/transporte.svg"
  );

  renderDetalleCapacidad(
    detalleEspecializado,
    "Equipo especializado y rehabilitación",
    sumarCampos(equipo, [
      "equipo_acelerador_lineal",
      "equipo_medicina_fisica_y_rehabilitacion_electroestimulador_neuromuscular",
      "equipo_medicina_fisica_y_rehabilitacion_tina_remolino_horizontal",
      "equipo_medicina_fisica_y_rehabilitacion_ultrasonido_terapeutico",
    ]),
    [
      { label: "Acelerador lineal", valor: equipo?.equipo_acelerador_lineal },
      { label: "Electroestimulador neuromuscular", valor: equipo?.equipo_medicina_fisica_y_rehabilitacion_electroestimulador_neuromuscular },
      { label: "Tina remolino horizontal", valor: equipo?.equipo_medicina_fisica_y_rehabilitacion_tina_remolino_horizontal },
      { label: "Ultrasonido terapéutico", valor: equipo?.equipo_medicina_fisica_y_rehabilitacion_ultrasonido_terapeutico },
    ],
    "assets/icons/especializado.svg"
  );

const nivelesDh = obtenerNivelesDhDisponibles(dh);
  const nivelDefault = obtenerNivelDefaultDh(props, nivelesDh);

  selectorNivelDh.innerHTML = "";
  nivelesDh.forEach((nivel) => {
    const option = document.createElement("option");
    option.value = nivel.clave;
    option.textContent = nivel.texto;
    selectorNivelDh.appendChild(option);
  });

  if (nivelDefault) selectorNivelDh.value = nivelDefault.clave;

  function actualizarDh() {
    const nivelSeleccionado = nivelesDh.find(
      (nivel) => nivel.clave === selectorNivelDh.value,
    );
    const derechohabientes = convertirNumero(nivelSeleccionado?.valor);

    const nivelComparacion =
      nivelesDh.length > 1
        ? nivelSeleccionado?.texto
        : null;

    const promedios = calcularPromediosComparativa(
      props,
      nivelComparacion
    );

    kpiDerechohabientes.textContent = mostrarNumero(derechohabientes);
    kpiDhConsultorio.textContent =
      derechohabientes > 0 && consultorios > 0
        ? formatearNumero(Math.round(derechohabientes / consultorios))
        : "-";
    kpiDhMedico.textContent =
      derechohabientes > 0 && medicos > 0
        ? formatearNumero(Math.round(derechohabientes / medicos))
        : "-";

    renderComparativaIndicador(
      comparativaDhMedico,
      "Derechohabientes por médico",
      derechohabientes > 0 && medicos > 0
        ? Math.round(derechohabientes / medicos)
        : 0,
      promedios.estatal.dhMedico,
      promedios.nacional.dhMedico
    );

    renderComparativaIndicador(
      comparativaDhConsultorio,
      "Derechohabientes por consultorio",
      derechohabientes > 0 && consultorios > 0
        ? Math.round(derechohabientes / consultorios)
        : 0,
      promedios.estatal.dhConsultorio,
      promedios.nacional.dhConsultorio
    );

    renderComparativaIndicador(
      comparativaCamas,
      "Camas totales",
      camasTotales,
        promedios.estatal.camas,
        promedios.nacional.camas
    );
  }

  selectorNivelDh.onchange = actualizarDh;
  actualizarDh();

  const tarjetaSelectorDh = selectorNivelDh.closest(".analisis-selector-dh");
  if (tarjetaSelectorDh) tarjetaSelectorDh.hidden = nivelesDh.length <= 1;

  activarTab("resumen");
  panelAnalisisDer.classList.add("activo");
}

// =========================================================
// 9. HERRAMIENTAS DEL MAPA
// =========================================================

function activarModo(modo) {
  modoActual = modo;
  const esAnalisis = modo === "analisis";

  document.body.classList.toggle("modo-analisis", esAnalisis);
  btnModoUsuario.classList.toggle("activo", !esAnalisis);
  btnModoAnalisis.classList.toggle("activo", esAnalisis);

  panel.classList.remove("activo");
  panelAnalisisDer.classList.remove("activo");
  nearestMenu.hidden = true;

  setTimeout(() => map.invalidateSize(), 250);
}

function calcularDistanciaKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function obtenerUbicacionUsuario(callback) {
  if (ubicacionUsuario) {
    callback(ubicacionUsuario);
    return;
  }

  if (!navigator.geolocation) {
    alert("Tu navegador no soporta geolocalización");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (posicion) => {
      ubicacionUsuario = {
        lat: posicion.coords.latitude,
        lng: posicion.coords.longitude,
      };
      callback(ubicacionUsuario);
    },
    () => alert("No se pudo obtener tu ubicación"),
  );
}

function buscarUnidadMasCercana(nivelBuscado) {
  obtenerUbicacionUsuario((posicion) => {
    let unidadMasCercana = null;
    let distanciaMinima = Infinity;

    datosGeojson.features.forEach((feature) => {
      const props = feature.properties || {};
      const siglaTipo = normalizarTexto(props.sigla_tipo || props.tipo_unidad);

      if (siglaTipo === "cmct") return;
      if (props.nivel_atencion !== nivelBuscado) return;
      if (!props.latitud || !props.longitud) return;

      const distancia = calcularDistanciaKm(
        posicion.lat,
        posicion.lng,
        Number(props.latitud),
        Number(props.longitud),
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

    if (marcadorUnidadCercana) map.removeLayer(marcadorUnidadCercana);

    marcadorUnidadCercana = L.circleMarker([lat, lng], {
      radius: 16,
      color: "#c9a14a",
      weight: 4,
      fillColor: "#7a1e2c",
      fillOpacity: 0.35,
    }).addTo(map);

    mostrarPanelUsuario(props);
    alert(
      `La unidad de ${nivelBuscado} más cercana es:\n\n${props.nombre_corto || props.nombre_oficial}\nDistancia aproximada: ${distanciaMinima.toFixed(2)} km`,
    );
    nearestMenu.hidden = true;
  });
}

// =========================================================
// 10. EVENTOS E INICIALIZACIÓN
// =========================================================

function registrarEventos() {
  btnModoUsuario.addEventListener("click", () => activarModo("usuario"));
  btnModoAnalisis.addEventListener("click", () => activarModo("analisis"));

  cerrarPanelBtn.addEventListener("click", () =>
    panel.classList.remove("activo"),
  );
  cerrarPanelAnalisis.addEventListener("click", () =>
    panelAnalisisDer.classList.remove("activo"),
  );

  zoomInBtn.addEventListener("click", () => map.zoomIn());
  zoomOutBtn.addEventListener("click", () => map.zoomOut());

  filtroEntidad.addEventListener("change", () => {
    poblarMunicipios();
    filtroMunicipio.value = "TODOS";
    aplicarFiltros();
  });

  filtroMunicipio.addEventListener("change", aplicarFiltros);
  filtroTipo.addEventListener("change", aplicarFiltros);
  filtroNivel.addEventListener("change", aplicarFiltros);
  busqueda.addEventListener("input", aplicarFiltros);
  btnLimpiar.addEventListener("click", limpiarFiltros);
  btnRestablecer.addEventListener("click", limpiarFiltros);

  btnVista.addEventListener("click", () => {
    if (boundsIniciales && boundsIniciales.isValid()) {
      map.fitBounds(boundsIniciales, { padding: [30, 30] });
    }
  });

  btnUbicacion.addEventListener("click", () => {
    obtenerUbicacionUsuario((posicion) => {
      map.setView([posicion.lat, posicion.lng], 13);
      L.circleMarker([posicion.lat, posicion.lng], {
        radius: 10,
        fillColor: "#2b7cff",
        color: "#ffffff",
        weight: 3,
        fillOpacity: 1,
      }).addTo(map);
    });
  });

  btnNearestToggle.addEventListener("click", () => {
    nearestMenu.hidden = !nearestMenu.hidden;
  });

  nearestMenu.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () =>
      buscarUnidadMasCercana(button.dataset.nivel),
    );
  });

  if (tabResumen) {
    tabResumen.addEventListener("click", () => activarTab("resumen"));
  }

  if (tabCapacidad) {
    tabCapacidad.addEventListener("click", () => activarTab("capacidad"));
  }

  if (tabPersonal) {
    tabPersonal.addEventListener("click", () => activarTab("personal"));
  }

  if (tabEquipo) {
    tabEquipo.addEventListener("click", () => activarTab("equipo"));
  }

  [tabCobertura].forEach((tab) => {
    if (tab) {
      tab.addEventListener("click", () =>
        alert("Esta pestaña se integrará en la siguiente fase."),
      );
    }
  });

  selectorNivelDh.addEventListener("focus", () => {
    selectorNivelDh.parentElement.classList.add("abierto");
  });

  selectorNivelDh.addEventListener("blur", () => {
    selectorNivelDh.parentElement.classList.remove("abierto");
  });
}

async function iniciarMapa() {
  try {
    inicializarIconosSvgInline();
    registrarEventos();

    await cargarDerechohabientes();
    await cargarServicios();
    await cargarInfraestructura();
    await cargarPersonal();
    await cargarCamas();
    await cargarEquipo();
    await cargarGeojson();
  } catch (error) {
    console.error(error);
    alert("Error cargando datos");
  }
}

iniciarMapa();
