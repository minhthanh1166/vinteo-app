(function () {
  const participantActions = window.DashboardParticipantActions || {};
  const participantContextMenu = window.DashboardParticipantContextMenu || {};
  const initMicToggle = participantActions.initMicToggle || function () {};
  const initParticipantMediaToggles =
    participantActions.initParticipantMediaToggles || function () {};
  const initKickMemberButtons =
    participantActions.initKickMemberButtons || function () {};
  const initFastCallButton =
    participantActions.initFastCallButton || function () {};
  const initParticipantContextMenu =
    participantContextMenu.initParticipantContextMenu || function () {};

  function initMediaSortButtons() {
    const table = document.querySelector(".active-conferences-scroll table");
    const tableBody = table ? table.querySelector("tbody") : null;
    const sortButtons = document.querySelectorAll(".media-sort-btn");
    if (!tableBody || !sortButtons.length) return;

    function getMediaStateWeight(row, mediaType) {
      const toggle = row.querySelector(".media-toggle." + mediaType);
      if (!toggle) return -1;
      return toggle.classList.contains("is-on") ? 1 : 0;
    }

    function getStatusBucket(row) {
      const statusCell = row.querySelector("td.state");
      if (!statusCell) return "other";

      const text = String(statusCell.textContent || "").trim().toLowerCase();
      if (text.includes("disconnect")) return "disconnected";
      if (text.includes("standby") || text.includes("schedule")) return "standby";
      if (text.includes("connect")) return "connected";

      if (statusCell.classList.contains("crit")) return "disconnected";
      if (statusCell.classList.contains("warn")) return "standby";
      if (statusCell.classList.contains("ok")) return "connected";

      return "other";
    }

    function getStatusWeight(row, mode) {
      const bucket = getStatusBucket(row);
      const rankings = {
        "connected-first": {
          connected: 3,
          standby: 2,
          disconnected: 1,
          other: 0,
        },
        "disconnected-first": {
          disconnected: 3,
          connected: 2,
          standby: 1,
          other: 0,
        },
        "standby-first": {
          standby: 3,
          connected: 2,
          disconnected: 1,
          other: 0,
        },
      };
      const rankMap = rankings[mode] || rankings["connected-first"];
      return rankMap[bucket] ?? 0;
    }

    sortButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        const mediaType = button.dataset.sortMedia;
        const sortField = button.dataset.sortField;
        if (!mediaType && sortField !== "status") return;

        const direction = button.dataset.sortDirection || "off-first";
        const statusMode = button.dataset.sortStatusMode || "connected-first";
        const rows = Array.from(tableBody.querySelectorAll("tr")).map(function (
          row,
          index,
        ) {
          return { row: row, index: index };
        });

        rows.sort(function (a, b) {
          if (
            a.row.classList.contains("participant-empty-row") ||
            b.row.classList.contains("participant-empty-row")
          ) {
            return a.index - b.index;
          }

          const aWeight =
            sortField === "status"
              ? getStatusWeight(a.row, statusMode)
              : getMediaStateWeight(a.row, mediaType);
          const bWeight =
            sortField === "status"
              ? getStatusWeight(b.row, statusMode)
              : getMediaStateWeight(b.row, mediaType);

          if (aWeight !== bWeight) {
            if (sortField === "status") {
              return bWeight - aWeight;
            }
            if (direction === "off-first") {
              return aWeight - bWeight;
            }
            return bWeight - aWeight;
          }

          return a.index - b.index;
        });

        rows.forEach(function (entry) {
          tableBody.appendChild(entry.row);
        });

        if (sortField === "status") {
          const nextMode =
            statusMode === "connected-first"
              ? "disconnected-first"
              : statusMode === "disconnected-first"
                ? "standby-first"
                : "connected-first";
          button.dataset.sortStatusMode = nextMode;
          const label =
            nextMode === "connected-first"
              ? "Connected first"
              : nextMode === "disconnected-first"
                ? "Disconnected first"
                : "Standby first";
          button.title = "Sort status (" + label + ")";
          button.setAttribute("aria-label", "Sort status (" + label + ")");
        } else {
          button.dataset.sortDirection =
            direction === "off-first" ? "on-first" : "off-first";
        }
      });
    });
  }

  function initSystemTimeClock() {
    const systemTimeValue = document.getElementById("system-time-value");
    if (!systemTimeValue) return;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    function pad2(value) {
      return String(value).padStart(2, "0");
    }

    function renderTime() {
      const now = new Date();
      const text =
        pad2(now.getDate()) +
        "-" +
        monthNames[now.getMonth()] +
        "-" +
        now.getFullYear() +
        " " +
        pad2(now.getHours()) +
        ":" +
        pad2(now.getMinutes()) +
        ":" +
        pad2(now.getSeconds());
      systemTimeValue.textContent = text;
    }

    renderTime();
    window.setInterval(renderTime, 1000);
  }

  function initLeaveConferenceConfirm() {
    const leaveButton = document.querySelector(".zoom-control-btn.leave");
    const popupManager = window.DashboardPopupManager;
    const leavePopup =
      popupManager && typeof popupManager.createConfirmPopup === "function"
        ? popupManager.createConfirmPopup({
            modalId: "leave-confirm-modal",
            messageSelector: "#leave-confirm-message",
            confirmSelector: "[data-leave-confirm]",
            cancelSelector: "[data-leave-cancel]",
            closeSelector: "[data-leave-modal-close]",
          })
        : null;

    if (!leaveButton) return;

    leaveButton.addEventListener("click", function () {
      const usedModal =
        leavePopup &&
        leavePopup.open({
          message: "Are you sure you want to leave this meeting?",
          onConfirm: function () {},
        });
      if (usedModal) return;
      window.confirm("Are you sure you want to leave this meeting?");
    });
  }

  function initConferenceSearch() {
    const searchInput = document.getElementById("conference-search-input");

    if (!searchInput) return;

    function normalizeSearchText(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function applyConferenceFilter() {
      const query = normalizeSearchText(searchInput.value);
      const conferenceItems = Array.from(
        document.querySelectorAll(".conference-list .conference-item"),
      );

      conferenceItems.forEach(function (item) {
        const numberText = normalizeSearchText(item.dataset.number);
        const descriptionText = normalizeSearchText(item.dataset.description);
        const itemText = normalizeSearchText(
          item.textContent || numberText + " " + descriptionText,
        );
        const matched =
          query.length === 0 ||
          numberText.includes(query) ||
          descriptionText.includes(query) ||
          itemText.includes(query);
        item.hidden = !matched;
        item.style.display = matched ? "" : "none";
      });

      syncConferenceListHeight();
    }

    searchInput.addEventListener("input", applyConferenceFilter);
    searchInput.addEventListener("search", applyConferenceFilter);
    searchInput.addEventListener("change", applyConferenceFilter);
  }

  function initParticipantSearch() {
    const searchInput = document.getElementById("participant-search-input");
    const table = document.querySelector(".active-conferences-scroll table");
    const tableBody = table ? table.querySelector("tbody") : null;

    if (!searchInput || !tableBody) return;
    if (searchInput.dataset.filterBound === "1") return;
    searchInput.dataset.filterBound = "1";

    function normalizeSearchText(value) {
      return String(value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function removeSearchEmptyRow() {
      const searchEmptyRow = tableBody.querySelector(
        "tr.participant-search-empty-row",
      );
      if (searchEmptyRow) {
        searchEmptyRow.remove();
      }
    }

    function ensureSearchEmptyRow() {
      let searchEmptyRow = tableBody.querySelector(
        "tr.participant-search-empty-row",
      );
      if (!searchEmptyRow) {
        searchEmptyRow = document.createElement("tr");
        searchEmptyRow.className = "participant-empty-row participant-search-empty-row";
        const cell = document.createElement("td");
        const headerCount = table
          ? table.querySelectorAll("thead th").length
          : 12;
        cell.colSpan = headerCount > 0 ? headerCount : 12;
        cell.textContent = "No matched participants";
        searchEmptyRow.appendChild(cell);
        tableBody.appendChild(searchEmptyRow);
      }
      return searchEmptyRow;
    }

    function applyParticipantFilter() {
      const query = normalizeSearchText(searchInput.value);
      const hasBaseEmptyRow = Boolean(
        tableBody.querySelector(
          "tr.participant-empty-row:not(.participant-search-empty-row)",
        ),
      );

      if (hasBaseEmptyRow) {
        removeSearchEmptyRow();
        return;
      }

      const rows = Array.from(tableBody.querySelectorAll("tr")).filter(function (
        row,
      ) {
        return (
          !row.classList.contains("participant-empty-row") &&
          !row.classList.contains("participant-search-empty-row")
        );
      });

      let visibleCount = 0;
      rows.forEach(function (row) {
        const idCell = row.children[0] || null;
        const nameCell = row.children[1] || null;
        const idText = normalizeSearchText(
          idCell ? idCell.getAttribute("title") || idCell.textContent || "" : "",
        );
        const nameText = normalizeSearchText(
          nameCell
            ? nameCell.getAttribute("title") || nameCell.textContent || ""
            : "",
        );
        const matched =
          query.length === 0 || idText.includes(query) || nameText.includes(query);

        row.hidden = !matched;
        row.style.display = matched ? "" : "none";
        if (matched) {
          visibleCount += 1;
        }
      });

      if (query.length > 0 && rows.length > 0 && visibleCount === 0) {
        const searchEmptyRow = ensureSearchEmptyRow();
        searchEmptyRow.hidden = false;
        searchEmptyRow.style.display = "";
      } else {
        removeSearchEmptyRow();
      }
    }

    searchInput.addEventListener("input", applyParticipantFilter);
    searchInput.addEventListener("search", applyParticipantFilter);
    searchInput.addEventListener("change", applyParticipantFilter);
    document.addEventListener(
      "dashboard:participant-list-updated",
      applyParticipantFilter,
    );

    applyParticipantFilter();
  }

  function syncParticipantListHeight() {
    const stage = document.querySelector(".split-main .zoom-stage");
    const participantBoxes = Array.from(document.querySelectorAll(".info-grid .box"));

    if (!stage || participantBoxes.length === 0) return;

    if (window.matchMedia("(max-width: 1100px)").matches) {
      participantBoxes.forEach(function (box) {
        const body = box.querySelector(".sync-panel-body");
        box.style.height = "";
        box.style.maxHeight = "";
        if (body) {
          body.style.height = "";
          body.style.maxHeight = "";
        }
      });
      return;
    }

    const stageHeight = Math.floor(stage.getBoundingClientRect().height);

    participantBoxes.forEach(function (box) {
      const participantBody = box.querySelector(".sync-panel-body");
      const boxHead = box.querySelector(".box-head");

      if (!participantBody) return;

      const headHeight = boxHead ? Math.ceil(boxHead.getBoundingClientRect().height) : 0;
      const bodyHeight = Math.max(stageHeight - headHeight - 2, 120);

      box.style.height = stageHeight + "px";
      box.style.maxHeight = stageHeight + "px";
      participantBody.style.height = bodyHeight + "px";
      participantBody.style.maxHeight = bodyHeight + "px";
    });
  }

  function syncConferenceListHeight() {
    const activeConferences = document.querySelector(".active-conferences-wide");
    const navPanel = document.querySelector(".sidebar .nav-panel");
    const list = document.querySelector(".sidebar .conference-list");
    const caption = navPanel ? navPanel.querySelector(".panel-caption") : null;
    const toolbar = navPanel ? navPanel.querySelector(".conference-toolbar") : null;

    if (!activeConferences || !navPanel || !list) return;

    if (window.matchMedia("(max-width: 1100px)").matches) {
      navPanel.style.height = "";
      navPanel.style.maxHeight = "";
      list.style.height = "";
      list.style.maxHeight = "";
      return;
    }

    const navTop = navPanel.getBoundingClientRect().top;
    const targetBottom = activeConferences.getBoundingClientRect().bottom;
    const panelHeight = Math.max(Math.floor(targetBottom - navTop), 120);
    const panelStyles = window.getComputedStyle(navPanel);
    const borderTop = parseFloat(panelStyles.borderTopWidth) || 0;
    const borderBottom = parseFloat(panelStyles.borderBottomWidth) || 0;
    const captionHeight = caption ? Math.ceil(caption.getBoundingClientRect().height) : 0;
    const toolbarHeight = toolbar ? Math.ceil(toolbar.getBoundingClientRect().height) : 0;
    const listHeight = Math.max(
      Math.floor(
        panelHeight -
          borderTop -
          borderBottom -
          captionHeight -
          toolbarHeight,
      ),
      120,
    );

    navPanel.style.height = panelHeight + "px";
    navPanel.style.maxHeight = panelHeight + "px";
    list.style.height = listHeight + "px";
    list.style.maxHeight = listHeight + "px";
  }

  function syncDashboardLayoutHeights() {
    syncParticipantListHeight();
    syncConferenceListHeight();
  }

  let hasBootstrapped = false;
  function initDashboardBootstrap() {
    if (hasBootstrapped) {
      return;
    }
    hasBootstrapped = true;

    initSystemTimeClock();
    initMicToggle();
    initParticipantMediaToggles();
    initParticipantContextMenu();
    initMediaSortButtons();
    initKickMemberButtons();
    initLeaveConferenceConfirm();
    initConferenceSearch();
    initParticipantSearch();
    initFastCallButton();
    if (
      window.DashboardAddressBookManager &&
      typeof window.DashboardAddressBookManager.initAddressBookManager ===
        "function"
    ) {
      window.DashboardAddressBookManager.initAddressBookManager();
    }
    if (
      window.DashboardConferenceManager &&
      typeof window.DashboardConferenceManager.initConferenceManager === "function"
    ) {
      window.DashboardConferenceManager.initConferenceManager();
    }
    if (
      window.DashboardParticipantManager &&
      typeof window.DashboardParticipantManager.initParticipantManager === "function"
    ) {
      window.DashboardParticipantManager.initParticipantManager();
    }
    if (
      window.DashboardLayout &&
      typeof window.DashboardLayout.initLayoutSelector === "function"
    ) {
      window.DashboardLayout.initLayoutSelector();
    }
    if (
      window.DashboardStageStream &&
      typeof window.DashboardStageStream.initStageStreamManager === "function"
    ) {
      window.DashboardStageStream.initStageStreamManager();
    }
    syncDashboardLayoutHeights();
    window.requestAnimationFrame(syncDashboardLayoutHeights);
  }

  window.DashboardBootstrap = {
    initSystemTimeClock: initSystemTimeClock,
    initMediaSortButtons: initMediaSortButtons,
    initLeaveConferenceConfirm: initLeaveConferenceConfirm,
    initConferenceSearch: initConferenceSearch,
    initParticipantSearch: initParticipantSearch,
    syncDashboardLayoutHeights: syncDashboardLayoutHeights,
    initDashboardBootstrap: initDashboardBootstrap,
  };

  window.addEventListener("load", initDashboardBootstrap);
  window.addEventListener("resize", syncDashboardLayoutHeights);
})();
