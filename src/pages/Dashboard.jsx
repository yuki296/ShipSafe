import WebsiteScan from './WebsiteScan.jsx';
// 동일한 검사 UI를 두 메뉴에서 재사용해 결과와 배치를 유지한다.
export default function Dashboard(props) { return <WebsiteScan {...props} />; }
