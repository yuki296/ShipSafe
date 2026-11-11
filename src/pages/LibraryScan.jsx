// 라이브러리 입력과 결과 화면입니다. 아래는 상태 → 검사 함수 → 화면 JSX 순서로 구성되어 있습니다.
import { useRef, useState } from "react";
import VulnerabilityCard from "../components/VulnerabilityCard.jsx";
import { getOSVVulnerabilities } from "../services/osv.js";

import { getSeverity } from "../utils/severity.js";

const ecosystems = [
  "Maven",
  "npm",
  "PyPI",
  "Go",
  "crates.io",
  "RubyGems",
  "NuGet",
  "Packagist",
];

export default function LibraryScan({ onRecord, initialTarget = null }) {
  // 입력값: 다른 검사 대상을 불러온 경우 해당 값을 처음 입력창에 표시합니다.
  const [ecosystem, setEcosystem] = useState(initialTarget?.ecosystem || "Maven");
  const [packageName, setPackageName] = useState(initialTarget?.packageName || "");
  const [version, setVersion] = useState(initialTarget?.version || "");
  // 결과·로딩·오류는 화면에 반영되는 상태이고, inFlight는 중복 요청을 막는 잠금 값입니다.
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function handleScan(event) {
    // 1. 새로고침을 막고, 진행 중인 요청이 있으면 이번 제출을 무시합니다.
    event.preventDefault();
    if (inFlight.current) return;
    // 2. 앞뒤 공백을 제거한 뒤 빈 값과 길이를 검사합니다.
    const name = packageName.trim();
    const packageVersion = version.trim();
    setError("");
    setResult(null);
    if (!name || !packageVersion || name.length > 214 || packageVersion.length > 100) {
      setError("패키지명(214자 이하)과 버전(100자 이하)을 입력해야 합니다.");
      return;
    }
    inFlight.current = true;
    setLoading(true);
    try {
      // 3. OSV에 조회합니다. 실제 API 주소와 통신 처리는 services/osv.js에 있습니다.
      const vulnerabilities = await getOSVVulnerabilities(
        ecosystem,
        name,
        packageVersion,
      );
      setResult({ ecosystem, name, version: packageVersion, vulnerabilities });
      // 4. 화면 결과와 별도로 검사 요약을 공통 이력 관리 기능에 전달합니다.
      onRecord({
        id: crypto.randomUUID(),
        type: "library",
        ecosystem,
        target: name,
        version: packageVersion,
        vulnerabilityCount: vulnerabilities.length,
        scannedAt: new Date().toISOString(),
        snapshot: {
          scope: "OSV 패키지·버전 일치 조회 요약",
          vulnerabilities: vulnerabilities.map((vuln) => ({
            id: vuln.id,
            severity: getSeverity(vuln.database_specific?.severity),
          })),
        },
      });
    } catch (scanError) {
      setError(`OSV 조회 실패: ${scanError.message}`);
    } finally {
      // 성공·실패 모두 입력창과 버튼을 다시 사용할 수 있도록 잠금을 해제합니다.
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="library-scan-title">
      <h2 id="library-scan-title">라이브러리 취약점 검사</h2>
      {initialTarget && (
        <p className="source-text">
          ‘{initialTarget.name}’ 대상을 불러왔습니다. 입력값을 확인하고 라이브러리 검사
          버튼을 누르면 검사를 시작합니다.
        </p>
      )}
      {/* 입력창 이름·입력 예시·버튼 문구는 이 폼에서 수정합니다. */}
      <form onSubmit={handleScan}>
        <fieldset disabled={loading}>
          <legend>검사할 패키지</legend>
          <label>
            패키지 생태계
            <select
              value={ecosystem}
              onChange={(event) => setEcosystem(event.target.value)}
            >
              {ecosystems.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>{" "}
          <label>
            패키지명
            <input
              required
              value={packageName}
              onChange={(event) => setPackageName(event.target.value)}
              placeholder={
                ecosystem === "Maven"
                  ? "org.apache.logging.log4j:log4j-core"
                  : ecosystem === "npm"
                    ? "lodash 또는 @scope/package"
                    : "패키지명"
              }
            />
          </label>{" "}
          <label>
            버전
            <input
              required
              value={version}
              onChange={(event) => setVersion(event.target.value)}
              placeholder="예: 2.14.1"
            />
          </label>{" "}
          <button type="submit">{loading ? "검사 중..." : "라이브러리 검사"}</button>
        </fieldset>
      </form>
      {/* 상태에 따라 로딩 안내, 조회 대상과 건수, 시작 안내 중 하나를 표시합니다. */}
      <p role="status">
        {loading
          ? "OSV에서 알려진 취약점을 조회하고 있습니다."
          : result
            ? `${result.ecosystem} / ${result.name} (${result.version}) — 취약점 ${result.vulnerabilities.length}개`
            : "패키지 정보와 정확한 버전을 입력해 검사를 시작해야 합니다."}
      </p>
      {error && <p role="alert">{error}</p>}
      {result && result.vulnerabilities.length === 0 && (
        <p>
          해당 입력에 대해 OSV에 등록된 취약점이 없습니다.
          <br />
          패키지 존재 여부나 안전성을 보장하지는 않습니다.
        </p>
      )}
      {result?.vulnerabilities.map((vuln) => (
        <VulnerabilityCard key={vuln.id} vuln={vuln} />
      ))}

      <p className="source-text">
        검사 요약은 검사 목록에 저장됩니다.
        <br />
        저장된 결과는 검사 시점의 정보이며 현재 상태를 보장하지 않습니다.
      </p>
    </section>
  );
}
