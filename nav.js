(function () {
  const PAGES = [
    { href: "index.html", label: "파일함" },
    { href: "notes.html", label: "학습노트" },
    { href: "curriculum.html", label: "과목 목차" },
  ];

  function currentFile() {
    const path = window.location.pathname;
    const file = path.substring(path.lastIndexOf("/") + 1);
    return file === "" ? "index.html" : file;
  }

  function renderNav() {
    const mount = document.getElementById("siteNav");
    if (!mount) return;
    const current = currentFile();
    const links = PAGES.map((p) => {
      const active = p.href === current ? " active" : "";
      return `<a class="nav-link${active}" href="${p.href}">${p.label}</a>`;
    }).join("");
    mount.innerHTML = `
      <div class="nav-inner">
        <span class="nav-brand">schoolstudy</span>
        <nav class="nav-links">${links}</nav>
      </div>
    `;
  }

  document.addEventListener("DOMContentLoaded", renderNav);
})();
