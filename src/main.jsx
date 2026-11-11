// 앱 시작 지점입니다. App을 HTML의 root 요소에 연결하고 공통 CSS를 불러옵니다.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
