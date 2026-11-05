import Icon from "./Icon.jsx";

const topics = {
  "content-security-policy": ["콘텐츠 보안 정책 (CSP)", "브라우저가 불러올 스크립트·이미지 등의 출처를 제한하는 설정입니다.", "사용하는 자원의 출처를 확인하고 CSP를 적용하세요. unsafe-inline·unsafe-eval 등 넓은 허용 규칙은 필요한지 검토하세요."],
  cookies: ["쿠키 보호", "로그인 등 쿠키가 암호화된 연결에서만 전송되고 스크립트 접근이 제한되는지 확인합니다.", "세션 쿠키의 Secure·HttpOnly·SameSite 속성을 서비스 동작에 맞게 검토하세요."],
  "cross-origin-resource-sharing": ["외부 사이트 접근 (CORS)", "다른 출처의 웹사이트가 응답을 읽을 수 있는 범위를 확인합니다.", "인증 정보를 허용한다면 신뢰하는 출처만 허용하세요. 공개 응답과 인증 응답의 정책을 구분하세요."],
  "strict-transport-security": ["HTTPS 강제 연결 (HSTS)", "브라우저가 이후에도 HTTPS로 연결하도록 서버가 지시하는지 확인합니다.", "HTTPS가 정상 동작하는지 확인한 뒤 Strict-Transport-Security 헤더와 유지 기간을 검토하세요."],
  redirection: ["HTTPS 이동", "HTTP 접속이 안전한 HTTPS 주소로 이동하는지 확인합니다.", "같은 도메인의 HTTPS로 먼저 이동하는지와 최종 목적지의 인증서를 확인하세요."],
  "referrer-policy": ["이전 페이지 주소 보호", "외부 사이트로 이동할 때 방문 주소 정보가 얼마나 전달되는지 확인합니다.", "Referrer-Policy에서 외부로 전달할 주소 정보의 범위를 제한하세요."],
  "subresource-integrity": ["외부 파일 무결성 (SRI)", "외부 스크립트·스타일 파일이 예상한 파일과 일치하는지 검증하는 설정입니다.", "외부 파일을 사용하는 경우 integrity 해시와 crossorigin 설정을 검토하세요."],
  "x-content-type-options": ["파일 형식 보호", "브라우저가 서버가 지정한 파일 형식을 임의로 다르게 해석하지 않도록 하는 설정입니다.", "올바른 Content-Type과 X-Content-Type-Options: nosniff를 설정하세요."],
  "x-frame-options": ["클릭 가로채기 방지", "다른 사이트가 이 페이지를 프레임에 넣어 사용자를 속이는 것을 제한합니다.", "X-Frame-Options 또는 CSP의 frame-ancestors로 허용할 프레임 출처를 검토하세요."],
  "cross-origin-resource-policy": ["리소스 외부 사용 제한", "다른 출처에서 이미지 등의 자원을 불러올 수 있는 범위를 제어합니다.", "공유가 필요한 자원을 구분해 Cross-Origin-Resource-Policy를 검토하세요."],
  "cross-origin-opener-policy": ["창 사이 격리", "다른 출처의 창과 브라우저 실행 환경을 분리하는 정책입니다.", "로그인 팝업 등 동작을 확인하면서 Cross-Origin-Opener-Policy 적용을 검토하세요."],
  "cross-origin-embedder-policy": ["외부 콘텐츠 포함 정책", "외부 리소스를 포함할 때 출처 정책을 확인하도록 하는 설정입니다.", "외부 자원의 CORS·CORP 설정과 함께 Cross-Origin-Embedder-Policy를 검토하세요."],
};

