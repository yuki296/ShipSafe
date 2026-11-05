
/**
 * Shodan InternetDB에서 IP 주소의 공개 관측 정보를 조회한다.
 *
 * @param {string} ip - 조회할 IP 주소
 * @returns {Promise<object|null>} 관측 정보 또는 null
 */
export async function getShodanData(ip) {
  const url =
    `https://internetdb.shodan.io/${encodeURIComponent(ip)}`;

  const response = await fetch(url);

  // 해당 IP에 대한 공개 관측 데이터가 없는 경우
  if (response.status === 404) {
    return null;
  }

  // 기타 HTTP 요청 오류
  if (!response.ok) {
    throw new Error(
      `Shodan HTTP 오류: ${response.status}`
    );
  }

  return await response.json();
}
