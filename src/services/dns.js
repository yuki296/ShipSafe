
/**
 * Google DNS API로 도메인의 IPv4 주소를 조회한다.
 *
 * @param {string} hostname - 조회할 도메인
 * @returns {Promise<string[]>} 중복을 제거한 IPv4 목록
 */
export async function getIPv4Addresses(hostname) {
  const url =
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`;

  const response = await fetch(url);

  // HTTP 요청 자체가 실패한 경우
  if (!response.ok) {
    throw new Error(
      `DNS HTTP 오류: ${response.status}`
    );
  }

  const data = await response.json();

  // HTTP 성공과 DNS 조회 성공은 구분한다.
  if (data.Status !== 0) {
    throw new Error(
      `DNS 조회 오류: ${data.Status}`
    );
  }

  // A 레코드에서 IPv4 주소만 추출한다.
  const addresses = (data.Answer ?? [])
    .filter((record) => record.type === 1)
    .map((record) => record.data);

  return [...new Set(addresses)];
}
