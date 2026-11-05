import { getHttpRisk } from "../utils/riskGuidance.js";
import Icon from "./Icon.jsx";
import IPResultCard from "./IPResultCard.jsx";

const topics = {
  "content-security-policy": ["콘텐츠 보안 정책 (CSP)", "사이트가 허용한 곳의 코드·이미지만 불러오도록 정하는 규칙이에요.", "사이트 관리자에게 필요한 코드·이미지의 출처만 허용하도록 요청하세요.", "콘텐츠 보안 정책 · CSP", "Content Security Policy"],
  redirection: ["HTTPS 리디렉션", "http://로 들어와도 https://로 자동 이동하는지 확인해요.", "http:// 접속을 같은 사이트의 https:// 주소로 자동 이동시키세요.", "HTTP → HTTPS 이동", "HTTPS Redirection"],
  "strict-transport-security": ["HTTP 엄격 전송 보안 (HSTS)", "브라우저가 이 사이트에 다시 올 때도 https://만 쓰도록 알려주는 설정이에요.", "HTTPS가 잘 작동하는지 확인한 뒤, 브라우저가 계속 HTTPS를 쓰도록 서버에 설정하세요.", "HTTPS 강제 연결 · HSTS", "HTTP Strict Transport Security"],
  "x-frame-options": ["클릭재킹 방지", "다른 사이트가 내 사이트 화면을 끼워 넣어 사용자를 속이지 못하게 해요.", "내 사이트를 다른 사이트 안에 넣어 보여줄 수 있는 범위를 제한하세요.", "클릭 가로채기 방지 · X-Frame-Options / frame-ancestors", "Clickjacking Protection"],
  "x-content-type-options": ["MIME 타입 스니핑 방지", "예를 들어 글 파일을 실행 코드로 잘못 읽지 않도록 브라우저에 알려주는 설정이에요.", "서버가 파일 종류를 정확히 알려주고, 브라우저가 다른 종류로 추측하지 못하게 설정하세요.", "파일 형식 추측 방지 · X-Content-Type-Options: nosniff", "MIME Sniffing Protection"],
  cookies: ["쿠키 보안", "쿠키는 로그인 상태 등을 기억하는 작은 정보예요. 안전하게 전달·사용되는지 확인해요.", "로그인 쿠키의 암호화 전송, 코드 접근 제한, 다른 사이트 요청에 붙는 범위를 확인하세요.", "쿠키 · Secure / HttpOnly / SameSite", "Cookie Security"],
  "cross-origin-resource-sharing": ["교차 출처 리소스 공유 (CORS)", "다른 사이트에 어떤 응답을 보여줘도 되는지 정하는 규칙이에요.", "로그인 정보가 필요한 응답은 신뢰하는 사이트에서만 읽을 수 있게 제한하세요.", "출처 간 응답 공유 · CORS", "Cross-Origin Resource Sharing"],
  "referrer-policy": ["리퍼러 정책", "링크를 눌러 다른 사이트로 갈 때, 출발한 페이지 주소가 얼마나 전달되는지 확인해요.", "다른 사이트에 전달할 주소 정보의 범위를 줄이세요.", "이전 페이지 주소 전달 정책 · Referrer-Policy", "Referrer Policy"],
  "subresource-integrity": ["하위 리소스 무결성 (SRI)", "다른 곳에서 가져온 코드·디자인 파일이 원래 파일과 같은지 확인하는 장치예요.", "외부 파일을 쓴다면 원래 파일과 같은지 확인할 검증 값을 함께 설정하세요.", "외부 파일 무결성 · SRI / integrity", "Subresource Integrity"],
  "cross-origin-resource-policy": ["교차 출처 리소스 정책 (CORP)", "이미지 같은 파일을 다른 사이트에서도 불러올 수 있게 할지 정하는 설정이에요.", "공유가 필요한 파일과 내 사이트에서만 쓸 파일을 구분하세요.", "자원 공유 범위 · CORP", "Cross-Origin Resource Policy"],
  "cross-origin-opener-policy": ["교차 출처 오프너 정책 (COOP)", "내 사이트와 다른 사이트의 창이 서로 연결되는 범위를 정하는 추가 설정이에요.", "로그인 팝업 등이 제대로 작동하는지 확인하며 필요한 창 분리를 검토하세요.", "창 사이 격리 · COOP", "Cross-Origin Opener Policy"],
  "cross-origin-embedder-policy": ["교차 출처 임베더 정책 (COEP)", "외부 파일을 가져올 때 상대 사이트의 허용도 확인하도록 하는 추가 설정이에요.", "외부 파일을 사용하는 방식에 맞춰 이 추가 보호가 필요한지 검토하세요.", "외부 콘텐츠 포함 정책 · COEP", "Cross-Origin Embedder Policy"],
};

