
import { useState } from "react";

import Mascot from "./components/Mascot.jsx";
import { MozillaExplanation, NetworkExplanation } from "./components/ScanExplanation.jsx";
import { getMozillaScan } from "./services/observatory.js";
import Icon from "./components/Icon.jsx";
import LibraryScan from "./pages/LibraryScan.jsx";

import { getIPv4Addresses } from "./services/dns.js";
import { getShodanData } from "./services/shodan.js";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [network, setNetwork] = useState(null);
  const [observatory, setObservatory] = useState(null);
  const [mozillaError, setMozillaError] = useState(null);
  const [busy, setBusy] = useState(false);
  async function run(action) {
    if (busy) return;
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  }
  const navigation = [["dashboard", "home", "대시보드"], ["website", "globe", "웹사이트 검사"], ["library", "layers", "라이브러리 검사"], ["history", "list", "검사 목록"], ["guide", "info", "서비스 안내"]];
  // 사용자 입력 및 검사 상태
  const [domain, setDomain] = useState("example.com");
  const [ips, setIps] = useState([]);
  const [status, setStatus] = useState("");

  /**
   * 사용자가 입력한 URL에서 도메인을 추출한다.
   * 프로토콜이 없는 경우 https://를 기본값으로 사용한다.
   */
  const getHostname = () => {
    const input = domain.trim();

    if (!input) {
      throw new Error("도메인을 입력해 주세요.");
    }

    const url = new URL(
      input.includes("://") ? input : `https://${input}`
    );

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname
    ) {
      throw new Error("올바른 웹사이트 URL을 입력해 주세요.");
    }

    return url.hostname;
  };

  /**
   * 1. Google DNS 단독 조회
   */
  const handleLookup = async () => {
    setStatus("DNS 조회 중...");
    setNetwork(null);
    setIps([]);

    try {
      const hostname = getHostname();
      const addresses = await getIPv4Addresses(hostname);

      setIps(addresses);

      setStatus(
        addresses.length > 0
          ? `DNS 조회 성공! IP ${addresses.length}개`
          : "조회된 IPv4 주소가 없습니다."
      );
    } catch (error) {
      console.error("DNS 조회 오류:", error);
      setStatus(`DNS 조회 실패: ${error.message}`);
    }
  };

  /**
   * 2. Shodan InternetDB 단독 조회
   * 기존 검증에서 사용했던 IP를 테스트 대상으로 사용한다.
   */
  const handleShodanTest = async () => {
    setStatus("Shodan 조회 중...");

    try {
      const ip = "172.66.147.243";
      const shodanData = await getShodanData(ip);

      if (shodanData === null) {
        setStatus("Shodan 관측 정보가 없습니다.");
        return;
      }

      const portCount = shodanData.ports?.length ?? 0;
      const vulnCount = shodanData.vulns?.length ?? 0;

      setStatus(
        `Shodan 조회 성공! ` +
          `관측 포트 ${portCount}개 / 관련 CVE ${vulnCount}개`
      );

      console.log("Shodan 결과:", shodanData);
    } catch (error) {
      console.error("Shodan 조회 오류:", error);
      setStatus(`Shodan 조회 실패: ${error.message}`);
    }
  };

  /**
   * 3. 웹사이트 통합 검사
   * 도메인 → DNS → IP → Shodan 순서로 조회한다.
   */
  const handleWebsiteScan = async () => {
    setStatus("웹사이트 검사 중...");
    setNetwork(null);
    setIps([]);

    try {
      const hostname = getHostname();

      // DNS에서 도메인에 연결된 IPv4 목록 조회
      const addresses = await getIPv4Addresses(hostname);

      if (addresses.length === 0) {
        setStatus("조회된 IPv4 주소가 없습니다.");
        return;
      }

      setIps(addresses);

      // 현재는 첫 번째 IP만 Shodan에서 조회한다.
      const selectedIp = addresses[0];
      const shodanData = await getShodanData(selectedIp);
      setNetwork({ hostname, ip: selectedIp, data: shodanData });

      if (shodanData === null) {
        setStatus(
          `DNS 조회 성공! IP: ${selectedIp} / Shodan 관측 정보 없음`
        );
        return;
      }

      // 공개 관측 정보에서 필요한 수치 추출
      const portCount = shodanData.ports?.length ?? 0;
      const vulnCount = shodanData.vulns?.length ?? 0;

      setStatus(
        `검사 성공! IP: ${selectedIp} / ` +
          `관측 포트: ${portCount}개 / ` +
          `관련 CVE: ${vulnCount}개`
      );

      console.log("웹사이트 통합 검사 결과:", {
        hostname,
        addresses,
        shodan: shodanData,
      });
    } catch (error) {
      console.error("웹사이트 검사 오류:", error);
      setStatus(`검사 실패: ${error.message}`);
    }
  };

  /**
   * 5. Mozilla HTTP Observatory 검사
   * 상세 평가 결과는 observatory.js 서비스에서 조회한다.
   */
  const handleMozillaTest = async () => {
    setStatus("Mozilla 검사 중...");
    setObservatory(null);
    setMozillaError(null);

    try {
      const hostname = getHostname();

      const data = await getMozillaScan(hostname);

      setStatus(
        `Mozilla 검사 성공! ` +
          `등급: ${data.grade ?? "없음"} / ` +
          `점수: ${data.score ?? "없음"} / ` +
          `통과: ${data.tests_passed ?? "미확인"}개 / ` +
          `실패: ${data.tests_failed ?? "미확인"}개`
      );

      setObservatory({ ...data, hostname });
      console.log("Mozilla 결과:", data);
    } catch (error) {
      setMozillaError({ message: error.message, detail: error.detail });
      console.error("Mozilla 검사 오류:", error);
      setStatus(`Mozilla 검사 실패: ${error.message}`);
    }
  };

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
        {(page === "dashboard" || page === "website") && <>
          <form className="website-search" onSubmit={(event) => { event.preventDefault(); run(handleWebsiteScan); }}>
            <Icon name="globe" /><input aria-label="검사할 웹사이트 주소" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="검사할 웹사이트 URL을 입력하세요 (예: https://example.com)" disabled={busy} required />
            <button className="primary" disabled={busy}><Icon name="search" />{busy ? "검사 중…" : "보안 검사 시작"}</button>
          </form>
          <div className="scan-status" role="status"><span className={busy ? "status-dot running" : "status-dot"} />{status || "준비 완료! 웹사이트 주소를 입력하고 검사를 시작해 보세요."}</div>
          <section className="stats-grid" aria-label="검사 결과 요약">
            <div className="stat-card blue"><span className="stat-icon"><Icon name="server" /></span><div><h2>관측된 포트</h2><strong>{network?.data ? network.data.ports?.length ?? 0 : "—"}<small>{network?.data ? "개" : "검사 대기"}</small></strong></div><Icon name="chevron" /></div>
            <div className="stat-card pink"><span className="stat-icon"><Icon name="alert" /></span><div><h2>연관된 CVE</h2><strong>{network?.data ? network.data.vulns?.length ?? 0 : "—"}<small>{network?.data ? "개" : "검사 대기"}</small></strong></div><Icon name="chevron" /></div>
            <button className="stat-card mint" disabled={busy} onClick={() => run(handleMozillaTest)}><span className="stat-icon"><Icon name="shield" /></span><div><h2>웹 보안 설정</h2><strong>{observatory?.grade ?? "—"}<small>{observatory ? `${observatory.hostname} · ${observatory.score ?? "—"}점` : "Mozilla 검사하기"}</small></strong></div><Icon name="chevron" /></button>
          </section>
          <div className="detail-grid">
            <section className="panel network-panel"><h2><Icon name="network" />네트워크 연결 정보</h2><div className="network-flow">
              <div className="flow-node"><Icon name="globe" /><strong>{network?.hostname || "웹사이트"}</strong><small>도메인</small></div><span className="flow-arrow">→</span>
              <div className="flow-node"><Icon name="server" /><strong>{ips[0] || "IP 조회 대기"}</strong><small>조회된 IP {ips.length > 0 && `· ${ips.length}개`}</small></div><span className="flow-arrow">→</span>
              <div className="flow-node"><Icon name="layers" /><strong>{network?.data?.ports?.join(", ") || "관측 정보 없음"}</strong><small>관측된 포트</small></div>
            </div><div className="friendly-note"><span>✦</span><p>{network ? "공개 관측 정보를 조회했어요. 최신 서버 상태와 다를 수 있어요." : "도메인 → IP → 공개 노출 정보를 순서대로 확인해요."}</p></div>
            {network?.data?.vulns?.length > 0 && <div className="cve-list">{network.data.vulns.map((id) => <a key={id} href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">{id} ↗</a>)}</div>}
            </section>
            <section className="panel summary-panel"><h2><Icon name="check" />검사 항목 요약</h2>
              <button className="summary-row" disabled={busy} onClick={() => run(handleMozillaTest)}><span className="tile-icon"><Icon name="globe" /></span><span><strong>웹사이트 보안 설정</strong><small>HTTP 보안 헤더, 설정 상태 확인</small></span><span className={`badge ${observatory?.tests_failed > 0 ? "warning" : observatory ? "success" : ""}`}>{observatory?.tests_failed > 0 ? `${observatory.tests_failed}개 확인 필요` : observatory ? "검사 완료" : "검사하기"}</span></button>
              <button className="summary-row" disabled={busy} onClick={() => run(handleWebsiteScan)}><span className="tile-icon"><Icon name="network" /></span><span><strong>네트워크 노출 정보</strong><small>공개 포트 및 서비스, CVE 조회</small></span><span className={`badge ${network?.data ? "success" : ""}`}>{network?.data ? "조회 완료" : "검사하기"}</span></button>
              <button className="summary-row" onClick={() => setPage("library")}><span className="tile-icon"><Icon name="box" /></span><span><strong>라이브러리 취약점</strong><small>OSV 기반 패키지 취약점 조회</small></span><span className="badge">바로가기 →</span></button>
            </section>
          </div>
          <MozillaExplanation result={observatory} error={mozillaError} />
          <NetworkExplanation network={network} ips={ips} />
          <div className="bottom-grid"><button className="promo lavender" onClick={() => setPage("library")}><Mascot color="purple" /><span><strong>라이브러리 취약점도 확인해보세요!</strong><small>패키지 이름과 버전만 입력하면 알려진 취약점을 확인할 수 있어요.</small></span><span className="pill-link">라이브러리 검사하기 →</span></button><button className="promo" onClick={() => setPage("guide")}><span className="book-icon">📚</span><span><strong>서비스 이용 가이드</strong><small>ShipSafe의 기능과 활용 방법을 확인해요.</small></span><Icon name="chevron" /></button></div>
          <details className="api-tools"><summary>API 개별 테스트</summary><div><button disabled={busy} onClick={() => run(handleLookup)}>DNS 조회</button><button disabled={busy} onClick={() => run(handleShodanTest)}>Shodan 테스트</button><button disabled={busy} onClick={() => run(handleMozillaTest)}>Mozilla 테스트</button></div></details>
        </>}
        <div className="panel library-panel" hidden={page !== "library" && page !== "history"}><LibraryScan historyOnly={page === "history"} /></div>
        {page === "guide" && <section className="panel guide"><h2>쉽게 시작하는 보안 점검</h2><p>궁금한 항목을 선택해 공개 보안 정보를 확인하세요.</p>{[["01", "웹사이트 검사", "웹사이트 주소를 입력하면 DNS로 IP를 찾고 Shodan InternetDB에서 공개 포트와 관련 CVE를 조회합니다."], ["02", "웹 보안 설정", "Mozilla 검사로 HTTP 보안 설정의 등급과 점수를 확인합니다. 웹사이트 검사 화면의 웹 보안 설정 카드를 눌러주세요."], ["03", "라이브러리 검사", "Maven, npm, PyPI 등 생태계를 선택하고 정확한 패키지명과 버전을 입력하세요. Maven은 groupId:artifactId 형식입니다."], ["04", "검사 목록", "라이브러리 검사 요약은 이 브라우저에 최대 20개 저장됩니다. 검사 목록에서 확인하거나 삭제할 수 있어요."]].map(([number,title,body]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}<div className="friendly-note">공개 데이터에 기반한 참고 정보이며, 취약점이 조회되지 않아도 안전성을 보장하지 않습니다.</div></section>}
        <footer className="page-footer">🛡 ShipSafe <span>더 쉬운 보안 점검, 더 안전한 시작.</span></footer>
      </main>
    </div>
  );
}
