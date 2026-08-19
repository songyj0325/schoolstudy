(function () {
  const DB_NAME = "schoolstudy-vault";
  const DB_VERSION = 1;
  let db;

  const folderRail = document.getElementById("folderRail");
  const fileGrid = document.getElementById("fileGrid");
  const vaultEmpty = document.getElementById("vaultEmpty");
  const newFolderBtn = document.getElementById("newFolderBtn");
  const fileInput = document.getElementById("fileInput");

  const viewerOverlay = document.getElementById("viewerOverlay");
  const viewerFilename = document.getElementById("viewerFilename");
  const viewerImage = document.getElementById("viewerImage");
  const viewerPdf = document.getElementById("viewerPdf");
  const viewerCanvas = document.getElementById("viewerCanvas");
  const viewerCloseBtn = document.getElementById("viewerCloseBtn");
  const penToggleBtn = document.getElementById("penToggleBtn");
  const clearNoteBtn = document.getElementById("clearNoteBtn");

  let activeFolderId = "all";
  let currentViewingFile = null;
  let penActive = false;
  let drawing = false;
  const ctx = viewerCanvas.getContext("2d");

  // ---------- IndexedDB 초기화 ----------
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const _db = req.result;
        if (!_db.objectStoreNames.contains("folders")) {
          _db.createObjectStore("folders", { keyPath: "id" });
        }
        if (!_db.objectStoreNames.contains("files")) {
          const store = _db.createObjectStore("files", { keyPath: "id" });
          store.createIndex("folderId", "folderId");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function tx(storeName, mode) {
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  function getAll(storeName) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, "readonly").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function put(storeName, value) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, "readwrite").put(value);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function del(storeName, id) {
    return new Promise((resolve, reject) => {
      const req = tx(storeName, "readwrite").delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---------- 폴더 ----------
  async function renderFolders() {
    const folders = await getAll("folders");
    folderRail.innerHTML = "";

    const allChip = document.createElement("button");
    allChip.type = "button";
    allChip.className = "folder-chip" + (activeFolderId === "all" ? " active" : "");
    allChip.textContent = "전체";
    allChip.addEventListener("click", () => {
      activeFolderId = "all";
      renderFolders();
      renderFiles();
    });
    folderRail.appendChild(allChip);

    folders.forEach((f) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "folder-chip" + (activeFolderId === f.id ? " active" : "");
      chip.textContent = f.name;
      chip.addEventListener("click", () => {
        activeFolderId = f.id;
        renderFolders();
        renderFiles();
      });
      folderRail.appendChild(chip);
    });
  }

  newFolderBtn.addEventListener("click", async () => {
    const name = prompt("새 폴더 이름을 입력하세요");
    if (!name || !name.trim()) return;
    const folder = { id: uid(), name: name.trim() };
    await put("folders", folder);
    activeFolderId = folder.id;
    renderFolders();
    renderFiles();
  });

  // ---------- 파일 ----------
  async function renderFiles() {
    const allFiles = await getAll("files");
    const files =
      activeFolderId === "all"
        ? allFiles
        : allFiles.filter((f) => f.folderId === activeFolderId);

    fileGrid.innerHTML = "";
    vaultEmpty.hidden = files.length > 0;

    files.forEach((f) => {
      const card = document.createElement("div");
      card.className = "file-card";

      const thumb = document.createElement("div");
      thumb.className = "thumb";
      if (f.type.startsWith("image/")) {
        const img = document.createElement("img");
        img.src = URL.createObjectURL(f.blob);
        thumb.appendChild(img);
      } else {
        thumb.textContent = "📄";
      }

      const nameEl = document.createElement("div");
      nameEl.className = "file-name";
      nameEl.textContent = f.name;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "delete-btn";
      delBtn.textContent = "✕";
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm(`"${f.name}" 파일을 삭제할까요?`)) {
          await del("files", f.id);
          renderFiles();
        }
      });

      card.appendChild(thumb);
      card.appendChild(nameEl);
      card.appendChild(delBtn);
      card.addEventListener("click", () => openViewer(f));
      fileGrid.appendChild(card);
    });
  }

  fileInput.addEventListener("change", async (e) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const record = {
        id: uid(),
        folderId: activeFolderId === "all" ? null : activeFolderId,
        name: file.name,
        type: file.type,
        blob: file,
        noteDataUrl: null,
      };
      await put("files", record);
    }
    fileInput.value = "";
    renderFiles();
  });

  // ---------- 뷰어 ----------
  function openViewer(fileRecord) {
    currentViewingFile = fileRecord;
    viewerFilename.textContent = fileRecord.name;
    viewerImage.hidden = true;
    viewerPdf.hidden = true;
    penActive = false;
    penToggleBtn.classList.remove("active");

    const url = URL.createObjectURL(fileRecord.blob);

    if (fileRecord.type.startsWith("image/")) {
      viewerImage.hidden = false;
      viewerImage.onload = () => setupCanvas(fileRecord);
      viewerImage.src = url;
    } else {
      viewerPdf.hidden = false;
      viewerPdf.src = url;
      viewerCanvas.style.display = "none";
    }

    viewerOverlay.hidden = false;
  }

  function setupCanvas(fileRecord) {
    viewerCanvas.style.display = "block";
    const rect = viewerImage.getBoundingClientRect();
    viewerCanvas.width = viewerImage.naturalWidth;
    viewerCanvas.height = viewerImage.naturalHeight;
    viewerCanvas.style.width = rect.width + "px";
    viewerCanvas.style.height = rect.height + "px";
    viewerCanvas.style.left = viewerImage.offsetLeft + "px";
    viewerCanvas.style.top = viewerImage.offsetTop + "px";

    ctx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
    if (fileRecord.noteDataUrl) {
      const noteImg = new Image();
      noteImg.onload = () => ctx.drawImage(noteImg, 0, 0);
      noteImg.src = fileRecord.noteDataUrl;
    }
  }

  function canvasPoint(e) {
    const rect = viewerCanvas.getBoundingClientRect();
    const scaleX = viewerCanvas.width / rect.width;
    const scaleY = viewerCanvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function startDraw(e) {
    if (!penActive) return;
    drawing = true;
    const p = canvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.strokeStyle = "#E8503A";
    ctx.lineWidth = Math.max(3, viewerCanvas.width / 250);
    ctx.lineCap = "round";
  }

  function moveDraw(e) {
    if (!penActive || !drawing) return;
    const p = canvasPoint(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    e.preventDefault();
  }

  async function endDraw() {
    if (!penActive || !drawing) return;
    drawing = false;
    if (currentViewingFile) {
      currentViewingFile.noteDataUrl = viewerCanvas.toDataURL("image/png");
      await put("files", currentViewingFile);
    }
  }

  viewerCanvas.addEventListener("mousedown", startDraw);
  viewerCanvas.addEventListener("mousemove", moveDraw);
  window.addEventListener("mouseup", endDraw);
  viewerCanvas.addEventListener("touchstart", startDraw, { passive: true });
  viewerCanvas.addEventListener("touchmove", moveDraw, { passive: false });
  viewerCanvas.addEventListener("touchend", endDraw);

  penToggleBtn.addEventListener("click", () => {
    penActive = !penActive;
    penToggleBtn.classList.toggle("active", penActive);
  });

  clearNoteBtn.addEventListener("click", async () => {
    if (!currentViewingFile) return;
    ctx.clearRect(0, 0, viewerCanvas.width, viewerCanvas.height);
    currentViewingFile.noteDataUrl = null;
    await put("files", currentViewingFile);
  });

  viewerCloseBtn.addEventListener("click", () => {
    viewerOverlay.hidden = true;
    currentViewingFile = null;
    renderFiles();
  });

  // ---------- 초기화 ----------
  openDB()
    .then((_db) => {
      db = _db;
      renderFolders();
      renderFiles();
    })
    .catch((err) => {
      console.error("파일함 초기화 실패", err);
    });
})();
