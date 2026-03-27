(function () {
  const participantActions = window.DashboardParticipantActions || {};
  const getParticipantDisplayNameFromRow =
    participantActions.getParticipantDisplayNameFromRow ||
    function () {
      return "";
    };
  const getParticipantNumberFromRow =
    participantActions.getParticipantNumberFromRow ||
    function () {
      return "";
    };
  const findRenderedMediaButton =
    participantActions.findRenderedMediaButton ||
    function () {
      return null;
    };
  const triggerKickWithConfirmation =
    participantActions.triggerKickWithConfirmation ||
    function () {};
  const applyParticipantMediaChange =
    participantActions.applyParticipantMediaChange ||
    async function () {};

  function initParticipantContextMenu() {
    if (document.body.dataset.participantContextBound === "1") {
      return;
    }

    const tableBody = document.querySelector(".active-conferences-scroll tbody");
    const zoomGrid = document.querySelector(".zoom-grid");
    const zoomStage = document.querySelector(".zoom-stage");
    if (!tableBody || !zoomGrid || !zoomStage) {
      return;
    }

    document.body.dataset.participantContextBound = "1";

    const menu = document.createElement("div");
    menu.className = "participant-context-menu";
    menu.hidden = true;
    menu.innerHTML =
      '<button type="button" class="participant-context-menu__item" data-action="audio"></button>' +
      '<button type="button" class="participant-context-menu__item" data-action="camera"></button>' +
      '<button type="button" class="participant-context-menu__item" data-action="video"></button>' +
      '<button type="button" class="participant-context-menu__item" data-action="mic"></button>' +
      '<button type="button" class="participant-context-menu__item" data-action="presentation"></button>' +
      '<button type="button" class="participant-context-menu__item is-danger" data-action="disconnect">Disconnect</button>';
    document.body.appendChild(menu);

    let activeRow = null;
    let activeTile = null;
    let activeParticipantNumber = "";

    function normalizeName(value) {
      return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    }

    function getTileName(tile) {
      if (!tile) {
        return "";
      }

      const siteName = String(tile.dataset.siteName || "").trim();
      if (siteName) {
        return siteName;
      }

      const label = tile.querySelector(".zoom-label");
      return label ? String(label.textContent || "").trim() : "";
    }

    function getRowName(row) {
      const displayName = getParticipantDisplayNameFromRow(row);
      const normalizedDisplay = normalizeName(displayName);
      if (
        normalizedDisplay &&
        normalizedDisplay !== "-" &&
        normalizedDisplay !== "--"
      ) {
        return displayName;
      }

      const participantNumber = getParticipantNumberFromRow(row);
      if (participantNumber) {
        return participantNumber;
      }

      const idCell = row && row.children ? row.children[0] : null;
      if (!idCell) {
        return "";
      }

      return String(idCell.getAttribute("title") || idCell.textContent || "").trim();
    }

    function findRowByName(name) {
      const normalized = normalizeName(name);
      if (!normalized) {
        return null;
      }

      const rows = Array.from(tableBody.querySelectorAll("tr")).filter(function (
        row,
      ) {
        return !row.classList.contains("participant-empty-row");
      });

      return (
        rows.find(function (row) {
          const candidates = [];

          const rowName = getRowName(row);
          if (rowName) {
            candidates.push(rowName);
          }

          const participantNumber = getParticipantNumberFromRow(row);
          if (participantNumber) {
            candidates.push(participantNumber);
          }

          const idCell = row && row.children ? row.children[0] : null;
          if (idCell) {
            const idTitle = String(idCell.getAttribute("title") || "").trim();
            const idText = String(idCell.textContent || "").trim();
            if (idTitle) candidates.push(idTitle);
            if (idText) candidates.push(idText);
          }

          return candidates.some(function (candidate) {
            return normalizeName(candidate) === normalized;
          });
        }) || null
      );
    }

    function findTileByName(name) {
      const normalized = normalizeName(name);
      if (!normalized) {
        return null;
      }

      const tiles = Array.from(
        zoomGrid.querySelectorAll(".zoom-tile:not(.zoom-overlay-tile)"),
      );
      return (
        tiles.find(function (tile) {
          return normalizeName(getTileName(tile)) === normalized;
        }) || null
      );
    }

    function getLinkedTile(row) {
      return findTileByName(getRowName(row));
    }

    function getLinkedRow(tile) {
      return findRowByName(getTileName(tile));
    }

    function getMediaButton(row, mediaType) {
      if (!row) {
        return null;
      }
      return row.querySelector(".media-toggle." + mediaType);
    }

    function findRowByParticipantNumber(participantNumber) {
      const normalized = String(participantNumber || "").trim();
      if (!normalized) {
        return null;
      }

      const rows = Array.from(tableBody.querySelectorAll("tr")).filter(function (
        row,
      ) {
        return !row.classList.contains("participant-empty-row");
      });

      return (
        rows.find(function (row) {
          return getParticipantNumberFromRow(row) === normalized;
        }) || null
      );
    }

    function resolveActiveRow() {
      if (activeParticipantNumber) {
        const rowByNumber = findRowByParticipantNumber(activeParticipantNumber);
        if (rowByNumber) {
          activeRow = rowByNumber;
          return rowByNumber;
        }
      }

      if (activeRow && document.contains(activeRow)) {
        return activeRow;
      }

      return null;
    }

    function resolveActiveTile(row) {
      if (activeTile && document.contains(activeTile)) {
        return activeTile;
      }

      const linkedTile = getLinkedTile(row);
      if (linkedTile) {
        activeTile = linkedTile;
      }
      return linkedTile;
    }

    function setItemLabel(action, text) {
      const item = menu.querySelector('[data-action="' + action + '"]');
      if (item) {
        item.textContent = text;
      }
    }

    function updateMenuLabels() {
      const row = resolveActiveRow();
      if (!row) {
        return;
      }

      const audioButton = getMediaButton(row, "audio");
      const cameraButton = getMediaButton(row, "camera");
      const videoButton = getMediaButton(row, "video");
      const micButton = getMediaButton(row, "mic");
      const presentationOn = row.dataset.presentationState === "on";

      setItemLabel(
        "audio",
        audioButton && audioButton.classList.contains("is-on")
          ? "Turn off audio"
          : "Turn on audio",
      );
      setItemLabel(
        "camera",
        cameraButton && cameraButton.classList.contains("is-on")
          ? "Turn off camera"
          : "Turn on camera",
      );
      setItemLabel(
        "video",
        videoButton && videoButton.classList.contains("is-on")
          ? "Turn off video"
          : "Turn on video",
      );
      setItemLabel(
        "mic",
        micButton && micButton.classList.contains("is-on")
          ? "Turn off mic"
          : "Turn on mic",
      );
      setItemLabel(
        "presentation",
        presentationOn ? "Disable presentation" : "Show presentation",
      );
    }

    function closeMenu() {
      menu.hidden = true;
      activeRow = null;
      activeTile = null;
      activeParticipantNumber = "";
    }

    function openMenu(x, y, row, tile) {
      activeRow = row;
      activeParticipantNumber = getParticipantNumberFromRow(row);
      activeTile = tile || getLinkedTile(row);
      updateMenuLabels();

      menu.hidden = false;
      menu.style.left = "0px";
      menu.style.top = "0px";

      const menuWidth = menu.offsetWidth;
      const menuHeight = menu.offsetHeight;
      const maxLeft = Math.max(window.innerWidth - menuWidth - 8, 8);
      const maxTop = Math.max(window.innerHeight - menuHeight - 8, 8);

      menu.style.left = Math.max(8, Math.min(x, maxLeft)) + "px";
      menu.style.top = Math.max(8, Math.min(y, maxTop)) + "px";
    }

    tableBody.addEventListener("contextmenu", function (event) {
      const row = event.target.closest("tr");
      if (!row || row.classList.contains("participant-empty-row")) {
        return;
      }

      event.preventDefault();
      openMenu(event.clientX, event.clientY, row, getLinkedTile(row));
    });

    zoomStage.addEventListener("contextmenu", function (event) {
      const tile = event.target.closest(".zoom-tile:not(.zoom-overlay-tile)");
      if (!tile) {
        return;
      }

      const row = getLinkedRow(tile);
      if (!row) {
        return;
      }

      event.preventDefault();
      openMenu(event.clientX, event.clientY, row, tile);
    });

    menu.addEventListener("click", async function (event) {
      const item = event.target.closest(".participant-context-menu__item");
      if (!item) {
        return;
      }

      const row = resolveActiveRow();
      if (!row) {
        closeMenu();
        return;
      }

      const action = item.dataset.action || "";

      if (action === "disconnect") {
        closeMenu();
        triggerKickWithConfirmation(row);
        return;
      }

      if (action === "presentation") {
        const nextState = row.dataset.presentationState === "on" ? "off" : "on";
        row.dataset.presentationState = nextState;
        const tile = resolveActiveTile(row);
        if (tile) {
          tile.classList.toggle("is-presentation", nextState === "on");
        }
        updateMenuLabels();
        return;
      }

      const participantNumber = getParticipantNumberFromRow(row);
      const mediaButton =
        getMediaButton(row, action) ||
        findRenderedMediaButton(participantNumber, action);
      if (!mediaButton) {
        return;
      }

      const shouldBeOn = !mediaButton.classList.contains("is-on");
      await applyParticipantMediaChange(mediaButton, shouldBeOn, {
        mediaType: action,
        participantNumber: participantNumber,
      });
      updateMenuLabels();
    });

    document.addEventListener("click", function (event) {
      if (menu.hidden) {
        return;
      }
      if (menu.contains(event.target)) {
        return;
      }
      closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    window.addEventListener("resize", closeMenu);
    window.addEventListener(
      "scroll",
      function () {
        if (!menu.hidden) {
          closeMenu();
        }
      },
      true,
    );
  }

  window.DashboardParticipantContextMenu = {
    initParticipantContextMenu: initParticipantContextMenu,
  };
})();
