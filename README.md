# ShipSafe v1.0

React + Vite 기반 공개 보안 정보 조회 서비스입니다. 원본 서버에 직접 포트 스캔하거나 취약점을 공격으로 검증하지 않습니다.

## 실행

Node.js는 설치된 Vite 8이 지원하는 버전(Node 20.19+ 또는 22.12+)을 사용하세요.

```sh
npm ci
npm run dev
```

개발 서버가 출력하는 로컬 주소로 접속합니다. API 호출에는 인터넷 연결이 필요합니다.

```sh
npm run lint
npm test
npm run build
npm run preview
```

## 구현 기능

- Google DNS: A 레코드·CNAME 조회, IPv4 중복 제거.
- Shodan InternetDB: DNS 응답 최대 8개 IP를 동시 2개씩 분석. IP별 포트·태그·호스트명·CVE, 실패/404 구분. 조회 캐시는 메모리에서 5분 유지합니다.
- CDN: Cloudflare·Fastly 공식 IPv4 CIDR 목록 스냅샷과 비교. CNAME·Shodan 태그·호스트명은 보조 근거이며 문자열만으로 제공자를 확정하지 않습니다. 출처·확인일을 화면에 제공합니다.
- Mozilla Observatory: HTTP 보안 설정의 실제 등급·점수, 항목별 근거·가감점·개선 안내. 전체 웹사이트 보안 점수가 아닙니다.
- 웹사이트 통합 조회에서 DNS/Shodan과 Mozilla 실패를 독립 처리합니다. 같은 유형·도메인 재요청은 10초 간격을 둡니다. 이 제한은 브라우저 내 UX 제한이며 서버 차원의 남용 방지가 아닙니다.
- OSV: Maven/npm/PyPI 등 정확한 패키지명·버전으로 조회, 상세 권고·영향 범위·한국어 심각도. 분류가 없거나 알 수 없으면 미분류.
- 검사 목록: 웹사이트·라이브러리 요약 저장·조회·개별/전체 삭제, 기록 이름·메모 수정, 대상/이름/메모 검색, 유형·날짜 필터, 최신/오래된/대상순 정렬.
- 기존 파스텔 대시보드·모바일 메뉴·마스코트를 유지합니다. 개발용 고정 Shodan 테스트는 입력 도메인의 결과와 구분해 표시합니다.

## CVE 상세 조회

웹사이트 입력란은 빈 상태로 시작하며 화면 진입 시 입력란에 초점을 둡니다. 기본 테스트 주소를 자동으로 검사하지 않습니다.

Shodan이 반환한 CVE는 상세 조회 버튼으로 NVD CVE API 2.0의 설명·공식 CVSS/심각도·영향 제품 조건과 연결합니다. CVE 번호를 직접 입력해 조회할 수도 있습니다. 조회 자체는 사이트에 해당 취약점이 검증됐다는 뜻이 아닙니다. CDN에서 CVE가 0건이어도 원본·패키지의 안전성을 보장하지 않습니다. 패키지·버전을 알면 기존 OSV 검사를 사용하세요.

