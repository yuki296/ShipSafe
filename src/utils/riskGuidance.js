// 항목별 일반적 위험 시나리오. 검사 결과로 공격 성공을 주장하지 않는다.
const httpRisks = {
  "content-security-policy": "다른 보안 문제로 나쁜 코드가 페이지에 들어오면, 이를 한 번 더 막아 줄 보호가 약해요. 화면이 바뀌거나 정보가 새어 나갈 위험이 커질 수 있어요.",
  "strict-transport-security": "사용자가 HTTP 주소로 방문하고 누군가 통신에 끼어들 수 있다면, 암호화되지 않은 연결로 유도될 수 있어요.",
  redirection: "사용자가 HTTP 주소로 접속하면, 통신에 끼어든 사람이 암호화되지 않은 내용을 보거나 바꿀 수 있어요.",
  cookies: "어떤 보호가 빠졌는지에 따라 로그인 정보가 노출되거나, 원하지 않는 요청에 로그인 정보가 함께 보내질 수 있어요. 아래 상세 정보에서 빠진 설정을 확인하세요.",
  "cross-origin-resource-sharing": "로그인한 사람의 응답까지 아무 사이트나 읽게 허용했다면, 악성 사이트를 방문했을 때 내 정보가 새어 나갈 수 있어요.",
  "x-frame-options": "공격자가 이 화면을 가짜 화면 안에 숨길 수 있다면, 사용자가 엉뚱한 버튼을 누르게 속일 수 있어요.",
  "x-content-type-options": "사용자가 올린 파일 등의 종류를 서버가 잘못 알려주는 상황에서, 브라우저까지 이를 실행 코드로 잘못 읽으면 문제가 생길 수 있어요.",
  "subresource-integrity": "다른 곳에서 가져오는 코드 파일이 변조되면, 내 사이트에서도 바뀐 코드가 실행될 수 있어요.",
  "referrer-policy": "다른 사이트로 이동할 때 출발한 주소에 민감한 정보가 들어 있다면, 그 정보가 상대 사이트에 전달될 수 있어요.",
};
export function getHttpRisk(key, test) {
  if (test?.pass !== false) return null;
  return httpRisks[key] || "이 설정의 보호가 부족할 수 있어요. 어떤 피해로 이어지는지는 아직 판단하지 않았으니, 관리자용 상세 정보와 원문을 확인하세요.";
}

// Apache 공식 권고를 확인한 CVE만 구체적으로 설명한다. 미등록 CVE는 추측하지 않는다.
const log4jRisks = {
  "CVE-2021-44228": { title: "외부 입력이 서버 코드 실행으로 이어질 수 있어요", condition: "영향받는 Log4j Core에서 공격자 입력이 로그의 JNDI 조회에 도달하는 등 악용 조건이 맞는 경우", impact: "공격자 코드가 서버에서 실행되어 정보·서비스에 영향을 줄 수 있습니다." },
  "CVE-2021-45046": { title: "특정 로그 설정에서 정보 노출·코드 실행 위험이 있어요", condition: "영향 버전의 비기본 로그 설정과 공격자가 제어하는 Thread Context 입력 등이 결합되는 경우", impact: "정보가 노출되거나 일부 환경에서 코드가 실행될 수 있습니다." },
  "CVE-2021-45105": { title: "로그 처리 오류로 서비스가 멈출 수 있어요", condition: "영향 버전에서 특정 Context Lookup 설정과 공격자가 제어하는 입력이 결합되는 경우", impact: "반복 처리로 서비스가 중단될 수 있습니다. 이 권고를 코드 실행 취약점으로 표시하지 않습니다." },
  "CVE-2021-44832": { title: "로그 설정 변경 권한이 악용될 수 있어요", condition: "공격자가 로그 설정을 변경할 수 있고 영향받는 JDBC Appender 구성이 사용되는 경우", impact: "코드 실행 위험이 있습니다. 단순한 웹 요청만으로 공격 가능하다고 판단하지 않습니다." },
};
export function getLibraryRisk(vuln) {
  const identifiers = [vuln.id, ...(Array.isArray(vuln.aliases) ? vuln.aliases : [])];
  const id = identifiers.find((key) => Object.hasOwn(log4jRisks, key));
  if (id) return { ...log4jRisks[id], id, source: "https://logging.apache.org/security.html", verifiedAt: "2026-11-05" };
  return { title: "이 버전에 보안 권고가 있어요 · 영향 조건 확인 필요", condition: "현재 사용 중인 기능·설정이 해당 권고의 영향 조건에 해당하는 경우", impact: "보안에 영향을 줄 수 있습니다. 이 권고의 구체적인 피해 유형은 아직 한국어로 검토하지 않았으므로, 정보 유출·코드 실행 같은 시나리오를 임의로 단정하지 않습니다. 아래 원문 요약과 상세 설명을 확인하세요." };
}
