
/**
 * OSV API로 특정 패키지 버전의 알려진 취약점을 조회한다.
 *
 * @param {string} ecosystem - 패키지 생태계
 * @param {string} name - 패키지 이름
 * @param {string} version - 패키지 버전
 * @returns {Promise<object[]>} 취약점 목록
 */
export async function getOSVVulnerabilities(
  ecosystem,
  name,
  version
) {
  const response = await fetch(
    "https://api.osv.dev/v1/query",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        version,
        package: {
          name,
          ecosystem,
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(
      `OSV HTTP 오류: ${response.status}`
    );
  }

  const data = await response.json();

  // 알려진 취약점이 반환되지 않으면 빈 배열 사용
  return data.vulns ?? [];
}
