const paths = {
  home: "m3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18",
  shield: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6",
  layers: "m12 2 10 5-10 5L2 7Zm-10 10 10 5 10-5M2 17l10 5 10-5",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  info: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0M12 11v6M12 7h.01",
  search: "M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0m-2 6 6 6",
  server: "M5 3h14a2 2 0 0 1 2 2v4H3V5a2 2 0 0 1 2-2Zm-2 12h18v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2ZM7 6h.01M7 18h.01M3 9v6m18-6v6",
  alert: "m12 3 10 17H2ZM12 9v4m0 3h.01",
  chevron: "m9 5 7 7-7 7",
  network: "M12 8V4m0 4-7 8m7-8 7 8M15 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0M8 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0m14 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  check: "M9 3H3v18h18V10M8 11l4 4L22 3",
  box: "m12 2 10 5v10l-10 5-10-5V7Zm0 10v10M2 7l10 5 10-5",
};
export default function Icon({ name }) {
  return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.shield} /></svg>;
}
