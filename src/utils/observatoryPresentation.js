export const OBSERVATORY_GROUPS = [
  { id: 'improve', title: '개선 권장', english: 'Recommended Improvements', description: 'Mozilla 평가 기준에 미달한 설정입니다. 서비스 환경에 맞게 우선 점검하세요. 실제 공격이 확인됐다는 뜻은 아닙니다.' },
  { id: 'optional', title: '선택적 추가 보호', english: 'Optional Protections', description: '서비스 기능과 호환성에 따라 선택하는 설정입니다. 모두 켜야 하는 필수 보안 항목은 아닙니다.' },
  { id: 'passed', title: '이번 평가 기준 충족', english: 'Passed Checks', description: '이 항목은 Mozilla 기준을 충족했습니다. 다른 항목이나 사이트 전체의 안전성을 보장하지는 않습니다.' },
  { id: 'reference', title: '참고 · 판단 보류', english: 'Reference / Not Assessed', description: '미사용·기본 정책·정보 부족 등으로 해석을 구분해야 하는 항목입니다. 안전 또는 취약으로 단정하지 않습니다.' },
];
const OPTIONAL_KEYS = new Set(['cross-origin-opener-policy', 'cross-origin-embedder-policy', 'cross-origin-resource-policy']);
export function getTestPresentation(key, test) {
  if (OPTIONAL_KEYS.has(key)) {
    if (typeof test.result === 'string' && test.result.endsWith('not-implemented')) return { group: 'optional', label: '선택 설정 없음', english: 'Optional · Not configured', tone: '', expanded: false };
    return { group: 'optional', label: test.pass === false ? '선택 설정 점검' : test.pass === true ? '선택 설정 적용' : '판단하지 않음', english: test.pass === false ? 'Optional · Review configuration' : test.pass === true ? 'Optional · Configured' : 'Not assessed', tone: '', expanded: false };
  }
  if (test.pass === false) return { group: 'improve', label: '개선 권장', english: 'Needs Improvement', tone: 'warning', expanded: true };
  if (test.pass === true && !(typeof test.result === 'string' && test.result.includes('not-implemented'))) return { group: 'passed', label: '기준 충족', english: 'Passed', tone: 'success', expanded: false };
  return { group: 'reference', label: '판단하지 않음', english: 'Not assessed', tone: '', expanded: false };
}