const reasons = {
  "csp-not-implemented": "허용한 코드만 불러오게 하는 규칙을 찾지 못했어요.",
  "csp-not-implemented-but-reporting-enabled": "규칙을 어겼을 때 기록만 남기고, 실제로 막지는 않아요.",
  "csp-header-invalid": "보호 규칙의 작성 방식에 문제가 있어 읽지 못했어요.",
  "csp-implemented-with-unsafe-inline": "보호 규칙은 있지만, 코드 실행을 넓게 허용하고 있어요.",
  "csp-implemented-with-unsafe-eval": "문자열을 코드처럼 실행하는 기능 등이 허용돼 있어요.",
  "hsts-not-implemented": "다음 방문에도 HTTPS만 쓰라는 안내를 찾지 못했어요.",
  "hsts-header-invalid": "HTTPS를 계속 쓰라는 안내를 정상적으로 읽지 못했어요.",
  "hsts-implemented-max-age-less-than-six-months": "HTTPS를 기억하는 기간이 Mozilla 권장 기준보다 짧아요.",
  "x-content-type-options-not-implemented": "파일 종류를 바꿔 추측하지 말라는 설정을 찾지 못했어요.",
  "x-frame-options-not-implemented": "다른 사이트 안에 이 화면을 넣지 못하게 하는 보호를 찾지 못했어요.",
  "cookies-not-found": "검사한 응답에서 쿠키를 찾지 못했어요. 쿠키가 안전한지는 판단하지 않았어요.",
  "referrer-policy-not-implemented": "주소 전달 범위를 정하는 설정을 찾지 못했어요. 이것만으로 문제라고 판단하지는 않아요.",
  "cross-origin-resource-sharing-not-implemented": "다른 사이트가 응답을 읽게 하는 별도 허용을 찾지 못했어요. 보통은 정상일 수 있어요.",
  "redirection-to-https": "HTTP로 들어오면 같은 사이트의 HTTPS로 이동하고, 마지막 주소도 HTTPS예요.",
  "redirection-missing": "HTTP로 접속했을 때 HTTPS로 자동 이동하지 않았어요.",
  "redirection-not-to-https": "자동 이동한 마지막 주소가 HTTPS가 아니에요.",
  "redirection-invalid-cert": "주소를 이동하는 중에 유효하지 않은 인증서가 발견됐어요.",
  "coep-not-implemented": "이 추가 보호 설정은 없어요. Mozilla는 이 항목에 감점을 주지 않았어요. 설정이 있다는 뜻은 아니에요.",
  "coop-not-implemented": "이 추가 보호 설정은 없어요. Mozilla는 이 항목에 감점을 주지 않았어요. 설정이 있다는 뜻은 아니에요.",
};

// 외부 API의 HTML 설명은 실행하지 않고 일반 텍스트로만 표시한다.
function plainText(value) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim() : "";
}

