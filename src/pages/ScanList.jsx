// 저장된 검사 이력 화면입니다. 이름·메모만 수정하고 실제 검사 결과는 변경하지 않습니다.
import { useMemo, useState } from "react";
import { severityLabel } from "../utils/severity.js";
import { selectHistory, MAX_HISTORY } from "../utils/history.js";
function HistoryItem({ record, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(record.name || "");
  const [memo, setMemo] = useState(record.memo || "");
  function edit() {
    setName(record.name || "");
    setMemo(record.memo || "");
    setEditing(true);
  }
  return (
    <li className="history-item">
      <div className="history-heading">
        <strong>{record.name || record.target}</strong>
        <span className="badge">
          {record.type === "website" ? "웹사이트" : "라이브러리"}
        </span>
      </div>
      <p>
        {record.target}
        {record.version && ` (${record.version})`}
        {record.ecosystem && ` / ${record.ecosystem}`}
      </p>
      <p>
        검사 시각: {new Date(record.scannedAt).toLocaleString("ko-KR")} ·{" "}
        {record.type === "library" ? "OSV 취약점" : "조회 IP의 연관 CVE"}{" "}
        {record.vulnerabilityCount ?? "미확인"}
        {record.vulnerabilityCount !== null && "개"}
        {record.type === "website" && ` / 관측 포트 ${record.portCount ?? "미확인"}`}
      </p>
      {!editing && record.memo && <p className="history-memo">메모: {record.memo}</p>}
      {editing ? (
        <form
          className="history-editor"
          onSubmit={(event) => {
            event.preventDefault();
            onUpdate(record.id, { name, memo });
            setEditing(false);
          }}
        >
          <label>
            기록 이름
            <input
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label>
            메모
            <textarea
              maxLength={500}
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </label>
          <small>
            이름과 메모만 수정됩니다. 검사 대상·시각·결과는 변경되지 않습니다.
          </small>
          <div>
            <button type="submit">저장</button>
            <button type="button" onClick={() => setEditing(false)}>
              취소
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={edit}
          aria-label={`${record.target} 기록 이름·메모 수정`}
        >
          이름·메모 수정
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(record.id)}
        aria-label={`${record.target} 이력 삭제`}
      >
        삭제
      </button>
      <details>
        <summary>저장된 검사 요약 보기</summary>
        {!record.snapshot ? (
          <p>이전 버전에서 저장한 이력으로 상세 요약이 없습니다.</p>
        ) : (
          <div className="saved-summary">
            <p>{record.snapshot.scope}</p>
            {record.type === "website" && <p>원본 서버 IP: 확인되지 않음</p>}
            {record.snapshot.networkError && (
              <p>DNS 오류: {record.snapshot.networkError}</p>
            )}
            {record.snapshot.ips?.map((ip) => (
              <div key={ip.ip}>
                <strong>
                  {ip.ip} ·{" "}
                  {ip.cdnStatus === "confirmed"
                    ? `${ip.provider} CDN·프록시 대역`
                    : "CDN 미확인"}
                </strong>
                <p>
                  {ip.status === "error"
                    ? `조회 실패: ${ip.error}`
                    : ip.status === "no-data"
                      ? "공개 관측 정보 없음"
                      : `이 IP의 관측 포트: ${ip.ports.join(", ") || "응답 목록 비어 있음"} · 태그: ${ip.tags.join(", ") || "없음"} · CVE: ${ip.cves.join(", ") || "응답 목록 비어 있음"}`}
                </p>
              </div>
            ))}
            {record.snapshot.skipped?.length > 0 && (
              <p>요청 제한으로 미조회: {record.snapshot.skipped.join(", ")}</p>
            )}
            {record.snapshot.observatory && (
              <p>
                Mozilla HTTP 설정:{" "}
                {record.snapshot.observatory.error ||
                  `${record.snapshot.observatory.grade || "미확인"} / ${record.snapshot.observatory.score ?? "미확인"}점`}
              </p>
            )}
            {record.snapshot.vulnerabilities?.map((vuln) => (
              <p key={vuln.id}>
                {vuln.id} · {severityLabel(vuln.severity)}
              </p>
            ))}
            <small>
              저장 용량을 위해 일부 항목과 전체 원문을 생략한 요약입니다. 최신 결과는 다시
              검사하세요.
            </small>
          </div>
        )}
      </details>
    </li>
  );
}
export default function ScanList({ history }) {
  const [filters, setFilters] = useState({
    query: "",
    type: "all",
    start: "",
    end: "",
    sort: "newest",
  });
  const filtered = useMemo(
    () => selectHistory(history.records, filters),
    [history.records, filters],
  );
  function field(key) {
    return (event) => setFilters((prev) => ({ ...prev, [key]: event.target.value }));
  }
  return (
    <section aria-labelledby="history-title">
      <h2 id="history-title">검사 이력</h2>
      <p className="source-text">
        웹사이트·라이브러리 총 {MAX_HISTORY}개 / 최대 200KiB. 한도를 넘으면 오래된
        기록부터 제외합니다. 결과는 검사 시점의 공개 정보이며 현재 상태를 보장하지
        않습니다. 이 브라우저에만 저장됩니다.
      </p>
      {history.warning && <p role="alert">{history.warning}</p>}
      <div className="history-filters">
        <label>
          도메인·패키지명 검색
          <input
            type="search"
            value={filters.query}
            onChange={field("query")}
            placeholder="이름·메모도 검색할 수 있어요"
          />
        </label>
        <label>
          검사 유형
          <select value={filters.type} onChange={field("type")}>
            <option value="all">전체</option>
            <option value="website">웹사이트</option>
            <option value="library">라이브러리</option>
          </select>
        </label>
        <label>
          시작 날짜
          <input type="date" value={filters.start} onChange={field("start")} />
        </label>
        <label>
          종료 날짜
          <input type="date" value={filters.end} onChange={field("end")} />
        </label>
        <label>
          정렬
          <select value={filters.sort} onChange={field("sort")}>
            <option value="newest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="target">대상 이름순</option>
          </select>
        </label>
      </div>
      {filters.start && filters.end && filters.start > filters.end && (
        <p role="alert">시작 날짜는 종료 날짜보다 늦을 수 없습니다.</p>
      )}
      <p role="status">
        {filtered.length}개 / 저장된 {history.records.length}개
      </p>
      {history.records.length > 0 && (
        <button type="button" onClick={history.clear}>
          이력 전체 삭제
        </button>
      )}
      {filtered.length ? (
        <ul>
          {filtered.map((record) => (
            <HistoryItem
              key={record.id}
              record={record}
              onUpdate={history.update}
              onDelete={history.remove}
            />
          ))}
        </ul>
      ) : (
        <p>조건에 맞는 검사 기록이 없습니다.</p>
      )}
    </section>
  );
}
