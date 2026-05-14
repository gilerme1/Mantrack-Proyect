import React, { Suspense, lazy, useState, useEffect } from 'react'
import Sidebar      from './components/Sidebar.jsx'
import Topbar       from './components/Topbar.jsx'
import MobileTopbar from './components/MobileTopbar.jsx'
import MobileNav    from './components/MobileNav.jsx'
import PWABanner    from './components/PWABanner.jsx'
import Login        from './pages/Login.jsx'
import useIsMobile   from './hooks/useIsMobile.js'
import { getToken, setToken, auth as authAPI } from './lib/api.js'
import { BrandingContext, loadBranding, saveBranding } from './lib/branding.js'

const Dashboard  = lazy(() => import('./pages/Dashboard.jsx'))
const MobileHome = lazy(() => import('./pages/MobileHome.jsx'))
const Clients    = lazy(() => import('./pages/Clients.jsx'))
const Equipment  = lazy(() => import('./pages/Equipment.jsx'))
const Reports    = lazy(() => import('./pages/Reports.jsx'))
const QRPage     = lazy(() => import('./pages/QRPage.jsx'))
const Settings   = lazy(() => import('./pages/Settings.jsx'))
const QRFieldView = lazy(() => import('./pages/QRFieldView.jsx'))

export const ThemeContext = React.createContext({ theme: 'dark', toggleTheme: () => {} })

// Detect deep-links on first load
function detectDeepLink() {
  const path = window.location.pathname
  // /equipo/:id  → existing equipment (legacy QR)
  const equipMatch = path.match(/^\/equipo\/([^/]+)$/)
  if (equipMatch) {
    window.history.replaceState(null, '', '/')
    return { type: 'equipo', id: equipMatch[1] }
  }
  // /qr/:id  → open QR (may be unassigned)
  const qrMatch = path.match(/^\/qr\/([^/]+)$/)
  if (qrMatch) {
    window.history.replaceState(null, '', '/')
    return { type: 'qr', id: qrMatch[1] }
  }
  return null
}

