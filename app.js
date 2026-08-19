(function () {
  const catRail = document.getElementById("categoryRail");
  const topicGrid = document.getElementById("topicGrid");
  const emptyState = document.getElementById("emptyState");
  const resultsHeader = document.getElementById("resultsHeader");
  const resultsTitle = document.getElementById("resultsTitle");
  const clearBtn = document.getElementById("clearBtn");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const topicCount = document.getElementById("topicCount");
  const detailOverlay = document.getElementById("detailOverlay");
  const detailClose = document.getElementById("detailClose");
  const detailTag = document.getElementById("detailTag");
  const detailTitle = document.getElementById("detailTitle");
  const detailSummary = document.getElementById("detailSummary");
  const detailBody = document.getElementById("detailBody");

  const catMap = {};
  CATEGORIES.forEach((c) => (catMap[c.id] = c));

  topicCount.textContent = TOPICS.length;

  let activeCategory = null; // null = 전체

  // ---------- 카테고리 칩 렌더 ----------
  function renderCategoryRail() {
    catRail.innerHTML = "";
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-chip" + (activeCategory === cat.id ? " active" : "");
      if (activeCategory === cat.id) btn.style.background = cat.color;
      btn.innerHTML = `<span class="dot" style="background:${cat.color}"></span>${cat.label}`;
      btn.addEventListener("click", () => {
        searchInput.value = "";
        activeCategory = activeCategory === cat.id ? null : cat.id;
        renderCategoryRail();
        applyFilter();
      });
      catRail.appendChild(btn);
    });
  }

  // ---------- 검색/필터 ----------
  function matchesQuery(topic, query) {
    if (!query) return true;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (topic.title.toLowerCase().includes(q)) return true;
    return topic.keywords.some((k) => k.toLowerCase().includes(q));
  }

  function applyFilter() {
    const query = searchInput.value.trim();
    let list = TOPICS;

    if (activeCategory) {
      list = list.filter((t) => t.category === activeCategory);
    }
    if (query) {
      list = list.filter((t) => matchesQuery(t, query));
    }

    renderGrid(list, query);
  }

  function renderGrid(list, query) {
    topicGrid.innerHTML = "";

    const showHeader = !!query || !!activeCategory;
    resultsHeader.hidden = !showHeader;
    if (showHeader) {
      if (query) {
        resultsTitle.textContent = `"${query}" 검색 결과 (${list.length}개)`;
      } else if (activeCategory) {
        resultsTitle.textContent = `${catMap[activeCategory].label} (${list.length}개)`;
      }
    }

    if (list.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    list.forEach((topic) => {
      const cat = catMap[topic.category];
      const card = document.createElement("button");
      card.type = "button";
      card.className = "topic-card";
      card.style.borderLeftColor = cat.color;
      card.innerHTML = `
        <p class="cat-label" style="color:${cat.color}">${cat.label}</p>
        <h3>${topic.title}</h3>
        <p>${topic.summary}</p>
      `;
      card.addEventListener("click", () => openDetail(topic));
      topicGrid.appendChild(card);
    });
  }

  // ---------- 상세보기 ----------
  function openDetail(topic) {
    const cat = catMap[topic.category];
    detailTag.textContent = cat.label;
    detailTag.style.color = cat.color;
    detailTitle.textContent = topic.title;
    detailSummary.textContent = topic.summary;
    detailBody.innerHTML = topic.content.map((p) => `<p>${p}</p>`).join("");
    detailOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeDetail() {
    detailOverlay.hidden = true;
    document.body.style.overflow = "";
  }

  detailClose.addEventListener("click", closeDetail);
  detailOverlay.addEventListener("click", (e) => {
    if (e.target === detailOverlay) closeDetail();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !detailOverlay.hidden) closeDetail();
  });

  // ---------- 검색 폼 ----------
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    activeCategory = null;
    renderCategoryRail();
    applyFilter();
  });

  searchInput.addEventListener("input", () => {
    if (!searchInput.value.trim()) {
      applyFilter();
    }
  });

  clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    activeCategory = null;
    renderCategoryRail();
    applyFilter();
  });

  // ---------- 초기 렌더 ----------
  renderCategoryRail();
  renderGrid(TOPICS, "");

  // 목차 페이지 등에서 ?topic=id 로 들어온 경우 해당 주제를 자동으로 엶
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTopicId = urlParams.get("topic");
  if (requestedTopicId) {
    const requestedTopic = TOPICS.find((t) => t.id === requestedTopicId);
    if (requestedTopic) openDetail(requestedTopic);
  }
})();
