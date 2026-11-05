import { useRef, useState } from "react";
import VulnerabilityCard from "../components/VulnerabilityCard.jsx";
import { getOSVVulnerabilities } from "../services/osv.js";

const HISTORY_KEY = "shipsafe-history";
const ecosystems = ["Maven", "npm", "PyPI", "Go", "crates.io", "RubyGems", "NuGet", "Packagist"];

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter((record) => record && typeof record.id === "string" &&
          typeof record.target === "string" && typeof record.version === "string" &&
          Number.isInteger(record.vulnerabilityCount) && record.vulnerabilityCount >= 0 &&
          typeof record.scannedAt === "string" && Number.isFinite(Date.parse(record.scannedAt)))
      : [];
  } catch {
    return [];
  }
}

export default function LibraryScan({ historyOnly = false }) {
  const [ecosystem, setEcosystem] = useState("Maven");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [history, setHistory] = useState(loadHistory);
  const inFlight = useRef(false);

  function saveHistory(next) {
    setHistory(next);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      setStorageError("");
    } catch {
      setStorageError("이력을 브라우저에 저장하지 못했습니다. 현재 화면에서만 유지됩니다.");
    }
  }

  async function handleScan(event) {
    event.preventDefault();
    if (inFlight.current) return;
    const name = packageName.trim();
    const packageVersion = version.trim();
    setError("");
    setResult(null);
    if (!name || !packageVersion) {
      setError("패키지명과 버전을 모두 입력해 주세요.");
      return;
    }
    inFlight.current = true;
    setLoading(true);
    try {
      const vulnerabilities = await getOSVVulnerabilities(ecosystem, name, packageVersion);
      setResult({ ecosystem, name, version: packageVersion, vulnerabilities });
      saveHistory([{
        id: crypto.randomUUID(),
        type: "library",
        ecosystem,
        target: name,
        version: packageVersion,
        vulnerabilityCount: vulnerabilities.length,
        scannedAt: new Date().toISOString(),
      }, ...history].slice(0, 20));
    } catch (scanError) {
      setError(`OSV 조회 실패: ${scanError.message}`);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  return (
    <section aria-labelledby="library-scan-title">
      <h2 id="library-scan-title">{historyOnly ? "라이브러리 검사 이력" : "라이브러리 취약점 검사"}</h2>
      {!historyOnly && <>
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

      </>}
      <h3>최근 검사 이력 (최대 20개)</h3>
      {storageError && <p role="alert">{storageError}</p>}
      {history.length === 0 ? <p>저장된 검사 기록이 없습니다.</p> : (
        <>
          <button type="button" disabled={loading} onClick={() => saveHistory([])}>이력 전체 삭제</button>
          <ul>
            {history.map((record) => (
              <li key={record.id}>
                <strong>{record.target}</strong> ({record.version})
                {record.ecosystem && ` / ${record.ecosystem}`}
                {` — 취약점 ${record.vulnerabilityCount}개 — `}
                {new Date(record.scannedAt).toLocaleString("ko-KR")}{" "}
                <button type="button" disabled={loading} aria-label={`${record.target} ${record.version} 이력 삭제`}
                  onClick={() => saveHistory(history.filter((item) => item.id !== record.id))}>삭제</button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
