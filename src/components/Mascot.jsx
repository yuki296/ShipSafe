const images = { blue: "21 002", purple: "21 006", green: "21 005", group: "21 001", detective: "21 003", guard: "21 004" };
export default function Mascot({ color = "blue" }) {
  const filename = `KakaoTalk_Photo_2026-11-05-17-30-${images[color] || images.blue}.png`;
  return <img className={`mascot mascot-${color}`} src={`/images/${encodeURIComponent(filename)}`} alt="" aria-hidden="true" />;
}
