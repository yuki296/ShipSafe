// 웹사이트 검사 화면입니다. 제목·버튼·설명은 아래 JSX에서, 실제 검사 로직은 hooks/useWebsiteScan.js에서 관리합니다.
import { useEffect, useRef } from "react";
import CveLookup from "../components/CveLookup.jsx";
import useCveLookup from "../hooks/useCveLookup.js";
import Mascot from "../components/Mascot.jsx";
import Icon from "../components/Icon.jsx";
import {
  MozillaExplanation,
  NetworkExplanation,
} from "../components/ScanExplanation.jsx";
export default function WebsiteScan({ scan, setPage, active = true }) {
  const {
    domain,
    setDomain,
    network,
    observatory,
    mozillaError,
    status,
    busy,
    run,
    ips,
    summary,
  } = scan;
  const inputRef = useRef(null);
  const cveLookup = useCveLookup();
  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);
  function openCVE(id) {
    cveLookup.lookup(id);
    document
      .getElementById("cve-details")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <>
      <form
        className="website-search"
        onSubmit={(event) => {
          event.preventDefault();
          run("website");
        }}
      >
        <Icon name="globe" />
        <input
          ref={inputRef}
          aria-label="검사할 웹사이트 주소"
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          placeholder="검사할 웹사이트 주소를 입력해야 합니다"
          disabled={busy}
          required
        />
        <button className="primary" disabled={busy}>
          <Icon name="search" />
          {busy ? "검사 중…" : "보안 검사 시작"}
        </button>
      </form>
      <div className="scan-status" role="status">
        <span className={busy ? "status-dot running" : "status-dot"} />
        {status || "준비 완료! 웹사이트 주소를 입력하고 검사를 시작할 수 있습니다."}
      </div>
      <section className="stats-grid" aria-label="검사 결과 요약">
        <div className="stat-card blue">
          <span className="stat-icon">
            <Icon name="server" />
          </span>
          <div>
            <h2>관측된 포트</h2>
            <strong>
              {summary.observed ? summary.ports.length : "—"}
              <small>
                {summary.observed
                  ? "개 · 조회 IP 합집합"
                  : network
                    ? "미확인"
                    : "검사 대기"}
              </small>
            </strong>
          </div>
          <Icon name="chevron" />
        </div>
        <div className="stat-card pink">
          <span className="stat-icon">
            <Icon name="alert" />
          </span>
          <div>
            <h2>연관된 CVE</h2>
            <strong>
              {summary.observed ? summary.vulns.length : "—"}
              <small>
                {summary.observed
                  ? "개 · 조회 IP 합집합"
                  : network
                    ? "미확인"
                    : "검사 대기"}
              </small>
            </strong>
          </div>
          <Icon name="chevron" />
        </div>
        <button className="stat-card mint" disabled={busy} onClick={() => run("mozilla")}>
          <span className="stat-icon">
            <Icon name="shield" />
          </span>
          <div>
            <h2>웹 보안 설정</h2>
            <strong>
              {observatory?.grade ?? "—"}
              <small>
                {observatory
                  ? `${observatory.hostname} · ${observatory.score ?? "—"}점`
                  : "Mozilla 검사하기"}
              </small>
            </strong>
          </div>
          <Icon name="chevron" />
        </button>
      </section>
      <div className="detail-grid">
        <section className="panel network-panel">
          <h2>
            <Icon name="network" />
            네트워크 연결 정보
          </h2>
          <div className="network-flow">
            <div className="flow-node">
              <Icon name="globe" />
              <strong>{network?.hostname || "웹사이트"}</strong>
              <small>도메인</small>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-node">
              <Icon name="server" />
              <strong>
                {ips.length > 1
                  ? `${ips.length}개 DNS 응답 IP`
                  : ips[0] || "IP 조회 대기"}
              </strong>
              <small>조회된 IP {ips.length > 0 && `· ${ips.length}개`}</small>
            </div>
            <span className="flow-arrow">→</span>
            <div className="flow-node">
              <Icon name="layers" />
              <strong>
                {summary.observed
                  ? `${summary.ports.length}개 포트 · IP별 상세 참고`
                  : network
                    ? "관측 미확인"
                    : "관측 대기"}
              </strong>
              <small>DNS IP의 공개 관측</small>
            </div>
          </div>
          <div className="network-friend-note">
            <Mascot color="detective" />
            <div className="friendly-note">
              <span>✦</span>
              <p>
                {network
                  ? "공개 관측 정보를 조회했습니다. 최신 서버 상태와 다를 수 있습니다."
                  : "도메인 → IP → 공개 노출 정보를 순서대로 확인합니다."}
              </p>
            </div>
          </div>
          {network && (
            <p className="network-scope">
              CDN·프록시 대역 확인 {summary.cdn}개 · 원본 서버 IP: 확인되지 않음
              <br />
              포트·CVE는 DNS 응답 IP의 공개 관측이며 원본 서버의 진단 결과가 아닙니다.
            </p>
          )}
        </section>
        <section className="panel summary-panel">
          <h2>
            <Icon name="check" />
            검사 항목 요약
          </h2>
          <button className="summary-row" disabled={busy} onClick={() => run("mozilla")}>
            <span className="tile-icon">
              <Icon name="globe" />
            </span>
            <span>
              <strong>웹사이트 보안 설정</strong>
              <small>HTTP 보안 헤더, 설정 상태 확인</small>
            </span>
            <span
              className={`badge ${observatory?.tests_failed > 0 ? "warning" : observatory ? "success" : ""}`}
            >
              {observatory?.tests_failed > 0
                ? `${observatory.tests_failed}개 확인 필요`
                : observatory
                  ? "검사 완료"
                  : "검사하기"}
            </span>
          </button>
          <button className="summary-row" disabled={busy} onClick={() => run("website")}>
            <span className="tile-icon">
              <Icon name="network" />
            </span>
            <span>
              <strong>네트워크 노출 정보</strong>
              <small>공개 포트 및 서비스, CVE 조회</small>
            </span>
            <span
              className={`badge ${network?.error || summary.errors ? "warning" : summary.observed ? "success" : ""}`}
            >
              {network?.error
                ? "DNS 조회 실패"
                : network?.dnsOnly
                  ? "DNS만 조회"
                  : network
                    ? `${network.results.length}개 IP · ${summary.errors}개 실패`
                    : "검사하기"}
            </span>
          </button>
          <button className="summary-row" onClick={() => setPage("library")}>
            <span className="tile-icon">
              <Icon name="box" />
            </span>
            <span>
              <strong>라이브러리 취약점</strong>
              <small>OSV 기반 패키지 취약점 조회</small>
            </span>
            <span className="badge">바로가기 →</span>
          </button>
          <div className="summary-friend-note">
            <p>
              결과가 궁금하다면
              <br />
              <strong>아래 설명도 확인합니다!</strong>
            </p>
            <Mascot color="guard" />
          </div>
        </section>
      </div>
      <MozillaExplanation result={observatory} error={mozillaError} />
      <NetworkExplanation network={network} ips={ips} onCVE={openCVE} />
      <CveLookup lookup={cveLookup} />
      <div className="bottom-grid">
        <button className="promo lavender" onClick={() => setPage("library")}>
          <Mascot color="purple" />
          <span>
            <strong>라이브러리 취약점도 확인할 수 있습니다!</strong>
            <small>패키지 이름과 버전만 입력하면 알려진 취약점을 확인할 수 있습니다.</small>
          </span>
          <span className="pill-link">라이브러리 검사하기 →</span>
        </button>
        <button className="promo" onClick={() => setPage("guide")}>
          <span className="book-icon">📚</span>
          <span>
            <strong>서비스 이용 가이드</strong>
            <small>ShipSafe의 기능과 활용 방법을 확인합니다.</small>
          </span>
          <Icon name="chevron" />
        </button>
      </div>
      <details className="api-tools">
        <summary>API 개별 테스트</summary>
        <div>
          <button disabled={busy} onClick={() => run("dns")}>
            DNS 조회
          </button>
          <button disabled={busy} onClick={() => run("shodan-test")}>
            Shodan 테스트
          </button>
          <button disabled={busy} onClick={() => run("mozilla")}>
            Mozilla 테스트
          </button>
        </div>
      </details>
    </>
  );
}
