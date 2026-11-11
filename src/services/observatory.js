const API = "https://observatory-api.mdn.mozilla.net/api/v2";

async function request(path, hostname) {
  let response;
  try {
    response = await fetch(`${API}/${path}?host=${encodeURIComponent(hostname)}`, {
      method: "POST", signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    throw new Error(error.name === "TimeoutError"
      ? "Mozilla 응답 시간이 초과됐습니다. 잠시 후 다시 검사할 수 있습니다."
      : "Mozilla에 연결하지 못했습니다. 인터넷 연결, 브라우저의 요청 차단 또는 서비스 상태를 확인해야 합니다. 정확한 원인은 현재 확인할 수 없습니다.", { cause: error });
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error || data.scan?.error) {
    const explanations = {
      422: "Mozilla가 대상에 연결하거나 주소를 해석하지 못했습니다. 도메인과 사이트의 공개 접근 가능 여부를 확인해야 합니다.",
      429: "요청이 많아 잠시 제한됐습니다. 잠시 후 다시 시도할 수 있습니다.",
      500: "Mozilla 서비스에서 오류가 발생했습니다. 잠시 후 다시 시도할 수 있습니다.",
      503: "Mozilla 서비스를 일시적으로 사용할 수 없습니다.",
    };
    const error = new Error(explanations[response.status] || "Mozilla 검사를 완료하지 못했습니다.");
    error.status = response.status;
    error.detail = data.message || data.error || data.scan?.error || `HTTP ${response.status}`;
    throw error;
  }
  return data;
}

function validateScan(scan) {
  if (!scan || typeof scan !== 'object' || !/^(A[+-]?|B[+-]?|C[+-]?|D[+-]?|F)$/.test(scan.grade) || typeof scan.score !== 'number' || !Number.isFinite(scan.score)) throw new Error('Mozilla 평가 결과 형식이 올바르지 않습니다.');
  return scan;
}
function normalizeTests(tests) {
  if (!tests || typeof tests !== 'object' || Array.isArray(tests)) return {};
  return Object.fromEntries(Object.entries(tests).filter(([, test]) => test && typeof test === 'object' && !Array.isArray(test)).map(([key, test]) => [key, {
    pass: typeof test.pass === 'boolean' ? test.pass : null,
    result: typeof test.result === 'string' ? test.result : '',
    title: typeof test.title === 'string' ? test.title : key,
    score_modifier: typeof test.score_modifier === 'number' && Number.isFinite(test.score_modifier) ? test.score_modifier : null,
    score_description: typeof test.score_description === 'string' ? test.score_description : '',
    recommendation: typeof test.recommendation === 'string' ? test.recommendation : '',
  }]));
}
export async function getMozillaScan(hostname) {
  try {
    const data = await request("analyze", hostname);
    if (!data.scan || typeof data.scan !== "object") throw new Error("Mozilla 상세 응답 형식이 올바르지 않습니다.");
    return { ...validateScan(data.scan), tests: normalizeTests(data.tests), hostname };
  } catch (error) {
    // 상세 API를 지원하지 않는 경우 기존 요약 검사는 유지한다.
    if (![404, 405].includes(error.status)) throw error;
    const data = await request("scan", hostname);
    return { ...validateScan(data), tests: {}, hostname, detailUnavailable: true };
  }
}
