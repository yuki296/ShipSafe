// 검사 전 임시 대상 목록입니다. 폼 입력·수정·삭제·검색을 처리하며 새로고침하면 목록이 초기화됩니다.
import { useMemo, useState } from "react";
import { ECOSYSTEMS, MAX_TARGETS, searchTargets } from "../utils/targets.js";
const blank = {
  name: "",
  type: "website",
  url: "",
  ecosystem: "Maven",
  packageName: "",
  version: "",
};
export default function TargetList({ targets, onOpen }) {
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const filtered = useMemo(
    () => searchTargets(targets.records, query, type),
    [targets.records, query, type],
  );
  function change(key) {
    return (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));
  }
  function reset() {
    setForm(blank);
    setEditing(null);
    setError("");
  }
  function submit(event) {
    event.preventDefault();
    try {
      if (editing) targets.update(editing, form);
      else targets.add(form);
      setMessage(editing ? "검사 대상을 수정했습니다." : "검사 대상을 추가했습니다.");
      reset();
    } catch (err) {
      setError(err.message);
    }
  }
  function edit(record) {
    setForm({ ...blank, ...record });
    setEditing(record.id);
    setError("");
    setMessage("");
  }
  function remove(record) {
    targets.remove(record.id);
    if (editing === record.id) reset();
    setMessage(`${record.name} 대상을 삭제했습니다.`);
  }
  return (
    <section aria-labelledby="target-list-title">
      <h2 id="target-list-title">검사 대상 관리</h2>
      <p className="source-text">
        검사할 대상을 미리 등록하는 임시 목록입니다. 최대 {MAX_TARGETS}개이며,
        새로고침하면 초기화됩니다. 검사 결과 이력과 별도로 관리합니다.
      </p>
      <form className="history-editor target-editor" onSubmit={submit}>
        <h3>{editing ? "검사 대상 수정" : "새 검사 대상 추가"}</h3>
        <div className="target-form-grid">
          <label>
            대상 이름
            <input
              required
              maxLength={80}
              value={form.name}
              onChange={change("name")}
              placeholder="목록에서 구분할 이름"
            />
          </label>
          <label>
            대상 검사 유형
            <select value={form.type} onChange={change("type")}>
              <option value="website">웹사이트</option>
              <option value="library">라이브러리</option>
            </select>
          </label>
          {form.type === "website" ? (
            <label className="target-full-width">
              웹사이트 URL
              <input
                required
                maxLength={2048}
                value={form.url}
                onChange={change("url")}
                placeholder="검사할 웹사이트 주소"
              />
            </label>
          ) : (
            <>
              <label>
                패키지 생태계
                <select value={form.ecosystem} onChange={change("ecosystem")}>
                  {ECOSYSTEMS.map((ecosystem) => (
                    <option key={ecosystem}>{ecosystem}</option>
                  ))}
                </select>
              </label>
              <label>
                패키지명
                <input
                  required
                  maxLength={214}
                  value={form.packageName}
                  onChange={change("packageName")}
                />
              </label>
              <label>
                패키지 버전
                <input
                  required
                  maxLength={100}
                  value={form.version}
                  onChange={change("version")}
                />
              </label>
            </>
          )}
        </div>
        {error && <p role="alert">{error}</p>}
        <div className="target-actions">
          <button type="submit">{editing ? "수정 저장" : "대상 추가"}</button>
          {editing && (
            <button type="button" onClick={reset}>
              수정 취소
            </button>
          )}
        </div>
      </form>
      <div className="history-filters">
        <label>
          대상 이름·주소 검색
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="도메인·패키지명도 검색 가능"
          />
        </label>
        <label>
          대상 유형 필터
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">전체</option>
            <option value="website">웹사이트</option>
            <option value="library">라이브러리</option>
          </select>
        </label>
      </div>
      <p role="status">
        {message && <>{message} </>}
        {filtered.length}개 / 등록된 {targets.records.length}개
      </p>
      {filtered.length ? (
        <ul className="target-list">
          {filtered.map((record) => (
            <li key={record.id}>
              <div className="history-heading">
                <strong>{record.name}</strong>
                <span className="badge">
                  {record.type === "website" ? "웹사이트" : "라이브러리"}
                </span>
              </div>
              <p>
                {record.type === "website"
                  ? record.url
                  : `${record.ecosystem} / ${record.packageName} (${record.version})`}
              </p>
              <div className="target-actions">
                <button
                  type="button"
                  onClick={() => onOpen(record)}
                  aria-label={`${record.name} 검사 화면 열기`}
                >
                  검사 화면 열기
                </button>
                <button
                  type="button"
                  onClick={() => edit(record)}
                  aria-label={`${record.name} 대상 수정`}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => remove(record)}
                  aria-label={`${record.name} 대상 삭제`}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>
          {targets.records.length
            ? "검색 조건에 맞는 검사 대상이 없습니다."
            : "등록된 검사 대상이 없습니다. 위에서 추가해 주세요."}
        </p>
      )}
    </section>
  );
}