NVD는 API 키 없이 호출하며 최소 7초 간격·동시 1요청·10분 메모리 캐시를 적용합니다. API 키는 브라우저에 넣지 않습니다. 요청 제한·CORS·외부 장애는 원문 링크와 오류로 안내하고, 0건과 실패를 구분합니다. 영향 CPE는 최대 20개로 제한한 원문 조건 일부이며, AND/OR 등 전체 조건은 [NVD 전체 기록](https://nvd.nist.gov/)에서 확인해야 합니다.

## 위험 설명

Mozilla 실패 항목에는 설정 미흡이 어떤 조건에서 정보 노출·클릭 가로채기 등에 영향을 줄 수 있는지와 개선 방법을 표시합니다. 통과·해당 없음에는 실패 경고를 붙이지 않습니다. 라이브러리는 공식 Apache 권고를 확인한 Log4j CVE 4건만 구체적인 한국어 시나리오를 제공하며, 나머지 권고는 원문과 영향 조건 확인을 안내합니다. 심각도나 제목 키워드만으로 피해 유형을 생성하지 않습니다. Shodan CVE는 실제 악용 미검증 상태를 유지하고 CDN 결과를 원본 서버의 위험으로 바꾸지 않습니다. 설명은 실제 공격 성공이나 침해를 판정하지 않습니다.

## 저장 정책

`localStorage['shipsafe-history']`의 배열 구조를 유지합니다. 기존 라이브러리 요약을 읽으며 상세 데이터가 없는 구 이력도 조회할 수 있습니다. 총 20개/200KiB(문자열 UTF-16 크기 추정), 기록별 8KiB로 제한하고 오래된 기록부터 제외합니다. IP별 포트 50개·태그 10개·CVE 20개, OSV 권고 50개 등 일부 요약만 저장합니다. 원문·전체 세부 결과는 저장하지 않습니다.

결과·대상·검사 시각은 편집 UI에서 수정할 수 없습니다. 기록 이름(80자)과 메모(500자)만 수정합니다. 저장소 차단/용량 초과 시 화면에서 경고하며 메모리 결과를 유지합니다. 새로고침 이후 저장 실패한 데이터는 유실될 수 있습니다. 같은 페이지의 검사들은 공통 상태를 사용하며 다른 탭의 저장 변경도 반영합니다. localStorage는 사용자가 직접 변경할 수 있고 암호화·무결성 검증 저장소가 아닙니다. 여러 탭의 정확히 동시 쓰기는 마지막 쓰기가 우선됩니다.

## 정확성·범위

- CDN 대역은 제공자 네트워크에 속한다는 근거입니다. CDN 포트는 원본 서버의 열린 포트가 아닙니다. 원본 IP는 항상 ‘확인되지 않음’으로 표시합니다.
- 지원 목록에 없거나 근거가 부족하면 CDN ‘미확인’입니다. CDN 아님을 판정하지 않습니다. 공식 목록은 **2026-11-05 확인 스냅샷**이며 자동 갱신하지 않습니다. `src/data/cdnRanges.js`의 대역·출처·확인일을 함께 갱신하세요.
- 현재 IPv4만 분석합니다. 8개 초과 IP는 미조회로 표시합니다. CDN 보호 우회·숨겨진 원본 탐색은 하지 않습니다.
- InternetDB는 공개 관측 데이터입니다. 조회 시각은 실제 관측 시각이 아닙니다. CVE는 서비스 메타데이터와의 연관이며 실제 악용 검증이 아닙니다.
- API 오류·정보 없음·유효한 빈 목록을 구분합니다. 인터넷 연결/CORS/서비스 상태/요청 제한에 영향을 받습니다.
- 검사 이력은 해당 시점의 요약이며 현재 상태를 보장하지 않습니다. OSV에 결과가 없어도 패키지 존재나 안전성이 보장되지 않습니다.

## 구조

```text
src/pages/       Dashboard, WebsiteScan, LibraryScan, ScanList, Guide
src/components/ 기존 공통 UI, IPResultCard, VulnerabilityCard, ScanExplanation
src/hooks/      useWebsiteScan, useScanHistory
src/services/   DNS / Shodan / OSV / Observatory / 다중 IP orchestration
src/utils/      입력·CIDR·CDN·이력·심각도·HTTP 처리
src/data/       공식 CDN 네트워크 목록 스냅샷
```

## 검증 방법

`npm test`는 CIDR 경계·잘못된 입력·CDN 오판 방지·다중 IP 부분 실패/요청 제한·이력 이관/CRUD/검색/필터/용량·API 예외를 고정 응답으로 검증합니다. 실시간 API 테스트와 구분됩니다.

브라우저에서는 `example.com` 통합 검사 후 IP별 CDN 근거와 Mozilla 설명을 확인하고, Maven `org.apache.logging.log4j:log4j-core` 버전 `2.14.1`을 검사하세요. 검사 목록에서 검색/유형/날짜 필터, 이름·메모 수정 후 새로고침 유지, 삭제를 확인합니다. 브라우저 폭을 줄여 메뉴·카드·입력 폼을 확인하세요. 실제 API 결과 개수는 시점에 따라 달라질 수 있습니다.

## 출처 및 문서

- [Cloudflare 공식 IPv4 목록](https://www.cloudflare.com/ips-v4)
- [Cloudflare IP 안내](https://www.cloudflare.com/ips/)
- [Fastly 공식 IP 목록](https://api.fastly.com/public-ip-list)
- [Shodan InternetDB](https://internetdb.shodan.io/)
- [Mozilla Observatory API 구현](https://github.com/mdn/mdn-http-observatory/tree/main/src/api/v2)
- [Google DNS JSON API](https://developers.google.com/speed/public-dns/docs/doh/json)
- [OSV API](https://google.github.io/osv.dev/api/)
- [소스 점검 및 범위](docs/v1-audit.md)
- [v2.0 설계 초안 (미구현)](docs/v2-plan.md)
