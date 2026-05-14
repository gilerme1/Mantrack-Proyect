// prisma/seed.js
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inicializando base de datos...')

  // Limpiar datos existentes para evitar duplicados al re-ejecutar el seed
  await prisma.report.deleteMany()
  await prisma.equipment.deleteMany()
  await prisma.client.deleteMany()
  await prisma.template.deleteMany()

  const adminPass = await bcrypt.hash('admin123', 10)
  const techPass  = await bcrypt.hash('tech123', 10)

  // Usuarios
  const admin = await prisma.user.upsert({
    where:  { email: 'admin@empresa.com' },
    update: {},
    create: { email: 'admin@empresa.com', name: 'Administrador', role: 'ADMIN', password: adminPass },
  })

  const techs = await Promise.all([
    prisma.user.upsert({ where: { email: 'luis@empresa.com'   }, update: {}, create: { email: 'luis@empresa.com',   name: 'Luis Herrera', role: 'TECH', password: techPass } }),
    prisma.user.upsert({ where: { email: 'ana@empresa.com'    }, update: {}, create: { email: 'ana@empresa.com',    name: 'Ana Torres',   role: 'TECH', password: techPass } }),
    prisma.user.upsert({ where: { email: 'carlos@empresa.com' }, update: {}, create: { email: 'carlos@empresa.com', name: 'Carlos Ríos',  role: 'TECH', password: techPass } }),
  ])

  // Clientes
  const clientsData = [
    { name: 'Industrias Vega',    sector: 'Manufactura', contact: 'jorge.vega@ivega.com', phone: '+56 9 8811 2200', address: 'Av. Vicuña Mackenna 480, Santiago',  lat: -33.4613, lng: -70.6067 },
    { name: 'Logística Sur',       sector: 'Transporte',  contact: 'ops@logisticasur.cl',  phone: '+56 9 9022 3311', address: 'Ruta 5 Sur Km 980, Temuco',          lat: -38.7296, lng: -72.5984 },
    { name: 'Minera Andina',       sector: 'Minería',     contact: 'mant@mineraandina.cl', phone: '+56 9 7733 4400', address: 'Los Andes, Región de Valparaíso',    lat: -32.8344, lng: -70.5965 },
    { name: 'Alimentos del Norte', sector: 'Alimentos',   contact: 'planta@adelnorte.com', phone: '+56 9 8844 5511', address: 'Av. Angamos 1234, Antofagasta',      lat: -23.6509, lng: -70.3954 },
    { name: 'Farmacéutica BioLab', sector: 'Salud',       contact: 'ing@biolab.cl',        phone: '+56 9 9955 6622', address: 'Av. Providencia 1500, Santiago',     lat: -33.4281, lng: -70.6145 },
  ]

  const clients = []
  for (const d of clientsData) {
    const c = await prisma.client.create({ data: d })
    clients.push(c)
  }

  // Equipos
  const equipData = [
    { name: 'Compresor Atlas C-12',      model: 'Atlas Copco GA55',   serial: 'AC-2021-0441',  status: 'OVERDUE',   location: 'Planta A – Sala compresores',     ci: 0, lastMaint: new Date('2025-03-06'), nextMaint: null },
    { name: 'Bomba Centrífuga B-4',      model: 'Grundfos CR15',      serial: 'GF-2022-0812',  status: 'SCHEDULED', location: 'Mina – Nivel 3 bombeo',            ci: 2, lastMaint: new Date('2025-04-08'), nextMaint: new Date('2025-05-08') },
    { name: 'Generador G-200',           model: 'Caterpillar C9',     serial: 'CAT-2020-1133', status: 'ACTIVE',    location: 'Bodega central – Sala eléctrica',  ci: 1, lastMaint: new Date('2025-04-15'), nextMaint: new Date('2025-05-15') },
    { name: 'Caldera Industrial K-7',    model: 'Cleaver-Brooks 200', serial: 'CB-2019-0022',  status: 'OVERDUE',   location: 'Planta producción – Calderas',     ci: 3, lastMaint: new Date('2025-02-20'), nextMaint: null },
    { name: 'Motor Eléctrico ME-33',     model: 'Siemens 1LA7',       serial: 'SIE-2023-0567', status: 'ACTIVE',    location: 'Planta A – Línea producción 2',    ci: 0, lastMaint: new Date('2025-04-17'), nextMaint: new Date('2025-05-17') },
    { name: 'Turbina T-80',              model: 'GE LM2500',          serial: 'GE-2022-0231',  status: 'ACTIVE',    location: 'Sala turbinas – Nivel 1',          ci: 4, lastMaint: new Date('2025-04-19'), nextMaint: new Date('2025-05-19') },
    { name: 'Chiller CH-14',             model: 'Trane CGAM-60',      serial: 'TR-2021-0388',  status: 'OVERDUE',   location: 'Edificio admin – Sala mecánica',   ci: 2, lastMaint: new Date('2025-03-01'), nextMaint: null },
    { name: 'Banda Transportadora BT-2', model: 'Rexnord LF820',      serial: 'RX-2020-0144',  status: 'SCHEDULED', location: 'Planta procesamiento – Nivel 2',   ci: 2, lastMaint: new Date('2025-04-01'), nextMaint: new Date('2025-05-01') },
  ]

  const equips = []
  for (const { ci, ...d } of equipData) {
    const e = await prisma.equipment.create({ data: { ...d, clientId: clients[ci].id } })
    equips.push(e)
  }

  // Reportes
  const reportData = [
    { type: 'PREVENTIVO', status: 'COMPLETED', notes: 'Cambio de filtros de aceite y aire. Revisión de válvulas. Sistema operativo al 100%.',     duration: 90,  ti: 0, ei: 0, date: new Date('2025-04-20T10:32:00') },
    { type: 'CORRECTIVO', status: 'PENDING',   notes: 'Vibración anormal detectada. Pendiente revisión de rodamientos.',                           duration: null, ti: 1, ei: 1, date: new Date('2025-04-20T08:15:00') },
    { type: 'PREVENTIVO', status: 'COMPLETED', notes: 'Lubricación general. Medición de temperatura normal. Sin anomalías.',                       duration: 60,  ti: 2, ei: 4, date: new Date('2025-04-19T16:50:00') },
    { type: 'INSPECCION', status: 'COMPLETED', notes: 'Nivel de combustible OK. Revisión de baterías y arranque. Funcionamiento normal.',          duration: 45,  ti: 0, ei: 2, date: new Date('2025-04-19T14:20:00') },
    { type: 'CORRECTIVO', status: 'PENDING',   notes: 'Fuga de vapor en válvula de seguridad. Requiere reemplazo urgente.',                        duration: null, ti: 1, ei: 3, date: new Date('2025-04-20T09:00:00') },
    { type: 'PREVENTIVO', status: 'COMPLETED', notes: 'Mantenimiento programado. Revisión de paletas y sellos. Todo en orden.',                    duration: 120, ti: 1, ei: 5, date: new Date('2025-04-18T11:00:00') },
  ]

  for (const { ti, ei, date, ...d } of reportData) {
    await prisma.report.create({
      data: { ...d, techId: techs[ti].id, equipmentId: equips[ei].id, createdAt: date, updatedAt: date },
    })
  }

  // ── Templates del sistema ──────────────────────────────────────────────
  const TEMPLATES = [
    {
      name: 'Mantenimiento Preventivo – Aire Acondicionado Split',
      industry: 'REFRIGERATION', equipmentType: 'AC_SPLIT', reportType: 'MAINTENANCE', isSystem: true,
      sections: [
        { title: 'Unidad Interior', items: [
          'Limpiar filtros de aire',
          'Verificar temperatura de salida de aire',
          'Revisar ruidos y vibraciones',
          'Limpiar bandeja de condensado',
          'Verificar control remoto',
        ]},
        { title: 'Unidad Exterior', items: [
          'Limpiar serpentín condensador',
          'Revisar estado de compresor',
          'Limpiar aletas del condensador',
          'Verificar ventilador de condensación',
          'Revisar estado de tuberías y aislación',
        ]},
        { title: 'Sistema Eléctrico', items: [
          'Verificar voltaje de alimentación',
          'Revisar conexiones eléctricas',
          'Medir amperaje de compresor',
          'Verificar capacitor de arranque',
        ]},
        { title: 'Parámetros de Operación', items: [
          'Medir temperatura de succión',
          'Medir temperatura de descarga',
          'Verificar delta T en evaporador',
          'Confirmar nivel de carga de refrigerante',
        ]},
      ],
    },
    {
      name: 'Instalación – Aire Acondicionado Split',
      industry: 'REFRIGERATION', equipmentType: 'AC_SPLIT', reportType: 'INSTALLATION', isSystem: true,
      sections: [
        { title: 'Preparación', items: [
          'Verificar potencia eléctrica disponible',
          'Confirmar ubicación de unidades con cliente',
          'Verificar herramientas y materiales',
        ]},
        { title: 'Instalación Unidad Interior', items: [
          'Fijar soporte a la pared',
          'Instalar unidad interior en soporte',
          'Pasar cañería frigorífica',
          'Conectar cableado eléctrico',
          'Verificar nivelación',
        ]},
        { title: 'Instalación Unidad Exterior', items: [
          'Instalar base antivibrante',
          'Montar unidad exterior',
          'Conectar cañerías frigoríficas',
          'Purgar líneas con nitrógeno',
          'Realizar vacío del sistema',
        ]},
        { title: 'Puesta en Marcha', items: [
          'Verificar estanqueidad del sistema',
          'Cargar refrigerante según especificaciones',
          'Arrancar equipo y verificar funcionamiento',
          'Medir parámetros de operación',
          'Instruir al cliente sobre uso correcto',
        ]},
      ],
    },
    {
      name: 'Mantenimiento Preventivo – Cámara de Frío',
      industry: 'REFRIGERATION', equipmentType: 'COLD_ROOM', reportType: 'MAINTENANCE', isSystem: true,
      sections: [
        { title: 'Sistema de Refrigeración', items: [
          'Verificar presiones de trabajo (alta y baja)',
          'Revisar estado y sonido de compresor',
          'Controlar nivel de aceite de compresor',
          'Revisar válvula de expansión',
          'Verificar presostatos de alta y baja',
        ]},
        { title: 'Aislamiento y Estructura', items: [
          'Revisar estado de paneles aislantes',
          'Verificar sellado de juntas y puertas',
          'Controlar funcionamiento de bisagras y cierres',
          'Revisar resistencias anti-hielo en puertas',
        ]},
        { title: 'Sistema Eléctrico', items: [
          'Verificar tablero de control',
          'Revisar termostatos y sondas de temperatura',
          'Controlar iluminación interior',
          'Verificar sistema de alarmas',
        ]},
        { title: 'Limpieza', items: [
          'Limpiar condensador',
          'Descarchar evaporador si es necesario',
          'Limpiar bandejas de drenaje',
          'Verificar sistema de drenaje',
        ]},
      ],
    },
    {
      name: 'Instalación – Sistema CCTV',
      industry: 'SECURITY', equipmentType: 'CCTV', reportType: 'INSTALLATION', isSystem: true,
      sections: [
        { title: 'Planificación', items: [
          'Revisar plano de instalación aprobado',
          'Verificar cobertura y ángulos de visión',
          'Confirmar ubicación de DVR/NVR con cliente',
        ]},
        { title: 'Instalación de Cámaras', items: [
          'Instalar soportes y cámaras',
          'Tender cableado (coaxial o UTP según tipo)',
          'Conectar alimentación a cada cámara',
          'Verificar imagen de cada cámara',
        ]},
        { title: 'Instalación DVR/NVR', items: [
          'Instalar DVR/NVR en rack o gabinete',
          'Conectar todas las líneas de video',
          'Configurar fecha, hora y resolución de grabación',
          'Configurar acceso remoto',
          'Verificar grabación de todas las cámaras',
        ]},
        { title: 'Entrega al Cliente', items: [
          'Realizar prueba completa del sistema',
          'Instruir al cliente sobre uso del sistema',
          'Entregar manuales y credenciales de acceso',
        ]},
      ],
    },
    {
      name: 'Mantenimiento – Sistema CCTV',
      industry: 'SECURITY', equipmentType: 'CCTV', reportType: 'MAINTENANCE', isSystem: true,
      sections: [
        { title: 'Cámaras', items: [
          'Limpiar lentes de todas las cámaras',
          'Verificar imagen de cada cámara (enfoque y ángulo)',
          'Revisar estado de carcasas y soportes',
          'Verificar movimiento de cámaras PTZ si aplica',
        ]},
        { title: 'DVR/NVR y Grabación', items: [
          'Verificar espacio disponible en disco duro',
          'Confirmar grabación activa de todas las cámaras',
          'Revisar configuración de resolución y FPS',
          'Verificar acceso remoto',
        ]},
        { title: 'Sistema Eléctrico', items: [
          'Verificar UPS y batería de respaldo',
          'Revisar conexiones y cableado visible',
          'Medir voltaje de alimentación de cámaras',
        ]},
      ],
    },
    {
      name: 'Mantenimiento Preventivo – Vehículo',
      industry: 'AUTOMOTIVE', equipmentType: 'VEHICLE', reportType: 'MAINTENANCE', isSystem: true,
      sections: [
        { title: 'Motor', items: [
          'Cambiar aceite de motor',
          'Cambiar filtro de aceite',
          'Cambiar filtro de aire',
          'Cambiar filtro de combustible (si corresponde)',
          'Revisar nivel de líquido refrigerante',
          'Revisar nivel de líquido de frenos',
          'Revisar estado de correas',
        ]},
        { title: 'Frenos', items: [
          'Revisar espesor de pastillas delanteras',
          'Revisar espesor de pastillas traseras',
          'Verificar estado de discos',
          'Verificar funcionamiento de freno de mano',
        ]},
        { title: 'Suspensión y Neumáticos', items: [
          'Revisar estado de amortiguadores',
          'Verificar dirección y holguras',
          'Revisar estado general de neumáticos',
          'Medir presión de neumáticos',
          'Alinear y balancear si aplica',
        ]},
        { title: 'Sistema Eléctrico', items: [
          'Verificar estado de batería',
          'Revisar luces (faros, giro, freno, retroceso)',
          'Verificar funcionamiento de bocina',
          'Revisar escobillas y limpiaparabrisas',
        ]},
      ],
    },
    {
      name: 'Revisión General de Equipo Industrial',
      industry: 'INDUSTRIAL', equipmentType: 'INDUSTRIAL', reportType: 'MAINTENANCE', isSystem: true,
      sections: [
        { title: 'Inspección Visual', items: [
          'Verificar estado general del equipo',
          'Revisar estructura y chasis',
          'Verificar anclajes y soportes',
          'Revisar guardas de seguridad',
        ]},
        { title: 'Sistema Mecánico', items: [
          'Verificar alineación de ejes y poleas',
          'Revisar estado de correas y cadenas',
          'Lubricar rodamientos y partes móviles',
          'Verificar tensión de correas',
        ]},
        { title: 'Sistema Eléctrico', items: [
          'Verificar tablero de control',
          'Revisar puesta a tierra',
          'Medir voltaje de alimentación',
          'Verificar estado de cables y conexiones',
        ]},
        { title: 'Prueba Operacional', items: [
          'Arrancar equipo y verificar funcionamiento',
          'Medir temperatura de operación',
          'Verificar niveles de ruido y vibración',
          'Registrar parámetros de trabajo',
        ]},
      ],
    },
    {
      name: 'Revisión General',
      industry: 'GENERAL', equipmentType: null, reportType: 'MAINTENANCE', isSystem: true,
      sections: [
        { title: 'Inspección', items: [
          'Revisión visual general del equipo',
          'Verificar condiciones de seguridad',
          'Revisar documentación del equipo',
        ]},
        { title: 'Verificación', items: [
          'Probar funcionamiento básico',
          'Verificar parámetros de operación',
          'Registrar observaciones',
        ]},
      ],
    },
  ]

  for (const tmpl of TEMPLATES) {
    await prisma.template.create({
      data: {
        name: tmpl.name, industry: tmpl.industry, equipmentType: tmpl.equipmentType,
        reportType: tmpl.reportType, isSystem: tmpl.isSystem,
        sections: {
          create: tmpl.sections.map((sec, si) => ({
            title: sec.title, order: si,
            items: { create: sec.items.map((label, ii) => ({ label, type: 'CHECK', required: false, order: ii })) },
          })),
        },
      },
    })
  }

  console.log('\n✅ Base de datos lista!\n')
  console.log('  Credenciales:')
  console.log('  Admin   → admin@empresa.com / admin123')
  console.log('  Técnico → luis@empresa.com  / tech123\n')
  console.log('  💡 Cambia los emails en prisma/seed.js antes de entregar al cliente.\n')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
