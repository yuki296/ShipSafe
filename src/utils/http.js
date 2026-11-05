export async function requestJSON(url, options = {}, label = 'API', timeout = 15000) {
  let response;
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(timeout) }); }
  catch (error) {
    throw new Error(error.name === 'TimeoutError' ? `${label} 응답 시간이 초과됐습니다.` : `${label} 연결에 실패했습니다. 네트워크 또는 브라우저 요청 차단 여부를 확인해 주세요.`, { cause: error });
  }
  if (!response.ok) {
    const error = new Error(`${label} HTTP 오류: ${response.status}${response.status === 429 ? ' (요청 제한, 잠시 후 다시 시도하세요)' : ''}`);
    error.status = response.status;
    throw error;
  }
  let data;
  try { data = await response.json(); }
  catch (error) { throw new Error(`${label} 응답을 해석하지 못했습니다.`, { cause: error }); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${label} 응답 형식이 올바르지 않습니다.`);
  return data;
}
