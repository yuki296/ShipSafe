# v1.0 최종 검증 결과

검증일: 2026-11-05. 테스트용 서버 `127.0.0.1:5174`를 사용해 기존 `5173`의 localStorage 이력과 분리했다.

## 확인 결과

| 확인 항목 | 결과 |
| --- | --- |
| `npm run lint` | 성공 |
| `npm test` | 15개 성공 (Node 내장 테스트 + React 서버 렌더링) |
| `npm run build` | 성공, 39개 모듈 변환 |
| `git diff --check` | 성공 |
| Google DNS 실제 조회 | example.com의 IPv4 2개 응답 |
| Shodan 실제 조회 | 두 IP 각각 성공, 포트/태그/호스트명/CVE 표시 |
| Cloudflare 판별 | 104.20.23.154 및 172.66.147.243의 공식 CIDR 일치, Shodan 태그 보조 근거 표시 |
| Mozilla 실제 조회 | example.com의 HTTP 설정 F / 10점, 항목별 감점 근거 표시 |
| OSV 실제 조회 | Maven org.apache.logging.log4j:log4j-core 2.14.1, 권고 8개 |
| 이력 생성·조회 | 웹사이트/라이브러리 2개 요약이 함께 표시됨 |
| 이력 수정·새로고침 | 이름·메모 수정 후 새로고침해도 유지, 대상·결과 개수 유지 |
| 검색·필터 | example.com 검색 + 웹사이트 유형 + 2026-11-05 날짜 범위에서 1개 표시 |
| 삭제·정렬 | 자동 테스트에서 개별/전체 삭제와 최신/오래된/이름순 확인 |
| 오류·정보 없음 | 자동 테스트에서 HTTP 404/429/503, 시간 초과, NXDOMAIN, 잘못된 응답을 구분 |
| 일부 IP 실패 | 자동 테스트에서 성공/404/오류 결과가 함께 유지, 동시 요청 2·최대 IP 8 확인 |
| 저장 용량·구 이력 | 기존 형식 이관, 손상/차단/용량 초과, 20개·200KiB 제한 테스트 성공 |
| 반응형 | 모바일 390px, 데스크톱 946px에서 문서 너비와 scrollWidth 일치. 기존 색·이미지·카드 유지 |
| 브라우저 오류 | 테스트 탭에서 수집된 error 로그 없음 |

실제 결과 개수·주소·등급은 조회 시점에 따라 달라진다. 자동 테스트의 오류·404 등은 고정 응답으로 재현했으며 실제 원격 서비스에 장애를 일으켜 시험하지 않았다. 이력 삭제는 실제 사용자의 저장 데이터를 지우지 않고 자동 테스트용 저장소에서 검증했다.

## 변경 파일

- 화면 조립: `src/App.jsx` (기존 250줄 수준에서 41줄로 분리)
- 페이지: `src/pages/Dashboard.jsx`, `WebsiteScan.jsx`, `LibraryScan.jsx`, `ScanList.jsx`, `Guide.jsx`
- 결과 UI: `src/components/IPResultCard.jsx`, `ScanExplanation.jsx`, `VulnerabilityCard.jsx`
- 상태: `src/hooks/useWebsiteScan.js`, `useScanHistory.js`
- 외부 조회: `src/services/dns.js`, `shodan.js`, `osv.js`, `observatory.js`, `website.js`
- 공통 처리: `src/utils/network.js`, `http.js`, `cdn.js`, `history.js`, `severity.js`
- 근거 데이터: `src/data/cdnRanges.js`
- 스타일·설정: `src/styles/global.css`, `index.html` (한국어 문서), `package.json` (test 스크립트)
- 테스트: `tests/core.test.mjs`, `tests/components.test.mjs`
- 문서: `README.md`, `docs/v1-audit.md`, `docs/v2-plan.md`, 이 검증 문서

기존 미커밋 마스코트 배치는 보존했고 이미지 파일과 마스코트 컴포넌트는 변경하지 않았다. 커밋·push·공개 배포는 실행하지 않았다.

## 남은 범위·한계

- IPv6 및 공식 목록 외 CDN의 확정 판별은 미지원. 미일치는 ‘CDN 아님’이 아니라 ‘미확인’이다.
- 공식 CIDR 자료는 2026-11-05 확인 스냅샷으로, 운영 시 주기적인 수동 갱신이 필요하다.
- 최대 8 IP를 조회하며 나머지는 미조회로 명시한다. Shodan 실제 관측 시각은 제공되지 않는다.
- 이력은 요약만 보관하며 전체 API 원문을 재현하지 않는다. 브라우저 간 공유·사용자 인증·암호화·무결성 증명 기능은 없다.
- localStorage 저장 차단·할당량 초과 시 메모리에서만 유지될 수 있다. 서로 다른 탭의 정확히 동시 쓰기는 마지막 쓰기가 우선된다.
- 프런트엔드 호출은 외부 API의 연결/CORS/서비스 제한 영향을 받는다. v2의 서버 측 보완은 설계만 작성했다.


## 추가 검증: CVE 상세 조회 및 빈 주소 입력란

2026-11-05 후속 변경으로 `src/services/cve.js`, `src/hooks/useCveLookup.js`, `src/components/CveLookup.jsx`, `tests/cve.test.mjs`를 추가하고 기존 WebsiteScan·IPResultCard·NetworkExplanation과 연결했다. 웹사이트 초기값과 주소 예시 placeholder를 제거했으며 화면 진입 시 입력란에 포커스를 둔다.

- lint·빌드 성공, 자동 테스트 총 21개 성공.
- 브라우저 첫 화면에서 빈 웹사이트 입력란과 입력 포커스 확인.
- 실제 NVD API에서 CVE-2021-44228 조회 성공: CRITICAL, CVSS 3.1 / 10.0, 출처 nvd@nist.gov, 원문 설명과 영향 조건 표시.
- 모바일 390px에서 가로 넘침 없음 확인.
- 관측 CVE 상세 버튼과 직접 입력 조회는 공개 기록 조회이며, 도메인의 실제 취약점 검증으로 간주하지 않는다. NVD의 0건·실패·기각 기록을 구분하고 점수가 없으면 미제공/미분류로 표시한다.
- Shodan의 CVE가 0건인 CDN 사이트에서 원본 서버의 취약점을 새로 만들어 표시하지 않는다. 패키지 정보가 있는 경우 기존 OSV 검사를 사용한다.