export function MozillaExplanation({ result, error }) {
  if (!result && !error) return null;
  const tests = Object.entries(result?.tests || {}).filter(([, test]) => test && typeof test === "object")
    .sort(([, a], [, b]) => (a.score_modifier ?? 0) - (b.score_modifier ?? 0));
  return <section className="panel explanation-panel" aria-labelledby="mozilla-reason-title">
    <h2 id="mozilla-reason-title"><Icon name="shield" />Mozilla · 왜 이 결과가 나왔나요?</h2>
    {error ? <div className="explanation-body" role="alert"><h3>검사를 완료하지 못했어요</h3><p>{error.message}</p>{error.detail && <p className="source-text">응답 근거: {String(error.detail)}</p>}<p>연결 실패는 보안 등급이 낮다는 뜻이 아닙니다. 등급을 판단할 결과가 없는 상태입니다.</p></div> : <div className="explanation-body">
      <div className="reason-overview"><strong className="grade-display">{result.grade ?? "—"}</strong><div><h3>{result.hostname} · {result.score ?? "미확인"}점</h3><p>통과 {result.tests_passed ?? "미확인"}개 / 실패 {result.tests_failed ?? "미확인"}개</p><small>HTTP 보안 설정 평가입니다. 사이트 전체의 안전성이나 해킹 여부를 판정하는 점수는 아닙니다.</small></div></div>
      {tests.length > 0 && tests.every(([, test]) => typeof test.score_modifier === "number") && 100 + tests.reduce((sum, [, test]) => sum + test.score_modifier, 0) === result.score && <p className="score-formula">점수 근거: 기본 100점 {tests.filter(([, test]) => test.score_modifier !== 0).map(([, test]) => `${test.score_modifier > 0 ? "+" : "−"} ${Math.abs(test.score_modifier)}`).join(" ")} = {result.score}점</p>}
      <p>먼저 ‘개선 권장’ 항목을 확인하세요. 각 항목에 지금 상태와 걱정되는 상황을 쉽게 적었어요.</p>
      <p className="source-text">이 결과는 웹 연결·브라우저 보호 설정을 살펴본 거예요. 실제 공격이나 정보 유출이 발생했는지는 검사하지 않았어요. 서버 설정 변경은 사이트 관리자가 진행해야 해요.</p>
      {result.scanned_at && <p className="source-text">검사 시각: {new Date(result.scanned_at).toLocaleString("ko-KR")} · 재검사 시 최근 결과가 반환될 수 있습니다.</p>}
      {tests.length === 0 && <p className="empty-explanation">항목별 상세 결과를 받지 못했습니다. 이 화면의 점수만으로 특정 헤더가 빠졌다고 판단하지 않습니다. Mozilla 원문에서 원인을 확인해 주세요.</p>}
      {tests.map(([key, test]) => {
        const topic = topics[key] || ["추가 보안 설정 확인하기", "Mozilla가 이 설정을 확인했어요.", "자세한 결과와 관리자용 원문을 확인하세요.", test.title || key];
        const passed = test.pass === true;
        const failed = test.pass === false;
        const optionalMissing = ["coep-not-implemented", "coop-not-implemented"].includes(test.result) && !failed;
        const modifier = typeof test.score_modifier === "number" ? test.score_modifier : null;
        return <details className="reason-item" key={key} open={failed}>
          <summary><span className={`badge bilingual-status ${passed && !optionalMissing ? "success" : failed ? "warning" : ""}`}>{optionalMissing ? "선택 설정 없음" : passed ? "양호" : failed ? "개선 권장" : "판단하지 않음"}<small lang="en">{optionalMissing ? "Optional · Not configured" : passed ? "Passed" : failed ? "Needs Improvement" : "Not assessed"}</small></span><span className="test-heading"><strong>{topic[0]}</strong><small lang="en">{topic[4] || topic[3]}</small></span><span className="score-change">{modifier === null ? "점수 미제공" : modifier === 0 ? "점수 변화 없음" : `${modifier > 0 ? "+" : ""}${modifier}점`}</span></summary>
          <p className="plain-explainer">{topic[1]}</p>
          <div className="simple-result"><strong>지금 상태</strong><p>{reasons[test.result] || (passed ? "Mozilla 기준을 충족한 것으로 확인됐어요. 아래 관리자용 상세 정보에서 근거를 볼 수 있어요." : failed ? "Mozilla 권장 기준을 충족하지 못했어요. 아래 관리자용 상세 정보에서 정확한 이유를 확인하세요." : "이 항목은 좋고 나쁨을 판단하지 않았어요. 아래 상세 정보에서 이유를 확인하세요.")}</p></div>
          {getHttpRisk(key, test) && <div className="risk-guidance"><h4>어떤 일이 생길 수 있나요?</h4><p>{getHttpRisk(key, test)}</p></div>}
          <div className="simple-result"><strong>{failed ? "관리자는 이렇게 개선할 수 있어요" : "관리자가 확인할 내용"}</strong><p>{topic[2]}</p></div>
          <details className="technical-details"><summary>관리자용 상세 정보 · 용어와 원문</summary>
            <p><strong>기술 이름:</strong> {topic[3]}</p>
            <div className="source-text"><strong>Mozilla 실제 응답</strong><p>결과 코드: <code>{test.result || "미제공"}</code></p>{plainText(test.score_description) && <p>판정 근거: {plainText(test.score_description)}</p>}{plainText(test.recommendation) && <p>권고: {plainText(test.recommendation)}</p>}</div>
          </details>
        </details>;
      })}
      <a className="report-link" href={`https://developer.mozilla.org/en-US/observatory/analyze?host=${encodeURIComponent(result.hostname)}`} target="_blank" rel="noreferrer">Mozilla 전체 보고서에서 원문 확인 ↗</a>
    </div>}
  </section>;
}

