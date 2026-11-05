import { useRef, useState } from "react";
import VulnerabilityCard from "../components/VulnerabilityCard.jsx";
import { getOSVVulnerabilities } from "../services/osv.js";

import { getSeverity } from "../utils/severity.js";

const ecosystems = ["Maven", "npm", "PyPI", "Go", "crates.io", "RubyGems", "NuGet", "Packagist"];

export default function LibraryScan({ onRecord }) {
  const [ecosystem, setEcosystem] = useState("Maven");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inFlight = useRef(false);

  async function handleScan(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const name = packageName.trim();
    const packageVersion = version.trim();
    setError("");
    setResult(null);
    if (!name || !packageVersion || name.length > 214 || packageVersion.length > 100) {
      setError("패키지명(214자 이하)과 버전(100자 이하)을 입력해 주세요.");
      return;
    }
    inFlight.current = true;
    setLoading(true);
    try {
      const vulnerabilities = await getOSVVulnerabilities(ecosystem, name, packageVersion);
      setResult({ ecosystem, name, version: packageVersion, vulnerabilities });
      onRecord({
        id: crypto.randomUUID(),
        type: "library",
        ecosystem,
        target: name,
        version: packageVersion,
        vulnerabilityCount: vulnerabilities.length,
        scannedAt: new Date().toISOString(),
        snapshot: { scope: "OSV 패키지·버전 일치 조회 요약", vulnerabilities: vulnerabilities.map((vuln) => ({ id: vuln.id, severity: getSeverity(vuln.database_specific?.severity) })) },
      });
    } catch (scanError) {
      setError(`OSV 조회 실패: ${scanError.message}`);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="library-scan-title">
      <h2 id="library-scan-title">라이브러리 취약점 검사</h2>
      <form onSubmit={handleScan}>
        <fieldset disabled={loading}>
          <legend>검사할 패키지</legend>
          <label>
            패키지 생태계
            <select value={ecosystem} onChange={(event) => setEcosystem(event.target.value)}>
              {ecosystems.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>{" "}
          <label>
            패키지명
            <input required value={packageName} onChange={(event) => setPackageName(event.target.value)}
              placeholder={ecosystem === "Maven" ? "org.apache.logging.log4j:log4j-core" : ecosystem === "npm" ? "lodash 또는 @scope/package" : "패키지명"} />
          </label>{" "}
          <label>
            버전
            <input required value={version} onChange={(event) => setVersion(event.target.value)} placeholder="예: 2.14.1" />
          </label>{" "}
          <button type="submit">{loading ? "검사 중..." : "라이브러리 검사"}</button>
        </fieldset>
      </form>
      <p role="status">
        {loading ? "OSV에서 알려진 취약점을 조회하고 있습니다." : result
          ? `${result.ecosystem} / ${result.name} (${result.version}) — 취약점 ${result.vulnerabilities.length}개`
          : "패키지 정보와 정확한 버전을 입력해 검사를 시작해 주세요."}
      </p>
      {error && <p role="alert">{error}</p>}
      {result && result.vulnerabilities.length === 0 && (
        <p>해당 입력에 대해 OSV에 등록된 취약점이 없습니다. 패키지 존재 여부나 안전성을 보장하지는 않습니다.</p>
      )}
      {result?.vulnerabilities.map((vuln) => <VulnerabilityCard key={vuln.id} vuln={vuln} />)}

      <p className="source-text">검사 요약은 검사 목록에 저장됩니다. 저장된 결과는 검사 시점의 정보이며 현재 상태를 보장하지 않습니다.</p>
    </section>
  );
}