const reasons = {
  "csp-not-implemented": "CSP 헤더가 없어 콘텐츠 출처를 제한하는 보호 설정이 확인되지 않았습니다.",
  "csp-not-implemented-but-reporting-enabled": "CSP가 보고 전용으로 설정돼 위반을 기록하지만 실제 차단은 하지 않습니다.",
  "csp-header-invalid": "CSP 헤더를 정상적으로 해석하지 못했습니다.",
  "csp-implemented-with-unsafe-inline": "스크립트 등의 출처 제한에 넓은 허용 규칙이 포함돼 CSP 보호가 약해질 수 있습니다.",
  "csp-implemented-with-unsafe-eval": "문자열을 코드로 실행할 수 있는 unsafe-eval 규칙 등이 허용돼 있습니다.",
  "hsts-not-implemented": "HSTS 헤더가 확인되지 않아 이후 HTTPS 연결을 강제하는 보호가 부족합니다.",
  "hsts-header-invalid": "HSTS 헤더 형식을 정상적으로 해석하지 못했습니다.",
  "hsts-implemented-max-age-less-than-six-months": "HSTS는 있지만 유지 기간이 Mozilla 권장 기준보다 짧습니다.",
  "x-content-type-options-not-implemented": "파일 형식 추측을 막는 X-Content-Type-Options 헤더가 확인되지 않았습니다.",
  "x-frame-options-not-implemented": "다른 사이트의 프레임에 포함되는 것을 제한하는 설정이 확인되지 않았습니다.",
  "cookies-not-found": "검사 응답에서 쿠키를 찾지 못해 쿠키 보호 여부를 판단하지 않습니다.",
  "referrer-policy-not-implemented": "명시적인 Referrer-Policy가 확인되지 않았습니다. 이것만으로 실패를 뜻하지는 않습니다.",
  "cross-origin-resource-sharing-not-implemented": "응답을 다른 출처에 공유하는 CORS 설정이 확인되지 않았습니다. 일반적인 비공개 공유 정책에서는 정상일 수 있습니다.",
  "redirection-to-https": "HTTP 접속이 같은 호스트의 HTTPS로 먼저 이동하고 최종 목적지도 HTTPS입니다.",
  "redirection-missing": "HTTP 접속이 HTTPS로 이동하지 않습니다.",
  "redirection-not-to-https": "이동한 최종 목적지가 HTTPS가 아닙니다.",
  "redirection-invalid-cert": "이동 과정에서 유효하지 않은 인증서가 발견됐습니다.",
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
      <p>Mozilla의 기본 점수에 각 항목의 감점·가점을 반영한 결과입니다. 아래에서 실제 평가 근거와 확인할 설정을 볼 수 있어요.</p>
      {result.scanned_at && <p className="source-text">검사 시각: {new Date(result.scanned_at).toLocaleString("ko-KR")} · 재검사 시 최근 결과가 반환될 수 있습니다.</p>}
      {tests.length === 0 && <p className="empty-explanation">항목별 상세 결과를 받지 못했습니다. 이 화면의 점수만으로 특정 헤더가 빠졌다고 판단하지 않습니다. Mozilla 원문에서 원인을 확인해 주세요.</p>}
      {tests.map(([key, test]) => {
        const topic = topics[key] || [test.title || key, "Mozilla가 해당 보안 설정을 평가한 결과입니다.", "아래 Mozilla 원문 권고와 설정 문서를 확인하세요."];
        const passed = test.pass === true;
        const failed = test.pass === false;
        const modifier = typeof test.score_modifier === "number" ? test.score_modifier : null;
        return <details className="reason-item" key={key} open={failed}>
          <summary><span className={`badge ${passed ? "success" : failed ? "warning" : ""}`}>{passed ? "통과" : failed ? "확인 필요" : "참고·해당 없음"}</span><strong>{topic[0]}</strong><span className="score-change">{modifier === null ? "점수 미제공" : modifier === 0 ? "점수 변화 없음" : `${modifier > 0 ? "+" : ""}${modifier}점`}</span></summary>
          <p>{topic[1]}</p><h4>이렇게 표시된 이유</h4><p>{reasons[test.result] || (passed ? "Mozilla가 이 항목을 통과로 판정했습니다. 구체적인 설정 근거는 아래 원문에 표시됩니다." : failed ? "Mozilla가 이 항목을 기준 미충족으로 판정했습니다. 정확한 사유는 아래 결과 코드와 원문을 확인하세요." : "이 항목은 통과·실패로 판정하지 않았습니다. 미사용·선택 설정 등일 수 있으므로 원문을 확인하세요.")}</p>
          <h4>{failed ? "어떻게 확인하나요?" : "설정 참고"}</h4><p>{topic[2]}</p>
          <div className="source-text"><strong>Mozilla 실제 응답</strong><p>결과 코드: <code>{test.result || "미제공"}</code></p>{plainText(test.score_description) && <p>판정 근거: {plainText(test.score_description)}</p>}{plainText(test.recommendation) && <p>권고: {plainText(test.recommendation)}</p>}</div>
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

export function NetworkExplanation({ network, ips }) {
  if (!network && ips.length === 0) return null;
  return <section className="panel explanation-panel"><h2><Icon name="network" />네트워크 · 왜 이 정보가 나왔나요?</h2><div className="explanation-body">
    <h3>도메인에서 찾은 IP 주소</h3><p>DNS의 IPv4 응답으로 {ips.length}개 주소를 찾았습니다. 여러 IP가 있어도 현재 Shodan 조회는 첫 번째 IP만 대상으로 합니다.</p><div className="address-chips">{ips.map((ip) => <code key={ip}>{ip}</code>)}</div>
    {!network ? <p>IP 주소만 조회한 상태입니다. 웹사이트 통합 검사를 실행하면 첫 번째 IP의 공개 관측 정보를 확인할 수 있습니다.</p> : <><p><strong>조회 대상: {network.hostname} → {network.ip}</strong></p><p>Shodan InternetDB에 이 IP로 등록된 공개 관측 기록을 보여줍니다. CDN·공유 서버의 IP라면 다른 서비스의 정보가 함께 연관될 수 있습니다.</p>
      {network.data === null ? <p className="empty-explanation">이 IP의 관측 기록을 찾지 못했습니다. 포트가 닫혀 있거나 취약점이 없다는 뜻은 아닙니다.</p> : <>
        <h3>관측된 포트 {network.data.ports?.length ?? 0}개</h3><p>관측된 포트는 외부에서 서비스를 제공한 기록입니다. 포트가 있다는 사실만으로 위험하다고 판단하지 않습니다. 아래 서비스 이름은 포트 번호에 따른 일반적인 용도이며 실제 서비스 확정 결과가 아닙니다.</p>
        {(network.data.ports || []).map((port) => <div className="port-reason" key={port}><strong>{port} · {ports[port]?.[0] || "기타 서비스"}</strong><p>{ports[port]?.[1] || "어떤 서비스가 사용하는 포트인지 서버 설정에서 확인하고 필요한 접속만 허용하세요."}</p></div>)}
        {!network.data.ports?.length && <p>반환된 포트 목록이 비어 있습니다. 현재 열린 포트가 전혀 없다는 보장은 아닙니다.</p>}
        <h3>연관된 CVE {network.data.vulns?.length ?? 0}개</h3><p>Shodan이 해당 IP의 서비스 정보와 연관 지은 공개 취약점 식별자입니다. 이 웹사이트에서 실제 공격이 가능한지 확인한 결과는 아닙니다. 서버의 제품·버전과 해당 CVE의 영향 조건을 비교하세요.</p><div className="cve-list">{(network.data.vulns || []).map((id) => <a key={id} href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">{id} · 영향 조건 확인 ↗</a>)}</div>
        {!network.data.vulns?.length && <p>응답에 연관 CVE가 없습니다. 미등록 취약점이나 아직 관측되지 않은 문제까지 검사한 것은 아닙니다.</p>}
      </>}
    </>}
  </div></section>;
}
