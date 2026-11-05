export default function IPResultCard({ result, onCVE }) {
  const { ip, status, cdn, data, error } = result;
  return <article className="ip-result"><header><h3>{ip}</h3><span className={`badge ${cdn.status === 'confirmed' ? 'warning' : ''}`}>{cdn.status === 'confirmed' ? `${cdn.provider} CDN·프록시 대역` : 'CDN 여부 미확인'}</span></header>
    <p><strong>IP 역할:</strong> {cdn.role} · <strong>원본 서버 IP:</strong> 확인되지 않음</p>
    <p>{cdn.status === 'confirmed' ? '이 주소는 사이트 앞에서 접속을 대신 받아 주는 중계 서버 쪽 주소예요. 아래 연결 번호가 많아도, 실제 사이트 서버에 그만큼 문이 열려 있다는 뜻은 아니에요.' : '이 주소가 실제 운영 서버인지, 접속을 대신 받는 중계 서버인지는 아직 몰라요.'}</p>
    <details><summary>CDN 판단 근거와 출처</summary>{cdn.evidence.length ? <ul>{cdn.evidence.map((entry, i) => <li key={i}>{entry.text}{entry.source && <> · <a href={entry.source} target="_blank" rel="noreferrer">공식 대역 목록 ↗</a> (확인일 {entry.verifiedAt})</>}</li>)}</ul> : <p>공식 대역 일치 및 추가 확인 근거가 없습니다.</p>}<small>Cloudflare·Fastly IPv4 목록 스냅샷을 사용합니다. 목록 변경·그 외 CDN은 미확인일 수 있습니다. DNS CNAME과 Shodan 태그·호스트명은 보조 정보입니다.</small></details>
    {status === 'error' ? <p className="empty-explanation" role="alert">조회 실패: {error} (관측 정보 없음과 다릅니다.)</p> : status === 'no-data' ? <p className="empty-explanation">Shodan 공개 관측 정보 없음 (404). 포트가 닫혀 있거나 안전하다는 뜻은 아닙니다.</p> : <>
      <h4>{cdn.status === 'confirmed' ? 'CDN·프록시 IP' : 'DNS 응답 IP'}의 공개 관측 포트</h4><p>{data.ports.length ? data.ports.join(', ') : '응답 포트 목록이 비어 있습니다.'}</p>
      <details className="technical-details"><summary>관측된 태그·다른 사이트 이름 보기</summary><p>중계 서버는 여러 사이트가 함께 써요. 여기에 다른 사이트 이름이 나와도 내 사이트가 바뀌거나 해킹됐다는 뜻은 아니에요.</p><p>태그: {data.tags.join(', ') || '제공된 태그 없음'}</p><p>관측 호스트명: {data.hostnames.join(', ') || '제공된 호스트명 없음'}</p></details>
      <h4>이 IP에 연관된 CVE {data.vulns.length}개</h4><div className="cve-list">{data.vulns.map((id) => <span key={id}>{onCVE && <button type="button" onClick={() => onCVE(id)}>{id} · 상세 조회</button>} <a href={`https://nvd.nist.gov/vuln/detail/${encodeURIComponent(id)}`} target="_blank" rel="noreferrer">{id} · NVD 원문 ↗</a></span>)}</div>
      {data.vulns.length > 0 && <div className="risk-guidance"><h4>어떤 위험을 확인해야 하나요?</h4><p>{cdn.status === 'confirmed' ? 'CDN·프록시 IP에 CVE가 연관돼 있습니다. 이 사실만으로 원본 서버나 이 웹사이트가 위험하다고 경고할 수 없습니다. 제공자의 관측 정보인지, 실제 관리 대상의 제품·버전과 연결되는지 먼저 확인하세요.' : '이 IP의 서비스 정보와 공개 취약점이 연관돼 있습니다. 실제 제품·버전·설정이 CVE의 영향 조건과 일치하고 외부에서 해당 기능에 접근할 수 있다면 보안 문제가 발생할 수 있습니다. 구체적인 피해는 각 CVE 원문에서 확인해야 합니다.'}</p><p><strong>개선 순서:</strong> 관리 대상과 일치하는지 확인 → 제품·버전과 영향 조건 비교 → 공급자 수정 릴리스 및 접근 제한 검토. 아직 취약점이 검증된 상태는 아닙니다.</p></div>}
      {!data.vulns.length && <p>Shodan이 이 IP에 연결한 CVE가 없습니다. CDN 뒤의 원본 서버나 사용 중인 패키지까지 검사한 것은 아닙니다. 패키지·버전을 알고 있다면 라이브러리 검사를, CVE 번호를 알고 있다면 아래 상세 조회를 이용하세요.</p>}
      <p className="source-text">Shodan의 서비스 메타데이터 연관 정보이며 실제 공격 가능성을 검증하지 않았습니다. 조회 시각: {new Date(result.observedAt).toLocaleString('ko-KR')} (실제 관측 시각은 API 미제공, 최근 캐시가 사용될 수 있음)</p>
    </>}
  </article>;
}
