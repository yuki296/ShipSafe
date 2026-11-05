import { useState } from 'react';
import Mascot from './components/Mascot.jsx';
import Icon from './components/Icon.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LibraryScan from './pages/LibraryScan.jsx';
import ScanList from './pages/ScanList.jsx';
import Guide from './pages/Guide.jsx';
import useScanHistory from './hooks/useScanHistory.js';
import useWebsiteScan from './hooks/useWebsiteScan.js';
const navigation = [["dashboard", "home", "대시보드"], ["website", "globe", "웹사이트 검사"], ["library", "layers", "라이브러리 검사"], ["history", "list", "검사 목록"], ["guide", "info", "서비스 안내"]];
export default function App() {
  const [page, setPage] = useState('dashboard');
  const history = useScanHistory();
  const scan = useWebsiteScan(history.add);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("dashboard"); }}>
          <span className="brand-shield"><Icon name="shield" /></span><span>ShipSafe<small>Web Security Checker</small></span>
        </a>
        <nav aria-label="주 메뉴">
          {navigation.map(([id, icon, label]) => <button key={id} className={page === id ? "nav-item active" : "nav-item"} aria-current={page === id ? "page" : undefined} onClick={() => setPage(id)}><Icon name={icon} />{label}</button>)}
        </nav>
        <div className="sidebar-friend"><Mascot /><p>안전한 웹 탐험의 시작!<small>ShipSafe가 함께할게요.</small></p></div>
        <span className="sidebar-foot">PUBLIC SECURITY · SIMPLE & SAFE</span>
      </aside>
      <main className="workspace">
        <header className="hero">
          <div className="hero-copy"><span className="eyebrow">YOUR FRIENDLY SECURITY PARTNER</span><h1>{page === "dashboard" ? <>보안 점검을 더 쉽고, <em>한눈에!</em></> : navigation.find(([id]) => id === page)?.[2]}</h1><p>웹사이트, 네트워크, 라이브러리의 공개 보안 정보를<br className="desktop-break" /> 한 곳에서 확인해요.</p></div>
          <div className="hero-friends" aria-hidden="true"><span className="sparkle">✦</span><Mascot color="group" /></div>
        </header>
        {history.warning && <p className="storage-warning" role="alert">{history.warning}</p>}
        <div hidden={page !== "dashboard" && page !== "website"}><Dashboard scan={scan} setPage={setPage} active={page === "dashboard" || page === "website"} /></div>
        <div className="panel library-panel" hidden={page !== "library"}><LibraryScan onRecord={history.add} /></div>
        {page === "history" && <div className="panel library-panel"><ScanList history={history} /></div>}
        {page === "guide" && <Guide />}
        <footer className="page-footer">🛡 ShipSafe <span>더 쉬운 보안 점검, 더 안전한 시작.</span></footer>
      </main>
    </div>
  );
}