const ports = {
  21: ["FTP", "파일 전송 서비스에 흔히 사용됩니다. 사용 여부와 암호화된 전송 대안을 확인하세요."],
  22: ["SSH", "원격 관리 접속에 흔히 사용됩니다. 관리자 접근 범위와 인증 설정을 확인하세요."],
  25: ["SMTP", "메일 전송에 흔히 사용됩니다. 의도한 메일 서버인지와 릴레이 제한을 확인하세요."],
  53: ["DNS", "도메인 주소 조회에 흔히 사용됩니다. 공개 DNS 제공 여부와 재귀 조회 제한을 확인하세요."],
  80: ["HTTP", "암호화되지 않은 웹 연결에 흔히 사용됩니다. HTTPS로 이동시키는지 확인하세요."],
  443: ["HTTPS", "암호화된 웹 연결에 흔히 사용됩니다. 이 포트만으로 인증서나 보안 설정이 검증되지는 않습니다."],
  3306: ["MySQL", "데이터베이스에 흔히 사용됩니다. 외부 공개가 필요한지와 접근 제한을 확인하세요."],
  3389: ["RDP", "원격 데스크톱에 흔히 사용됩니다. 접속 허용 범위와 인증 보호를 확인하세요."],
  5432: ["PostgreSQL", "데이터베이스에 흔히 사용됩니다. 외부 공개 필요성과 접근 제한을 확인하세요."],
  8080: ["대체 HTTP", "웹·프록시 서비스 등에 흔히 사용됩니다. 실제 서비스와 관리 화면 공개 여부를 확인하세요."],
};

export function NetworkExplanation({ network, ips, onCVE }) {
  if (!network) return null;
  return <section className="panel explanation-panel"><h2><Icon name="network" />네트워크 · 왜 이 정보가 나왔나요?</h2><div className="explanation-body">
    <h3>{network.hostname} · DNS 응답 IPv4 {ips.length}개</h3>
    {network.error && <p role="alert">DNS 조회 실패: {network.error}</p>}
    {!network.error && ips.length === 0 && <p>DNS 응답에 IPv4 주소가 없습니다. IPv6 전용 사이트일 수 있으며 안전 여부를 판단하지 않습니다.</p>}
    <div className="address-chips">{ips.map((ip) => <code key={ip}>{ip}</code>)}</div>
    <p>실제 사이트를 운영하는 서버 주소: <strong>확인되지 않음</strong>. 아래 주소는 접속을 대신 받아 주는 중계 서버 주소일 수 있어요.</p>
    <p>사이트 주소에 연결된 IP를 찾고, 공개된 서버 기록과 비교했어요. 지금 직접 서버의 문을 두드려 검사한 결과는 아니에요.</p>
    {network.dnsOnly && <p>DNS만 조회한 결과입니다. 웹사이트 통합 검사를 실행하면 Shodan·CDN 분석을 진행합니다.</p>}
    {network.skipped.length > 0 && <p className="empty-explanation">요청 수 제한으로 미조회: {network.skipped.join(', ')}. 전체 IP를 분석한 결과가 아닙니다.</p>}
    {network.results.map((result) => <IPResultCard key={result.ip} result={result} onCVE={onCVE} />)}
    <details><summary>포트 정보는 어떻게 읽나요?</summary><p>포트가 관측됐다는 사실만으로 위험하다고 판단하지 않습니다. 실제 서비스는 서버 설정에서 확인해야 합니다.</p>{Object.entries(ports).map(([port, [name, meaning]]) => <div className="port-reason" key={port}><strong>{port} · 일반적 용도: {name}</strong><p>{meaning}</p></div>)}</details>
  </div></section>;
}