export default function App() {
  const [user,                  setUser]                  = useState(null)
  const [authChecked,           setAuthChecked]           = useState(false)
  const [active,                setActive]                = useState('dashboard')
  const [navHistory,            setNavHistory]            = useState([])
  const [collapsed,             setCollapsed]             = useState(false)
  const [mobileSidebar,         setMobileSidebar]         = useState(false)
  const [selectedClient,        setSelectedClient]        = useState(null)
  const [selectedEquip,         setSelectedEquip]         = useState(null)
  const [equipmentStatusFilter, setEquipmentStatusFilter] = useState('all')
  const [autoOpenEquipId,       setAutoOpenEquipId]       = useState(null)
  const [autoOpenReportId,      setAutoOpenReportId]      = useState(null)
  const [autoOpenClientId,      setAutoOpenClientId]      = useState(null)
  const [reportDateFilter,      setReportDateFilter]      = useState(null)
  const [theme,                 setTheme]                 = useState(() => localStorage.getItem('theme') || 'dark')
  const [branding,              setBrandingState]         = useState(loadBranding)
  // Deep-link: { type: 'equipo'|'qr', id } from scanned QR
  const [deepLink,              setDeepLink]              = useState(() => detectDeepLink())

  const isMobile = useIsMobile()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  const setBranding = (data) => { saveBranding(data); setBrandingState(data) }

  useEffect(() => {
    const t = getToken()
    if (t) { authAPI.me().then(setUser).catch(() => setToken(null)).finally(() => setAuthChecked(true)) }
    else setAuthChecked(true)
  }, [])

  // After auth, honour deep link
  useEffect(() => {
    if (!user || !deepLink) return
    if (deepLink.type === 'equipo') setActive('equipment')
    if (deepLink.type === 'qr')     setActive('qr-field')
  }, [user, deepLink])

  useEffect(() => {
    if (!user) return
    const warmRoutes = () => {
      import('./pages/Dashboard.jsx')
      import('./pages/MobileHome.jsx')
      import('./pages/Clients.jsx')
      import('./pages/Equipment.jsx')
      import('./pages/Reports.jsx')
      import('./pages/QRPage.jsx')
      import('./pages/Settings.jsx')
      import('./pages/QRFieldView.jsx')
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warmRoutes, { timeout: 2500 })
      return () => window.cancelIdleCallback?.(id)
    }
    const id = window.setTimeout(warmRoutes, 1200)
    return () => window.clearTimeout(id)
  }, [user])

  const navigate = (p, filter = 'all', options = {}) => {
    if (p !== active && !options.replace) {
      setNavHistory(history => [...history, { page: active, equipmentStatusFilter, reportDateFilter }].slice(-24))
    }
    setActive(p)
    setMobileSidebar(false)
    if (p === 'equipment') setEquipmentStatusFilter(filter)
    if (p === 'reports') setReportDateFilter(options.dateRange || null)
  }
  const goBack = () => {
    const previous = navHistory[navHistory.length - 1]
    if (!previous) return
    setNavHistory(history => history.slice(0, -1))
    setActive(previous.page)
    setMobileSidebar(false)
    if (previous.page === 'equipment') setEquipmentStatusFilter(previous.equipmentStatusFilter || 'all')
    if (previous.page === 'reports') setReportDateFilter(previous.reportDateFilter || null)
  }
  const goHomeFromBreadcrumb = () => {
    if (active === 'dashboard') return
    navigate('dashboard')
  }
  const openEquipmentFromDashboard = (id) => {
    setAutoOpenEquipId(id)
    navigate('equipment')
  }
  const openReportFromDashboard = (id) => {
    setAutoOpenReportId(id)
    navigate('reports')
  }
  const openReportsForMonth = (dateRange) => {
    navigate('reports', 'all', { dateRange })
  }
  const handleGlobalSearchSelect = (item) => {
    if (item.type === 'client') {
      setAutoOpenClientId(item.id)
      navigate('clients')
    } else if (item.type === 'equipment') {
      setAutoOpenEquipId(item.id)
      navigate('equipment')
    } else if (item.type === 'report') {
      setAutoOpenReportId(item.id)
      navigate('reports')
    }
  }
  const handleLogout = () => { setToken(null); setUser(null) }

  const meta = {
    dashboard:  { title: 'Dashboard',      breadcrumb: [branding.appName, 'Dashboard']      },
    clients:    { title: 'Clientes',        breadcrumb: [branding.appName, 'Clientes']       },
    equipment:  { title: 'Equipos',         breadcrumb: [branding.appName, 'Equipos']        },
    reports:    { title: 'Reportes',        breadcrumb: [branding.appName, 'Reportes']       },
    qr:         { title: 'Códigos QR',      breadcrumb: [branding.appName, 'QR']             },
    'qr-field': { title: 'Escaneo de campo',breadcrumb: [branding.appName, 'QR Field']      },
    settings:   { title: 'Configuración',   breadcrumb: [branding.appName, 'Configuración']  },
  }

  const spinner = (
    <div style={{ height:'100dvh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)' }}>
      <div className="spin" style={{ width:32,height:32,border:'3px solid var(--border)',borderTopColor:'var(--accent)',borderRadius:'50%' }} />
    </div>
  )

  const pageContent = (
    <>
      {active === 'dashboard' && (isMobile
        ? <MobileHome setActive={navigate} user={user} />
        : <Dashboard
            setActive={navigate}
            onOpenEquipment={openEquipmentFromDashboard}
            onOpenReport={openReportFromDashboard}
            onOpenReportMonth={openReportsForMonth}
          />
      )}
      {active === 'clients'   && (
        <Clients
          setActive={navigate}
          setSelectedClient={setSelectedClient}
          autoOpenClientId={autoOpenClientId}
          onAutoOpenHandled={() => setAutoOpenClientId(null)}
        />
      )}
      {active === 'equipment' && (
        <Equipment
          selectedClient={selectedClient}
          setActive={navigate}
          setSelectedEquip={setSelectedEquip}
          onClearSelectedClient={() => setSelectedClient(null)}
          initialStatusFilter={equipmentStatusFilter}
          autoOpenEquipId={autoOpenEquipId || (deepLink?.type === 'equipo' ? deepLink.id : null)}
          onDeepLinkHandled={() => {
            setAutoOpenEquipId(null)
            setDeepLink(null)
          }}
        />
      )}
      {active === 'reports'    && (
        <Reports
          autoOpenReportId={autoOpenReportId}
          initialDateRange={reportDateFilter}
          onDateRangeChange={setReportDateFilter}
          onAutoOpenHandled={() => setAutoOpenReportId(null)}
        />
      )}
      {active === 'qr'         && (
        <QRPage
          onOpenEquipment={(id) => {
            setAutoOpenEquipId(id)
            navigate('equipment')
          }}
        />
      )}
      {active === 'qr-field'   && (
        <QRFieldView
          qrId={deepLink?.type === 'qr' ? deepLink.id : null}
          setActive={navigate}
        />
      )}
      {active === 'settings'   && <Settings />}
    </>
  )

  const pageFallback = (
    <div style={{ minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spin" style={{ width: 26, height: 26, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%' }} />
    </div>
  )

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <BrandingContext.Provider value={{ branding, setBranding }}>
        {!authChecked ? spinner : !user ? (
          <Login onLogin={setUser} />
        ) : isMobile ? (
          /* ── Mobile layout ── */
          <div style={{ display:'flex', flexDirection:'column', height:'100dvh', overflow:'hidden' }}>
            <MobileTopbar active={active} user={user} onLogout={handleLogout} />
            <main style={{ flex:1, overflowY:'auto', paddingBottom: 64 }} className="animate-up">
              <Suspense fallback={pageFallback}>{pageContent}</Suspense>
            </main>
            <MobileNav active={active} setActive={navigate} />
            <PWABanner />
          </div>
        ) : (
          /* ── Desktop layout ── */
          <div style={{ display:'flex', height:'100dvh', overflow:'hidden' }}>
            {mobileSidebar && (
              <div
                onClick={() => setMobileSidebar(false)}
                style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.6)',zIndex:20,backdropFilter:'blur(2px)' }}
              />
            )}
            <div style={{ position: mobileSidebar ? 'fixed' : 'relative', left:0, top:0, bottom:0, zIndex: mobileSidebar ? 25 : undefined }}>
              <Sidebar active={active} setActive={navigate} collapsed={collapsed} />
            </div>
            <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
              <Topbar
                title={meta[active]?.title}
                breadcrumb={meta[active]?.breadcrumb}
                onMenuClick={() => setMobileSidebar(true)}
                user={user}
                onLogout={handleLogout}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                onGlobalSearchSelect={handleGlobalSearchSelect}
                canGoBack={navHistory.length > 0}
                onBack={goBack}
                onBreadcrumbHome={goHomeFromBreadcrumb}
              />
              <main style={{ flex:1, overflowY:'auto' }}>
                <Suspense fallback={pageFallback}>{pageContent}</Suspense>
              </main>
            </div>
            <PWABanner />
          </div>
        )}
      </BrandingContext.Provider>
    </ThemeContext.Provider>
  )
}
