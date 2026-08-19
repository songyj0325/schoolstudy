(function () {
  const main = document.getElementById("curriculumMain");

  function render() {
    main.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const topics = TOPICS.filter((t) => t.category === cat.id);
      if (topics.length === 0) return;

      const block = document.createElement("div");
      block.className = "subject-block";

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "subject-toggle";
      toggle.innerHTML = `
        <span class="dot" style="background:${cat.color}"></span>
        <span class="subject-name">${cat.label}</span>
        <span class="subject-count">${topics.length}개 주제</span>
        <span class="chevron">▾</span>
      `;
      toggle.addEventListener("click", () => {
        block.classList.toggle("open");
      });

      const topicsWrap = document.createElement("div");
      topicsWrap.className = "subject-topics";
      const list = document.createElement("div");
      list.className = "topic-chip-list";
      topics.forEach((t) => {
        const link = document.createElement("a");
        link.className = "topic-chip-link";
        link.href = `notes.html?topic=${encodeURIComponent(t.id)}`;
        link.textContent = t.title;
        list.appendChild(link);
      });
      topicsWrap.appendChild(list);

      block.appendChild(toggle);
      block.appendChild(topicsWrap);
      main.appendChild(block);
    });
  }

  render();
})();
