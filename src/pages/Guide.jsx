// 서비스 이용 안내 화면입니다. 사용자에게 보여 주는 안내 문구는 아래 JSX에서 수정합니다.
export default function Guide() {
  return (
    <section className="panel guide">
      <h2>쉽게 시작하는 보안 점검</h2>
      <p>항목을 선택하면 공개 보안 정보를 확인할 수 있습니다.</p>
      {[
        [
          "01",
          "웹사이트 검사",
          "웹사이트 주소를 입력하면 DNS의 여러 IPv4를 찾고 최대 8개 IP를 2개씩 조회합니다. Cloudflare·Fastly 공식 대역과 비교하며, 원본 서버 IP는 확인하지 않습니다. 통합 검사에서는 Mozilla HTTP 설정도 함께 조회합니다.",
        ],
        [
          "02",
          "웹 보안 설정",
          "Mozilla 검사로 HTTP 보안 설정의 등급과 점수를 확인합니다. 웹사이트 검사 화면의 웹 보안 설정 카드를 누르면 확인할 수 있습니다.",
        ],
        [
          "03",
          "라이브러리 검사",
          "Maven, npm, PyPI 등 생태계를 선택하고 정확한 패키지명과 버전을 입력해야 합니다. Maven은 groupId:artifactId 형식입니다.",
        ],
        [
          "04",
          "검사 목록",
          "검사 대상 탭에서 웹사이트·라이브러리를 미리 등록하고 수정·삭제·검색할 수 있습니다. 임시 대상은 새로고침하면 초기화됩니다. 별도 검사 이력에는 결과 요약이 총 20개, 최대 200KiB까지 저장됩니다. 이름·메모만 수정할 수 있고 검색·유형·날짜 필터를 지원합니다.",
        ],
      ].map(([number, title, body]) => (
        <article key={number}>
          <span>{number}</span>
          <div>
            <h3>{title}</h3>
            <p>{body}</p>
          </div>
        </article>
      ))}
      <div className="friendly-note">
        공개 데이터에 기반한 참고 정보이며, 취약점이 조회되지 않아도 안전성을 보장하지
        않습니다.
      </div>
    </section>
  );
}
