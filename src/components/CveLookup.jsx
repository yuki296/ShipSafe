// CVE 상세 조회 화면입니다. 입력과 결과를 표시하며 실제 조회 상태와 요청은 전달받은 lookup에서 관리합니다.
import Icon from "./Icon.jsx";
import { getLibraryRisk } from "../utils/riskGuidance.js";
import { severityLabel } from "../utils/severity.js";
export default function CveLookup({ lookup }) {
  const { query, setQuery, loading, result, error, id } = lookup;
  const risk = result ? getLibraryRisk({ id: result.id }) : null;
  return (
    <section
      id="cve-details"
      className="panel explanation-panel cve-lookup"
      aria-labelledby="cve-lookup-title"
    >
      <h2 id="cve-lookup-title">
        <Icon name="alert" />
        CVE 상세 조회 <small lang="en">Vulnerability Details</small>
      </h2>
      <div className="explanation-body">
        <p>
          CVE 번호로 공개 취약점의 설명·심각도·영향 조건을 확인합니다. 아래 조회는 입력한
          사이트가 해당 취약점에 걸렸다는 진단이 아닙니다.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            lookup.lookup();
          }}
          className="cve-search"
        >
          <label htmlFor="cve-id-input">CVE 번호</label>
          <input
            id="cve-id-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="CVE-연도-번호"
            required
            maxLength={40}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? "조회 중…" : "CVE 조회"}
          </button>
        </form>
        <p role="status">
          {loading
            ? `${id} · NVD에서 공식 기록을 조회하고 있습니다.`
            : result === null
              ? `${id}에 해당하는 NVD 기록이 없습니다. 미등록·반영 지연 등의 가능성이 있습니다.`
              : result
                ? `${result.id} 조회 완료`
                : "관측된 CVE의 상세 조회를 누르거나, 알고 있는 CVE 번호를 입력하세요."}
        </p>
        {error && (
          <p role="alert" className="empty-explanation">
            {error} 조회 실패는 취약점이 없다는 뜻이 아닙니다.
            {id && (
              <>
                {" "}
                <a
                  href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  NVD 원문 열기 ↗
                </a>
              </>
            )}
          </p>
        )}
        {result && (
          <article className="cve-detail-card">
            <h3>{result.id}</h3>
            <p>
              <span
                className={`badge cve-severity severity-${result.severity.toLowerCase()}`}
              >
                {severityLabel(result.severity)} ({result.severity})
              </span>{" "}
              · CVSS {result.score ?? "미제공"}
              {result.score !== null && " / 10"} · 기록 상태: {result.status}
            </p>
            {result.status === "Rejected" ? (
              <p className="empty-explanation">
                기각된 CVE 기록입니다. 유효한 취약점 진단 근거로 사용하지 않습니다.
              </p>
            ) : (
              <>
                <p className="source-text">
                  CVSS는 취약점 자체의 심각도입니다. 현재 사이트의 위험 점수가 아닙니다.
                  출처: {result.scoreSource || "점수 미제공"}
                  {result.scoreVersion && ` / CVSS ${result.scoreVersion}`}
                </p>
                <h4>
                  취약점 설명 {result.descriptionLanguage === "en" && "(NVD 영어 원문)"}
                </h4>
                <p className="cve-description" lang={result.descriptionLanguage}>
                  {result.description}
                </p>
                {risk.source ? (
                  <div className="risk-guidance">
                    <h4>{risk.title}</h4>
                    <p>
                      <strong>영향 조건:</strong> {risk.condition}
                    </p>
                    <p>
                      <strong>잠재적 영향:</strong> {risk.impact}
                    </p>
                    <a href={risk.source} target="_blank" rel="noreferrer">
                      공식 보안 권고 ↗
                    </a>
                  </div>
                ) : (
                  <p>
                    이 항목의 구체적인 한국어 위험 설명은 아직 검토하지 않았습니다. 영어
                    원문과 공급자 권고에서 영향 기능·환경을 확인하세요.
                  </p>
                )}
                <details className="technical-details">
                  <summary>영향 제품·버전 조건 (CPE) 확인</summary>
                  <p>
                    NVD에 등록된 조건 일부입니다. 운영체제 등 추가 조건과 AND/OR 조합은
                    NVD 원문에서 확인해야 합니다. 현재 서버의 제품·버전과 자동 대조한
                    결과는 아닙니다.
                  </p>
                  {result.affected.length ? (
                    result.affected.map((item, index) => (
                      <p key={index}>
                        <code>{item.criteria}</code>
                        {item.range && (
                          <>
                            <br />
                            {item.range}
                          </>
                        )}
                      </p>
                    ))
                  ) : (
                    <p>영향 제품 조건이 제공되지 않았습니다.</p>
                  )}
                </details>
                <h4>대응 방법</h4>
                <p>
                  실제 사용하는 제품·버전·기능과 영향 조건을 비교한 뒤, 공급자가 권장하는
                  지원 중인 수정 릴리스를 적용하세요. 버전 정보를 모르면 이 CVE의 적용
                  여부를 판단할 수 없습니다.
                </p>
              </>
            )}
            <a
              className="report-link"
              href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(result.id)}`}
              target="_blank"
              rel="noreferrer"
            >
              NVD 전체 기록 ↗
            </a>
            {result.references.length > 0 && (
              <details className="technical-details">
                <summary>관련 참고 자료</summary>
                <ul>
                  {result.references.map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </article>
        )}
      </div>
    </section>
  );
}
