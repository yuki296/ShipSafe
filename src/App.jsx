import { useState } from 'react';
import Mascot from './components/Mascot.jsx';
import Icon from './components/Icon.jsx';
import WebsiteScan from './pages/WebsiteScan.jsx';
import LibraryScan from './pages/LibraryScan.jsx';
import ScanList from './pages/ScanList.jsx';
import TargetList from './pages/TargetList.jsx';
import useScanTargets from './hooks/useScanTargets.js';
import Guide from './pages/Guide.jsx';
import useScanHistory from './hooks/useScanHistory.js';
import useWebsiteScan from './hooks/useWebsiteScan.js';
const navigation = [["website", "globe", "웹사이트 검사"], ["library", "layers", "라이브러리 검사"], ["history", "list", "검사 목록"], ["guide", "info", "서비스 안내"]];
export default function App() {
  const [page, setPage] = useState('website');
  const targets = useScanTargets();
  const [listTab, setListTab] = useState('targets');
  const [libraryTarget, setLibraryTarget] = useState(null);
  const history = useScanHistory();
  const scan = useWebsiteScan(history.add);
  function openTarget(target) {
    if (target.type === 'website') { scan.setDomain(target.url); setPage('website'); }
    else { setLibraryTarget({ ...target, requestId: crypto.randomUUID() }); setPage('library'); }
  }
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage("website"); }}>
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
          <div className="hero-copy"><span className="eyebrow">YOUR FRIENDLY SECURITY PARTNER</span><h1>{navigation.find(([id]) => id === page)?.[2]}</h1><p>웹사이트, 네트워크, 라이브러리의 공개 보안 정보를<br className="desktop-break" /> 한 곳에서 확인해요.</p></div>
          <div className="hero-friends" aria-hidden="true"><span className="sparkle">✦</span><Mascot color="group" /></div>
        </header>
        {history.warning && <p className="storage-warning" role="alert">{history.warning}</p>}
        <div hidden={page !== "website"}><WebsiteScan scan={scan} setPage={setPage} active={page === "website"} /></div>
        <div className="panel library-panel" hidden={page !== "library"}><LibraryScan key={libraryTarget?.requestId || "manual"} onRecord={history.add} initialTarget={libraryTarget} /></div>
        {page === "history" && <div className="panel library-panel">
          <div className="list-switch" role="group" aria-label="목록 종류">
            <button type="button" aria-pressed={listTab === 'targets'} onClick={() => setListTab('targets')}>검사 대상 ({targets.records.length})</button>
            <button type="button" aria-pressed={listTab === 'history'} onClick={() => setListTab('history')}>검사 이력 ({history.records.length})</button>
          </div>
          {listTab === 'targets' ? <TargetList targets={targets} onOpen={openTarget} /> : <ScanList history={history} />}
        </div>}
        {page === "guide" && <Guide />}
        <footer className="page-footer">🛡 ShipSafe <span>더 쉬운 보안 점검, 더 안전한 시작.</span></footer>
      </main>
    </div>
  );
}
