(function () {
  function extractErrorMessage(error) {
    if (!error) {
      return "Unknown error.";
    }

    const response = error.response || {};
    const data = response.data;

    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }

    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
      if (Array.isArray(data.errors) && data.errors.length) {
        return String(data.errors[0]);
      }
    }

    if (response.status) {
      return "Request failed with status " + response.status + ".";
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message.trim();
    }

    return "Request failed.";
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeConferenceStatus(value) {
    const raw = String(value || "Scheduled").trim();
    const lower = raw.toLowerCase();

    if (lower.includes("connect")) return "Connected";
    if (lower.includes("live")) return "Live";
    if (lower.includes("standby")) return "Standby";
    return raw || "Scheduled";
  }

  function statusClass(status) {
    const normalized = status.toLowerCase();
    if (normalized === "connected") return "status-connected";
    if (normalized === "live") return "status-live";
    if (normalized === "standby") return "status-standby";
    return "status-default";
  }

  function inferIsRunning(conference, status) {
    if (conference && typeof conference.active === "boolean") {
      return conference.active;
    }
    const normalized = String(status || "").toLowerCase();
    return normalized === "connected" || normalized === "live";
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function getConferenceItemSearchData(item) {
    if (!item) {
      return {
        number: "",
        description: "",
      };
    }

    const datasetNumber = String(item.dataset.number || "").trim();
    const datasetDescription = String(item.dataset.description || "").trim();
    const idText = item.querySelector(".conference-item-id");
    const descriptionText = item.querySelector(".conference-item-description");

    let fallbackNumber = "";
    if (idText && idText.textContent) {
      fallbackNumber = String(idText.textContent)
        .replace(/^id\s*:\s*/i, "")
        .trim();
    }

    const fallbackDescription =
      descriptionText && descriptionText.textContent
        ? String(descriptionText.textContent).trim()
        : "";

    return {
      number: datasetNumber || fallbackNumber,
      description: datasetDescription || fallbackDescription,
    };
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function formatClockTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "--:--";
    }
    return pad2(date.getHours()) + ":" + pad2(date.getMinutes());
  }

  function formatTimeValue(value) {
    if (value === null || value === undefined) {
      return "--:--";
    }

    if (typeof value === "number") {
      if (!Number.isFinite(value) || value <= 0) {
        return "--:--";
      }
      const epochMs = value > 1000000000000 ? value : value * 1000;
      return formatClockTime(new Date(epochMs));
    }

    const text = String(value).trim();
    if (!text) {
      return "--:--";
    }

    if (/^\d+$/.test(text)) {
      const numeric = Number(text);
      if (!Number.isFinite(numeric) || numeric <= 0) {
        return "--:--";
      }
      const epochMs = numeric > 1000000000000 ? numeric : numeric * 1000;
      return formatClockTime(new Date(epochMs));
    }

    const match = text.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      return pad2(Number(match[1])) + ":" + match[2];
    }

    const parsed = new Date(text);
    if (!Number.isNaN(parsed.getTime())) {
      return formatClockTime(parsed);
    }

    return "--:--";
  }

  function addMinutesToClock(startClock, durationMinutes) {
    const match = String(startClock || "").match(/^(\d{2}):(\d{2})$/);
    if (!match) {
      return "--:--";
    }
    const minutes = Number(durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return "--:--";
    }

    const startTotal = Number(match[1]) * 60 + Number(match[2]);
    const endTotal = (startTotal + minutes) % (24 * 60);
    const endHours = Math.floor(endTotal / 60);
    const endMinutes = endTotal % 60;
    return pad2(endHours) + ":" + pad2(endMinutes);
  }

  function inferStatus(conference) {
    if (!conference || typeof conference !== "object") {
      return "Scheduled";
    }

    if (typeof conference.status === "string" && conference.status.trim()) {
      return normalizeConferenceStatus(conference.status);
    }

    if (conference.active === true) {
      const online = Number(conference.participants && conference.participants.online);
      if (Number.isFinite(online) && online > 0) {
        return "Live";
      }
      return "Connected";
    }

    if (conference.shutdown === true) {
      return "Standby";
    }

    return "Scheduled";
  }

  function mapConferenceFromApi(conference) {
    const schedule = Array.isArray(conference && conference.schedules)
      ? conference.schedules[0] || null
      : null;
    const inferredStatus = inferStatus(conference);

    const startTime = formatTimeValue(
      conference && conference.startTime !== undefined && conference.startTime !== null
        ? conference.startTime
        : schedule && schedule.date,
    );

    let endTime = formatTimeValue(
      conference && conference.stopTime !== undefined && conference.stopTime !== null
        ? conference.stopTime
        : null,
    );

    if (
      endTime === "--:--" &&
      startTime !== "--:--" &&
      schedule &&
      schedule.duration !== undefined &&
      schedule.duration !== null
    ) {
      endTime = addMinutesToClock(startTime, Number(schedule.duration));
    }

    return {
      number: conference && conference.number !== undefined ? conference.number : "-",
      description:
        conference && conference.description !== undefined
          ? conference.description
          : "(No description)",
      status: inferredStatus,
      startTime: startTime,
      endTime: endTime,
      isRunning: inferIsRunning(conference, inferredStatus),
      active: Boolean(conference && conference.active),
      temporary: Boolean(conference && conference.temporary),
      shutdown: Boolean(conference && conference.shutdown),
      participantsTotal: Number(
        conference && conference.participants
          ? conference.participants.total
          : 0,
      ) || 0,
      participantsOnline: Number(
        conference && conference.participants
          ? conference.participants.online
          : 0,
      ) || 0,
    };
  }

  function extractConferenceListPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return [];
    }

    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload.conferences)) {
      return payload.conferences;
    }

    if (payload.data && Array.isArray(payload.data.conferences)) {
      return payload.data.conferences;
    }

    return [];
  }

  function createConferenceCardElement(data) {
    const number = String(data.number ?? "").trim() || "-";
    const description = String(data.description ?? "").trim() || "(No description)";
    const status = normalizeConferenceStatus(data.status);
    const startTime = String(data.startTime ?? "--:--").trim() || "--:--";
    const endTime = String(data.endTime ?? "--:--").trim() || "--:--";
    const isRunning = Boolean(data.isRunning);
    const actionTitle = isRunning ? "Stop conference" : "Start conference";
    const actionLabel = isRunning ? "Stop conference" : "Start conference";

    const item = document.createElement("li");
    item.className = "conference-item";
    item.dataset.number = number;
    item.dataset.description = description;
    item.dataset.status = status;
    item.dataset.participantsOnline = String(
      Number(data && data.participantsOnline ? data.participantsOnline : 0) || 0,
    );
    item.dataset.participantsTotal = String(
      Number(data && data.participantsTotal ? data.participantsTotal : 0) || 0,
    );
    item.dataset.active = data && data.active ? "1" : "0";
    item.dataset.temporary = data && data.temporary ? "1" : "0";
    item.dataset.shutdown = data && data.shutdown ? "1" : "0";
    item.dataset.running = isRunning ? "1" : "0";
    item.innerHTML =
      '<div class="conference-item-head">' +
      '<span class="conference-item-id">ID: ' +
      escapeHtml(number) +
      "</span>" +
      '<div class="conference-item-head-right">' +
      '<span class="conference-item-status ' +
      statusClass(status) +
      '">' +
      escapeHtml(status) +
      "</span>" +
      '<button type="button" class="conference-item-toggle ' +
      (isRunning ? "is-running" : "is-stopped") +
      '" data-conference-item-action="toggle-start-stop" title="' +
      escapeHtml(actionTitle) +
      '" aria-label="' +
      escapeHtml(actionLabel) +
      '">' +
      '<svg class="icon-start" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5a1 1 0 0 1 1.53-.85l9 5.5a1 1 0 0 1 0 1.7l-9 5.5A1 1 0 0 1 8 16.5z"/></svg>' +
      '<svg class="icon-stop" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h10v10H7z"/></svg>' +
      "</button>" +
      "</div>" +
      "</div>" +
      '<div class="conference-item-description">' +
      escapeHtml(description) +
      "</div>" +
      '<div class="conference-item-time">' +
      "<span>Start: " +
      escapeHtml(startTime) +
      "</span>" +
      "<span>End: " +
      escapeHtml(endTime) +
      "</span>" +
      "</div>";

    return item;
  }

  function emitActiveConferenceChanged(item) {
    const detail = {
      number: "",
      description: "",
      status: "",
      participantsOnline: 0,
      participantsTotal: 0,
      active: false,
    };

    if (item) {
      detail.number = String(item.dataset.number || "").trim();
      detail.description = String(item.dataset.description || "").trim();
      detail.status = String(item.dataset.status || "").trim();
      detail.participantsOnline = Number(item.dataset.participantsOnline || 0) || 0;
      detail.participantsTotal = Number(item.dataset.participantsTotal || 0) || 0;
      detail.active = item.dataset.active === "1";
    }

    document.dispatchEvent(
      new CustomEvent("dashboard:conference-active-changed", {
        detail: detail,
      }),
    );

    window.DashboardConferenceState = {
      currentConference: detail,
      updatedAt: Date.now(),
    };
  }

  function pickDefaultActiveNumber(conferences) {
    if (!Array.isArray(conferences) || conferences.length === 0) {
      return "";
    }

    const onlineConference = conferences.find(function (conference) {
      return conference && Number(conference.participantsOnline) > 0;
    });
    if (onlineConference && onlineConference.number !== undefined) {
      return String(onlineConference.number).trim();
    }

    const runningConference = conferences.find(function (conference) {
      return conference && conference.isRunning;
    });
    if (runningConference && runningConference.number !== undefined) {
      return String(runningConference.number).trim();
    }

    if (conferences[0].number !== undefined) {
      return String(conferences[0].number).trim();
    }

    return "";
  }

  function buildPayload(form) {
    const numberInput = form.querySelector("#conference-number");
    const descriptionInput = form.querySelector("#conference-description");
    const moderatorInputs = form.querySelectorAll(
      'input[name="moderators"]:checked',
    );

    const number = Number(numberInput ? numberInput.value : NaN);
    const description = descriptionInput
      ? descriptionInput.value.trim()
      : "";
    const moderators = Array.from(moderatorInputs).map(function (input) {
      return input.value;
    });

    return {
      number: number,
      description: description,
      moderators: moderators,
    };
  }

  function initConferenceManager() {
    const addButton = document.querySelector(
      '[data-conference-action="add-conference"]',
    );
    const deleteButton = document.querySelector(
      '[data-conference-action="delete-conference"]',
    );
    const modal = document.getElementById("conference-create-modal");
    const form = document.getElementById("conference-create-form");
    const numberInput = document.getElementById("conference-number");
    const descriptionInput = document.getElementById("conference-description");
    const searchInput = document.getElementById("conference-moderator-search");
    const typeFilter = document.getElementById("conference-moderator-type");
    const showSelectedToggle = document.getElementById(
      "conference-show-selected",
    );
    const feedback = document.getElementById("conference-create-feedback");
    const submitButton = form
      ? form.querySelector(".conference-submit-btn")
      : null;
    const settingModal = document.getElementById("conference-setting-modal");
    const settingForm = document.getElementById("conference-setting-form");
    const settingFeedback = document.getElementById(
      "conference-setting-feedback",
    );
    const settingSubmitButton = settingForm
      ? settingForm.querySelector(".conference-submit-btn")
      : null;
    const settingConferenceNumberInput = document.getElementById(
      "setting-conference-number",
    );
    const settingDescriptionInput = document.getElementById(
      "setting-conference-description",
    );
    const settingPinInput = document.getElementById("setting-conference-pin");
    const settingModeratorSearchInput = document.getElementById(
      "setting-moderator-search",
    );
    const settingModeratorTypeSelect = document.getElementById(
      "setting-moderator-type",
    );
    const settingModeratorList = document.getElementById("setting-moderator-list");
    const settingTabs = settingModal
      ? Array.from(settingModal.querySelectorAll(".conference-setting-tab"))
      : [];
    const settingPanels = settingModal
      ? Array.from(settingModal.querySelectorAll(".conference-setting-panel"))
      : [];
    const settingCancelButtons = settingModal
      ? Array.from(
          settingModal.querySelectorAll(
            "[data-conference-setting-cancel], [data-conference-setting-modal-close]",
          ),
        )
      : [];
    const settingGeneratePinButton = settingModal
      ? settingModal.querySelector('[data-setting-action="generate-pin"]')
      : null;
    const conferenceList = document.querySelector(".conference-list");
    const conferenceNumbersInUse = new Set();
    const settingModeratorData = [];
    let currentSettingConference = null;
    let settingLoadRequestId = 0;
    const apiClient = window.DashboardAxios
      ? window.DashboardAxios.vinteo
      : null;
    const popupManager = window.DashboardPopupManager;
    const deleteConferencePopup =
      popupManager && typeof popupManager.createConfirmPopup === "function"
        ? popupManager.createConfirmPopup({
            modalId: "conference-delete-confirm-modal",
            messageSelector: "#conference-delete-confirm-message",
            confirmSelector: "[data-conference-delete-confirm]",
            cancelSelector: "[data-conference-delete-cancel]",
            closeSelector: "[data-conference-delete-modal-close]",
          })
        : null;
    const moderatorItems = modal
      ? Array.from(modal.querySelectorAll(".conference-moderator-item"))
      : [];
    const cancelButtons = modal
      ? Array.from(
          modal.querySelectorAll(
            "[data-conference-cancel], .conference-modal-close",
          ),
        )
      : [];

    if (
      !addButton ||
      !deleteButton ||
      !modal ||
      !form ||
      !numberInput ||
      !descriptionInput ||
      !searchInput ||
      !typeFilter ||
      !showSelectedToggle
    ) {
      return;
    }

    function showFeedback(message, type) {
      if (!feedback) {
        if (message) {
          window.alert(message);
        }
        return;
      }

      if (!message) {
        feedback.textContent = "";
        feedback.classList.remove("is-error", "is-success");
        feedback.hidden = true;
        return;
      }

      feedback.textContent = message;
      feedback.hidden = false;
      feedback.classList.toggle("is-error", type === "error");
      feedback.classList.toggle("is-success", type === "success");
    }

    function showSettingFeedback(message, type) {
      if (!settingFeedback) {
        return;
      }

      if (!message) {
        settingFeedback.textContent = "";
        settingFeedback.classList.remove("is-error", "is-success");
        settingFeedback.hidden = true;
        return;
      }

      settingFeedback.textContent = message;
      settingFeedback.hidden = false;
      settingFeedback.classList.toggle("is-error", type === "error");
      settingFeedback.classList.toggle("is-success", type === "success");
    }

    function activateSettingTab(tabKey) {
      if (!tabKey) return;

      settingTabs.forEach(function (tabButton) {
        const isActive = tabButton.dataset.settingTabTarget === tabKey;
        tabButton.classList.toggle("is-active", isActive);
        tabButton.setAttribute("aria-selected", isActive ? "true" : "false");
      });

      settingPanels.forEach(function (panel) {
        const isActive = panel.dataset.settingTabPanel === tabKey;
        panel.classList.toggle("is-active", isActive);
      });
    }

    function createRandomPin() {
      let pin = String(Math.floor(Math.random() * 9) + 1);
      for (let index = 0; index < 5; index += 1) {
        pin += String(Math.floor(Math.random() * 10));
      }
      return pin;
    }

    function numberFromField(field) {
      const raw = String(field && field.value ? field.value : "").trim();
      if (!raw) {
        return undefined;
      }
      const numeric = Number(raw);
      if (!Number.isFinite(numeric)) {
        return undefined;
      }
      return numeric;
    }

    function numberFromValue(value) {
      if (value === null || value === undefined || value === "") {
        return undefined;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return undefined;
      }
      return numeric;
    }

    function extractConferenceDetailsPayload(payload) {
      if (!payload || typeof payload !== "object") {
        return null;
      }

      if (payload.data && payload.data.conference && typeof payload.data.conference === "object") {
        return payload.data.conference;
      }

      if (payload.conference && typeof payload.conference === "object") {
        return payload.conference;
      }

      if (payload.data && typeof payload.data === "object" && payload.data.number !== undefined) {
        return payload.data;
      }

      if (payload.number !== undefined) {
        return payload;
      }

      return null;
    }

    function setInputValue(field, value) {
      if (!field || value === null || value === undefined) {
        return;
      }
      field.value = String(value);
    }

    function setCheckboxValue(field, value) {
      if (!field || typeof value !== "boolean") {
        return;
      }
      field.checked = value;
    }

    function setSelectValue(field, value) {
      if (!field || value === null || value === undefined || value === "") {
        return;
      }

      const options = Array.from(field.options || []);
      const raw = String(value).trim();
      if (!raw) {
        return;
      }

      const exact = options.find(function (option) {
        return option.value === raw;
      });
      if (exact) {
        field.value = exact.value;
        return;
      }

      const lower = raw.toLowerCase();
      const caseInsensitive = options.find(function (option) {
        return String(option.value || "").toLowerCase() === lower;
      });
      if (caseInsensitive) {
        field.value = caseInsensitive.value;
      }
    }

    function normalizeResolutionValue(value) {
      if (value === null || value === undefined) {
        return "";
      }

      const raw = String(value).trim();
      if (!raw) {
        return "";
      }

      const compact = raw
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[()]/g, "");

      const map = {
        UHD: "UHD",
        ULTRAHD4K3840X2160: "UHD",
        FULLHD: "FULLHD",
        FULLHD1920X1080: "FULLHD",
        "16CIF": "16CIF",
        "1408X1152": "16CIF",
        "720P": "720p",
        HD1280X720: "720p",
        "1280X720": "720p",
        XGA: "XGA",
        "1024X768": "XGA",
        "960X540": "960x540",
        "848X480": "848x480",
        SVGA: "SVGA",
        "800X600": "SVGA",
        PAL: "PAL",
        "768X576": "PAL",
        "576P": "576p",
        "1024X576": "1024x576",
        "4CIF": "4CIF",
        "704X576": "4CIF",
        "4SIF": "4SIF",
        "704X480": "4SIF",
        VGA: "VGA",
        "640X480": "VGA",
        "640X360": "640x360",
        CIF: "CIF",
        "352X288": "CIF",
        SIF: "SIF",
        "352X240": "SIF",
        QCIF: "QCIF",
        "176X144": "QCIF",
        QSIF: "QSIF",
        "176X120": "QSIF",
        "1792X1008": "1792x1008",
        "1664X936": "1664x936",
        "1536X864": "1536x864",
        "1408X792": "1408x792",
        "1152X648": "1152x648",
        "768X432": "768x432",
        "480P": "480p",
        "720X480": "480p",
        "512X288": "512x288",
        "384X216": "384x216",
        "320X180": "320x180",
        "256X144": "256x144",
        "128X72": "128x72",
      };

      return map[compact] || raw;
    }

    function applyConferenceDetailsToSettingForm(conferenceDetails) {
      if (!settingForm || !conferenceDetails || typeof conferenceDetails !== "object") {
        return;
      }

      const settings =
        conferenceDetails.settings && typeof conferenceDetails.settings === "object"
          ? conferenceDetails.settings
          : conferenceDetails;

      const description =
        conferenceDetails.description !== undefined
          ? conferenceDetails.description
          : settings.description;
      setInputValue(settingDescriptionInput, description);
      setInputValue(settingPinInput, settings.pin);

      setInputValue(settingForm.elements.callDuration, numberFromValue(settings.callDuration));
      setInputValue(settingForm.elements.callAttempt, numberFromValue(settings.callAttempt));
      setInputValue(settingForm.elements.callInterval, numberFromValue(settings.callInterval));
      setInputValue(
        settingForm.elements.maxParticipants,
        numberFromValue(settings.maxParticipants),
      );

      const anonymousConnections =
        settings.anonymousConnections && typeof settings.anonymousConnections === "object"
          ? settings.anonymousConnections
          : {};
      setSelectValue(
        settingForm.elements.anonymousBandwidth,
        numberFromValue(anonymousConnections.bandwidth) ??
          numberFromValue(settings.anonymousBandwidth),
      );
      setSelectValue(
        settingForm.elements.anonymousResolution,
        normalizeResolutionValue(
          anonymousConnections.resolution ?? settings.anonymousResolution,
        ),
      );
      setSelectValue(
        settingForm.elements.anonymousFPS,
        numberFromValue(anonymousConnections.fps) ?? numberFromValue(settings.anonymousFPS),
      );

      setCheckboxValue(
        settingForm.elements.displayNotification,
        settings.displayNotification,
      );
      setCheckboxValue(
        settingForm.elements.allowAnonymousCalls,
        settings.allowAnonymousCalls,
      );
      setCheckboxValue(settingForm.elements.openConference, settings.openConference);
      setCheckboxValue(settingForm.elements.shutdown, settings.shutdown);
      setCheckboxValue(settingForm.elements.reCall, settings.reCall);
      setCheckboxValue(settingForm.elements.micOff, settings.micOff);
      setCheckboxValue(
        settingForm.elements.callPartsOnModerSignIn,
        settings.callPartsOnModerSignIn,
      );
      setCheckboxValue(
        settingForm.elements.disconnectPartsOnModerSignOut,
        settings.disconnectPartsOnModerSignOut,
      );
      setCheckboxValue(settingForm.elements.enableScreenshots, settings.enableScreenshots);
      setCheckboxValue(settingForm.elements.logs, settings.logs);
      setCheckboxValue(settingForm.elements.allowRequestWord, settings.allowRequestWord);
      setCheckboxValue(settingForm.elements.allowWhiteboard, settings.allowWhiteboard);
      setCheckboxValue(settingForm.elements.audioTag, settings.audioTag);
      setCheckboxValue(settingForm.elements.videoWatermark, settings.videoWatermark);
      setCheckboxValue(settingForm.elements.allowReactions, settings.allowReactions);

      setSelectValue(
        settingForm.elements.clientOptimisationMode,
        numberFromValue(settings.clientOptimisationMode),
      );
      setSelectValue(
        settingForm.elements.peripherySyncMode,
        numberFromValue(settings.peripherySyncMode),
      );
      setSelectValue(
        settingForm.elements.connectionsExposureMode,
        numberFromValue(settings.connectionsExposureMode),
      );
      setSelectValue(
        settingForm.elements.webrtcConnectionModeNegotiation,
        numberFromValue(settings.webrtcConnectionModeNegotiation),
      );
      setSelectValue(
        settingForm.elements.presentationFPS,
        numberFromValue(settings.presentationFPS),
      );

      const moderators = Array.isArray(settings.moderators) ? settings.moderators : [];
      settingModeratorData.length = 0;
      moderators.forEach(function (moderatorRaw) {
        const moderator = String(moderatorRaw || "").trim();
        if (!moderator) {
          return;
        }
        settingModeratorData.push({
          value: moderator,
          displayName: moderator,
          type: moderator.includes("@") ? "sip" : "h323",
          selected: true,
        });
      });
      renderSettingModeratorList();
    }

    function ensureSettingModeratorData() {
      if (settingModeratorData.length > 0) {
        return;
      }
    }

    function renderSettingModeratorList() {
      if (!settingModeratorList) {
        return;
      }

      ensureSettingModeratorData();
      const searchQuery = normalizeSearchText(
        settingModeratorSearchInput ? settingModeratorSearchInput.value : "",
      );
      const typeFilterValue = String(
        settingModeratorTypeSelect ? settingModeratorTypeSelect.value : "all",
      ).toLowerCase();
      const fragment = document.createDocumentFragment();
      let visibleCount = 0;

      settingModeratorData.forEach(function (item, index) {
        const displayText = String(item.displayName || "").trim();
        const normalizedName = normalizeSearchText(displayText);
        const itemType = String(item.type || "all").toLowerCase();
        const matchesSearch =
          !searchQuery ||
          normalizedName.includes(searchQuery) ||
          normalizeSearchText(item.value).includes(searchQuery);
        const matchesType = typeFilterValue === "all" || itemType === typeFilterValue;
        if (!matchesSearch || !matchesType) {
          return;
        }

        const row = document.createElement("label");
        row.className = "conference-setting-moderator-item";
        row.innerHTML =
          '<span class="conference-setting-moderator-name">' +
          escapeHtml(displayText) +
          "</span>" +
          '<span class="conference-setting-moderator-type">' +
          escapeHtml(String(itemType).toUpperCase()) +
          "</span>" +
          '<input type="checkbox" name="settingModerators" value="' +
          escapeHtml(item.value) +
          '"' +
          (item.selected ? " checked" : "") +
          " />";

        const checkbox = row.querySelector('input[name="settingModerators"]');
        if (checkbox) {
          checkbox.addEventListener("change", function () {
            settingModeratorData[index].selected = checkbox.checked;
          });
        }

        visibleCount += 1;
        fragment.appendChild(row);
      });

      settingModeratorList.innerHTML = "";
      if (visibleCount === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "conference-setting-moderator-empty";
        emptyState.textContent = "No moderator found.";
        settingModeratorList.appendChild(emptyState);
        return;
      }

      settingModeratorList.appendChild(fragment);
    }

    function closeSettingModal() {
      if (!settingModal) {
        return;
      }

      settingModal.classList.remove("is-open");
      settingModal.setAttribute("hidden", "");
      currentSettingConference = null;
      settingLoadRequestId += 1;
    }

    function resetSettingModal() {
      if (!settingForm) return;

      settingForm.reset();
      showSettingFeedback("");
      activateSettingTab("main");
      settingModeratorData.length = 0;
      ensureSettingModeratorData();
      settingModeratorData.forEach(function (item) {
        item.selected = false;
      });
      renderSettingModeratorList();
    }

    async function openSettingModal(conferenceItem) {
      if (!settingModal || !settingForm) {
        window.alert("Conference setting popup is not ready.");
        return;
      }

      const selectedItem = conferenceItem || getActiveConferenceItem();
      if (!selectedItem) {
        window.alert("Please select a conference first.");
        return;
      }

      currentSettingConference = {
        number: String(selectedItem.dataset.number || "").trim(),
        description: String(selectedItem.dataset.description || "").trim(),
      };

      resetSettingModal();
      if (settingConferenceNumberInput) {
        settingConferenceNumberInput.value = currentSettingConference.number;
      }
      if (settingDescriptionInput) {
        settingDescriptionInput.value = currentSettingConference.description;
      }

      settingModal.removeAttribute("hidden");
      settingModal.classList.add("is-open");
      showSettingFeedback("Loading conference settings...");
      const requestId = ++settingLoadRequestId;
      if (settingSubmitButton) {
        settingSubmitButton.disabled = true;
      }

      window.setTimeout(function () {
        if (settingDescriptionInput) {
          settingDescriptionInput.focus();
          settingDescriptionInput.select();
        }
      }, 0);

      if (!apiClient || !currentSettingConference.number) {
        showSettingFeedback("");
        if (settingSubmitButton) {
          settingSubmitButton.disabled = false;
        }
        return;
      }

      try {
        const response = await apiClient.get(
          "/api/v1/conference/" + encodeURIComponent(currentSettingConference.number),
        );
        if (requestId !== settingLoadRequestId || !currentSettingConference) {
          return;
        }

        const conferenceDetails = extractConferenceDetailsPayload(response.data);
        if (!conferenceDetails) {
          showSettingFeedback("Cannot parse conference settings response.", "error");
          return;
        }

        applyConferenceDetailsToSettingForm(conferenceDetails);
        showSettingFeedback("");
      } catch (error) {
        if (requestId !== settingLoadRequestId || !currentSettingConference) {
          return;
        }
        showSettingFeedback(extractErrorMessage(error), "error");
      } finally {
        if (requestId === settingLoadRequestId && settingSubmitButton) {
          settingSubmitButton.disabled = false;
        }
      }
    }

    function normalizeConferenceNumber(value) {
      const raw = String(value || "").trim();
      if (!/^\d+$/.test(raw)) {
        return null;
      }
      const numberValue = Number(raw);
      if (!Number.isInteger(numberValue)) {
        return null;
      }
      return numberValue;
    }

    function refreshConferenceNumbersInUse() {
      conferenceNumbersInUse.clear();
      if (!conferenceList) return;

      const items = Array.from(
        conferenceList.querySelectorAll(".conference-item"),
      );
      items.forEach(function (item) {
        const numberValue = normalizeConferenceNumber(item.dataset.number);
        if (numberValue !== null) {
          conferenceNumbersInUse.add(numberValue);
        }
      });
    }

    function getNextAvailableConferenceNumber() {
      for (let numberValue = 1000; numberValue <= 1999; numberValue += 1) {
        if (!conferenceNumbersInUse.has(numberValue)) {
          return numberValue;
        }
      }
      return null;
    }

    function assignNextConferenceNumberIfEmpty() {
      const currentRaw = String(numberInput.value || "").trim();
      if (currentRaw) {
        return true;
      }

      const nextAvailable = getNextAvailableConferenceNumber();
      if (nextAvailable === null) {
        showFeedback("No available conference ID from 1000 to 1999.", "error");
        return false;
      }

      numberInput.value = String(nextAvailable);
      return true;
    }

    function applyModeratorFilters() {
      const searchTerm = searchInput.value.trim().toLowerCase();
      const typeValue = typeFilter.value;
      const selectedOnly = showSelectedToggle.checked;

      moderatorItems.forEach(function (item) {
        const itemName = (item.dataset.name || "").toLowerCase();
        const itemType = (item.dataset.type || "all").toLowerCase();
        const checkbox = item.querySelector('input[name="moderators"]');
        const isSelected = checkbox ? checkbox.checked : false;

        const matchesSearch = !searchTerm || itemName.indexOf(searchTerm) !== -1;
        const matchesType = typeValue === "all" || itemType === typeValue;
        const matchesSelected = !selectedOnly || isSelected;

        item.hidden = !(matchesSearch && matchesType && matchesSelected);
      });
    }

    function closeModal() {
      modal.classList.remove("is-open");
      modal.setAttribute("hidden", "");
    }

    function resetModal() {
      form.reset();
      numberInput.value = "";
      searchInput.value = "";
      typeFilter.value = "all";
      showSelectedToggle.checked = false;
      applyModeratorFilters();
      showFeedback("");
      refreshConferenceNumbersInUse();
      assignNextConferenceNumberIfEmpty();
    }

    function openModal() {
      resetModal();
      modal.removeAttribute("hidden");
      modal.classList.add("is-open");
      window.setTimeout(function () {
        numberInput.focus();
        numberInput.select();
      }, 0);
    }

    function validateInputs() {
      refreshConferenceNumbersInUse();
      if (!assignNextConferenceNumberIfEmpty()) {
        numberInput.focus();
        return false;
      }

      const numberRaw = String(numberInput.value || "").trim();
      const description = String(descriptionInput.value || "").trim();

      if (!/^\d+$/.test(numberRaw)) {
        showFeedback("ID must contain only numbers.", "error");
        numberInput.focus();
        return false;
      }

      const numberValue = Number(numberRaw);
      if (numberValue < 1000 || numberValue > 1999) {
        showFeedback("ID must be between 1000 and 1999.", "error");
        numberInput.focus();
        return false;
      }

      if (conferenceNumbersInUse.has(numberValue)) {
        showFeedback("ID already exists. Please use another ID.", "error");
        numberInput.focus();
        return false;
      }

      if (!description) {
        showFeedback("Description is required.", "error");
        descriptionInput.focus();
        return false;
      }

      return true;
    }

    function renderConferenceListItems(conferences, preferredActiveNumber) {
      if (!conferenceList) return;
      conferenceList.innerHTML = "";
      const preferredNumber = String(preferredActiveNumber || "").trim();
      const defaultNumber = preferredNumber || pickDefaultActiveNumber(conferences);
      let activeApplied = false;
      let activeItem = null;

      if (Array.isArray(conferences) && conferences.length > 0) {
        conferences.forEach(function (conferenceData) {
          const card = createConferenceCardElement(conferenceData);
          if (
            defaultNumber &&
            String(conferenceData.number || "").trim() === defaultNumber
          ) {
            card.classList.add("active");
            activeApplied = true;
            activeItem = card;
          }
          conferenceList.appendChild(card);
        });
      }

      if (!activeApplied && defaultNumber) {
        const firstItem = conferenceList.querySelector(".conference-item");
        if (firstItem) {
          firstItem.classList.add("active");
          activeItem = firstItem;
        }
      }

      if (activeItem) {
        setActiveConferenceItem(activeItem);
      } else {
        emitActiveConferenceChanged(null);
      }

      refreshConferenceNumbersInUse();

      applyConferenceSearch();

      document.dispatchEvent(
        new CustomEvent("dashboard:conference-list-refreshed", {
          detail: {
            total: Array.isArray(conferences) ? conferences.length : 0,
            activeNumber: activeItem
              ? String(activeItem.dataset.number || "").trim()
              : "",
          },
        }),
      );

      window.requestAnimationFrame(function () {
        window.dispatchEvent(new Event("resize"));
      });
    }

    function setActiveConferenceItem(item) {
      if (!conferenceList || !item) return;
      const conferenceItems = Array.from(
        conferenceList.querySelectorAll(".conference-item"),
      );
      conferenceItems.forEach(function (entry) {
        entry.classList.toggle("active", entry === item);
      });
      emitActiveConferenceChanged(item);
    }

    function getActiveConferenceItem() {
      if (!conferenceList) return null;
      return conferenceList.querySelector(".conference-item.active");
    }

    function getActiveConferenceNumber() {
      const activeItem = getActiveConferenceItem();
      if (!activeItem) return "";
      return String(activeItem.dataset.number || "").trim();
    }

    function getActiveConferenceDescription() {
      const activeItem = getActiveConferenceItem();
      if (!activeItem) return "";
      return String(activeItem.dataset.description || "").trim();
    }

    function applyConferenceSearch() {
      if (!conferenceList) return;

      const conferenceSearchInput = document.getElementById(
        "conference-search-input",
      );
      const query = normalizeSearchText(
        conferenceSearchInput ? conferenceSearchInput.value : "",
      );
      const conferenceItems = Array.from(
        conferenceList.querySelectorAll(".conference-item"),
      );

      conferenceItems.forEach(function (item) {
        const searchData = getConferenceItemSearchData(item);
        const numberText = normalizeSearchText(searchData.number);
        const descriptionText = normalizeSearchText(searchData.description);
        const combinedText = normalizeSearchText(
          (searchData.number || "") + " " + (searchData.description || ""),
        );
        const matchByIdLabel =
          normalizeSearchText("id " + numberText).includes(query) ||
          normalizeSearchText("id:" + numberText).includes(query);
        const matched =
          query.length === 0 ||
          numberText.includes(query) ||
          descriptionText.includes(query) ||
          combinedText.includes(query) ||
          matchByIdLabel;
        item.hidden = !matched;
        item.style.display = matched ? "" : "none";
      });
    }

    function bindConferenceSearch() {
      const conferenceSearchInput = document.getElementById(
        "conference-search-input",
      );
      if (!conferenceSearchInput) return;
      if (conferenceSearchInput.dataset.searchBound === "1") return;

      conferenceSearchInput.dataset.searchBound = "1";

      const handleSearch = function () {
        applyConferenceSearch();
        window.requestAnimationFrame(function () {
          window.dispatchEvent(new Event("resize"));
        });
      };

      conferenceSearchInput.addEventListener("input", handleSearch);
      conferenceSearchInput.addEventListener("search", handleSearch);
      conferenceSearchInput.addEventListener("change", handleSearch);
    }

    async function changeConferenceRunningState(conferenceNumber, shouldStart) {
      if (!apiClient) {
        throw new Error("API client is not ready. Please reload the page.");
      }

      const endpoint = shouldStart
        ? "/api/v1/start_conference"
        : "/api/v1/stop_conference";
      const response = await apiClient.post(endpoint, {
        conference: conferenceNumber,
      });
      if (![200, 201, 204].includes(response.status)) {
        throw new Error(
          (shouldStart ? "Start" : "Stop") +
            " conference failed. Status " +
            response.status +
            ".",
        );
      }
    }

    async function toggleConferenceItemRunning(item, forceAction) {
      if (!item || !conferenceList || !conferenceList.contains(item)) {
        return;
      }

      const conferenceNumber = String(item.dataset.number || "").trim();
      if (!conferenceNumber) {
        return;
      }

      const actionButton = item.querySelector(
        '[data-conference-item-action="toggle-start-stop"]',
      );
      if (!actionButton || actionButton.disabled) {
        return;
      }

      const isRunning = item.dataset.running === "1";
      const shouldStart =
        forceAction === "start"
          ? true
          : forceAction === "stop"
            ? false
            : !isRunning;

      actionButton.disabled = true;
      try {
        await changeConferenceRunningState(conferenceNumber, shouldStart);
        await fetchConferenceList(conferenceNumber);
      } catch (error) {
        window.alert(extractErrorMessage(error));
      } finally {
        actionButton.disabled = false;
      }
    }

    function initConferenceContextMenu() {
      if (!conferenceList) return;

      const menuId = "conference-item-context-menu";
      let menu = document.getElementById(menuId);
      if (!menu) {
        menu = document.createElement("div");
        menu.id = menuId;
        menu.className = "conference-context-menu";
        menu.setAttribute("hidden", "");
        menu.innerHTML =
          '<button type="button" class="conference-context-menu-item" data-action="start">Start conference</button>' +
          '<button type="button" class="conference-context-menu-item" data-action="stop">Stop conference</button>' +
          '<button type="button" class="conference-context-menu-item" data-action="setting">Setting</button>';
        document.body.appendChild(menu);
      }

      function closeContextMenu() {
        if (!menu) return;
        menu.classList.remove("is-open");
        menu.setAttribute("hidden", "");
      }

      function openContextMenu(x, y) {
        if (!menu) return;
        menu.removeAttribute("hidden");
        menu.classList.add("is-open");

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const menuRect = menu.getBoundingClientRect();
        const margin = 8;
        let left = x;
        let top = y;

        if (left + menuRect.width + margin > viewportWidth) {
          left = Math.max(margin, viewportWidth - menuRect.width - margin);
        }
        if (top + menuRect.height + margin > viewportHeight) {
          top = Math.max(margin, viewportHeight - menuRect.height - margin);
        }

        menu.style.left = left + "px";
        menu.style.top = top + "px";
      }

      if (conferenceList.dataset.boundContextMenu !== "1") {
        conferenceList.dataset.boundContextMenu = "1";

        conferenceList.addEventListener("contextmenu", function (event) {
          const targetItem = event.target.closest(".conference-item");
          if (!targetItem || !conferenceList.contains(targetItem)) {
            closeContextMenu();
            return;
          }

          event.preventDefault();
          setActiveConferenceItem(targetItem);
          openContextMenu(event.clientX, event.clientY);
        });
      }

      if (menu.dataset.boundActions !== "1") {
        menu.dataset.boundActions = "1";

        menu.addEventListener("click", function (event) {
          const actionButton = event.target.closest(
            ".conference-context-menu-item",
          );
          if (!actionButton) return;

          const action = actionButton.dataset.action || "";
          const conferenceNumber = getActiveConferenceNumber();
          const conferenceDescription = getActiveConferenceDescription();
          const detail = {
            action: action,
            number: conferenceNumber,
            description: conferenceDescription,
          };
          document.dispatchEvent(
            new CustomEvent("dashboard:conference-context-action", {
              detail: detail,
            }),
          );

          if (action === "start") {
            void toggleConferenceItemRunning(getActiveConferenceItem(), "start");
          } else if (action === "stop") {
            void toggleConferenceItemRunning(getActiveConferenceItem(), "stop");
          } else if (action === "setting") {
            void openSettingModal(getActiveConferenceItem());
          }

          closeContextMenu();
        });
      }

      if (document.body.dataset.boundConferenceContextGlobal !== "1") {
        document.body.dataset.boundConferenceContextGlobal = "1";

        document.addEventListener("click", function (event) {
          if (!menu.classList.contains("is-open")) return;
          if (event.target.closest("#" + menuId)) return;
          closeContextMenu();
        });

        document.addEventListener("scroll", closeContextMenu, true);
        window.addEventListener("resize", closeContextMenu);
        document.addEventListener("keydown", function (event) {
          if (event.key === "Escape") {
            closeContextMenu();
          }
        });
      }
    }

    async function fetchConferenceList(preferredActiveNumber) {
      if (!apiClient) {
        return;
      }

      try {
        const response = await apiClient.get("/api/v1/conferences", {
          params: {
            limit: 200,
            offset: 0,
            sort: "number",
            direction: "asc",
          },
        });
        const list = extractConferenceListPayload(response.data).map(
          mapConferenceFromApi,
        );
        renderConferenceListItems(list, preferredActiveNumber);
      } catch (error) {
        console.error("Cannot load conference list:", extractErrorMessage(error));
      }
    }

    addButton.addEventListener("click", function () {
      openModal();
    });

    if (settingTabs.length > 0) {
      settingTabs.forEach(function (tabButton) {
        tabButton.addEventListener("click", function () {
          activateSettingTab(tabButton.dataset.settingTabTarget || "main");
        });
      });
    }

    if (settingGeneratePinButton) {
      settingGeneratePinButton.addEventListener("click", function () {
        if (!settingPinInput) return;
        settingPinInput.value = createRandomPin();
        settingPinInput.focus();
      });
    }

    if (settingModeratorSearchInput) {
      settingModeratorSearchInput.addEventListener("input", function () {
        renderSettingModeratorList();
      });
    }

    if (settingModeratorTypeSelect) {
      settingModeratorTypeSelect.addEventListener("change", function () {
        renderSettingModeratorList();
      });
    }

    if (conferenceList && conferenceList.dataset.boundSelection !== "1") {
      conferenceList.dataset.boundSelection = "1";
      conferenceList.addEventListener("click", function (event) {
        const actionButton = event.target.closest(
          '[data-conference-item-action="toggle-start-stop"]',
        );
        if (actionButton) {
          event.preventDefault();
          event.stopPropagation();
          const targetItem = actionButton.closest(".conference-item");
          if (!targetItem || !conferenceList.contains(targetItem)) {
            return;
          }
          setActiveConferenceItem(targetItem);
          void toggleConferenceItemRunning(targetItem);
          return;
        }

        const clickedItem = event.target.closest(".conference-item");
        if (!clickedItem || !conferenceList.contains(clickedItem)) {
          return;
        }
        setActiveConferenceItem(clickedItem);
      });
    }

    async function deleteConferenceByNumber(conferenceNumber) {
      deleteButton.disabled = true;
      try {
        const response = await apiClient.delete(
          "/api/v1/conference/" + encodeURIComponent(conferenceNumber),
        );
        if (response.status !== 200 && response.status !== 204) {
          window.alert("Cannot delete conference. Status " + response.status + ".");
          return;
        }
        await fetchConferenceList();
      } catch (error) {
        window.alert(extractErrorMessage(error));
      } finally {
        deleteButton.disabled = false;
      }
    }

    deleteButton.addEventListener("click", function () {
      if (!apiClient) {
        window.alert("API client is not ready. Please reload the page.");
        return;
      }

      const conferenceNumber = getActiveConferenceNumber();
      if (!conferenceNumber) {
        window.alert("Please select a conference to delete.");
        return;
      }

      const confirmMessage =
        "Are you sure you want to delete conference ID " +
        conferenceNumber +
        "?";

      const usedModal =
        deleteConferencePopup &&
        deleteConferencePopup.open({
          message: confirmMessage,
          onConfirm: function () {
            void deleteConferenceByNumber(conferenceNumber);
          },
        });
      if (usedModal) {
        return;
      }

      const accepted = window.confirm(confirmMessage);
      if (!accepted) {
        return;
      }

      void deleteConferenceByNumber(conferenceNumber);
    });

    modal.addEventListener("click", function (event) {
      if (!event.target.matches("[data-conference-modal-close]")) {
        return;
      }
      closeModal();
    });

    cancelButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        closeModal();
      });
    });

    if (settingModal) {
      settingModal.addEventListener("click", function (event) {
        if (!event.target.matches("[data-conference-setting-modal-close]")) {
          return;
        }
        closeSettingModal();
      });
    }

    settingCancelButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        closeSettingModal();
      });
    });

    if (settingForm) {
      settingForm.addEventListener("submit", async function (event) {
        event.preventDefault();
        showSettingFeedback("");

        if (!apiClient) {
          showSettingFeedback("API client is not ready. Please reload the page.", "error");
          return;
        }

        const descriptionValue = String(
          settingDescriptionInput ? settingDescriptionInput.value : "",
        ).trim();
        if (!descriptionValue) {
          showSettingFeedback("Description is required.", "error");
          if (settingDescriptionInput) {
            settingDescriptionInput.focus();
          }
          return;
        }

        const pinValue = String(settingPinInput ? settingPinInput.value : "").trim();
        if (pinValue && !/^[1-9][0-9]{0,14}$/.test(pinValue)) {
          showSettingFeedback(
            "PIN must be 1-15 digits and must not start with 0.",
            "error",
          );
          if (settingPinInput) {
            settingPinInput.focus();
          }
          return;
        }

        const conferenceNumber = String(
          currentSettingConference
            ? currentSettingConference.number
            : settingConferenceNumberInput
              ? settingConferenceNumberInput.value
              : "",
        ).trim();
        if (!conferenceNumber) {
          showSettingFeedback("Conference ID is missing.", "error");
          return;
        }

        const selectedModerators = settingModeratorData
          .filter(function (item) {
            return item.selected;
          })
          .map(function (item) {
            return item.value;
          });

        const payload = {
          description: descriptionValue,
          callDuration: numberFromField(settingForm.elements.callDuration),
          callAttempt: numberFromField(settingForm.elements.callAttempt),
          callInterval: numberFromField(settingForm.elements.callInterval),
          anonymousBandwidth: numberFromField(
            settingForm.elements.anonymousBandwidth,
          ),
          anonymousResolution: String(
            settingForm.elements.anonymousResolution
              ? settingForm.elements.anonymousResolution.value
              : "",
          ).trim(),
          anonymousFPS: numberFromField(settingForm.elements.anonymousFPS),
          maxParticipants: numberFromField(settingForm.elements.maxParticipants),
          displayNotification: Boolean(
            settingForm.elements.displayNotification.checked,
          ),
          allowAnonymousCalls: Boolean(
            settingForm.elements.allowAnonymousCalls.checked,
          ),
          openConference: Boolean(settingForm.elements.openConference.checked),
          shutdown: Boolean(settingForm.elements.shutdown.checked),
          reCall: Boolean(settingForm.elements.reCall.checked),
          micOff: Boolean(settingForm.elements.micOff.checked),
          callPartsOnModerSignIn: Boolean(
            settingForm.elements.callPartsOnModerSignIn.checked,
          ),
          disconnectPartsOnModerSignOut: Boolean(
            settingForm.elements.disconnectPartsOnModerSignOut.checked,
          ),
          enableScreenshots: Boolean(
            settingForm.elements.enableScreenshots.checked,
          ),
          logs: Boolean(settingForm.elements.logs.checked),
          allowRequestWord: Boolean(settingForm.elements.allowRequestWord.checked),
          allowWhiteboard: Boolean(settingForm.elements.allowWhiteboard.checked),
          audioTag: Boolean(settingForm.elements.audioTag.checked),
          videoWatermark: Boolean(settingForm.elements.videoWatermark.checked),
          allowReactions: Boolean(settingForm.elements.allowReactions.checked),
          clientOptimisationMode: numberFromField(
            settingForm.elements.clientOptimisationMode,
          ),
          peripherySyncMode: numberFromField(
            settingForm.elements.peripherySyncMode,
          ),
          connectionsExposureMode: numberFromField(
            settingForm.elements.connectionsExposureMode,
          ),
          webrtcConnectionModeNegotiation: numberFromField(
            settingForm.elements.webrtcConnectionModeNegotiation,
          ),
          presentationFPS: numberFromField(settingForm.elements.presentationFPS),
        };

        if (selectedModerators.length > 0) {
          payload.moderators = selectedModerators;
        }

        if (pinValue) {
          payload.pin = Number(pinValue);
        }

        Object.keys(payload).forEach(function (key) {
          if (payload[key] === undefined || payload[key] === "") {
            delete payload[key];
          }
        });

        if (settingSubmitButton) {
          settingSubmitButton.disabled = true;
        }

        try {
          const response = await apiClient.patch(
            "/api/v1/conference/" + encodeURIComponent(conferenceNumber),
            payload,
          );

          if (response.status !== 200) {
            showSettingFeedback(
              "Cannot save conference settings. Status " + response.status + ".",
              "error",
            );
            return;
          }

          showSettingFeedback("Conference settings saved.", "success");

          document.dispatchEvent(
            new CustomEvent("dashboard:conference-setting-save", {
              detail: Object.assign({ number: conferenceNumber }, payload),
            }),
          );

          await fetchConferenceList();
          window.setTimeout(function () {
            closeSettingModal();
          }, 250);
        } catch (error) {
          showSettingFeedback(extractErrorMessage(error), "error");
        } finally {
          if (settingSubmitButton) {
            settingSubmitButton.disabled = false;
          }
        }
      });
    }

    searchInput.addEventListener("input", applyModeratorFilters);
    typeFilter.addEventListener("change", applyModeratorFilters);
    showSelectedToggle.addEventListener("change", applyModeratorFilters);

    moderatorItems.forEach(function (item) {
      const checkbox = item.querySelector('input[name="moderators"]');
      if (!checkbox) return;
      checkbox.addEventListener("change", function () {
        if (showSelectedToggle.checked) {
          applyModeratorFilters();
        }
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      if (modal.classList.contains("is-open")) {
        closeModal();
      }
      if (settingModal && settingModal.classList.contains("is-open")) {
        closeSettingModal();
      }
    });

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      showFeedback("");

      if (!validateInputs()) {
        return;
      }

      if (!apiClient) {
        showFeedback("API client is not ready. Please reload the page.", "error");
        return;
      }

      const payload = buildPayload(form);

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const response = await apiClient.post("/api/v1/conferences", payload);

        if (response.status !== 200 && response.status !== 201) {
          showFeedback(
            "Cannot create conference. Status " + response.status + ".",
            "error",
          );
          return;
        }

        await fetchConferenceList();

        document.dispatchEvent(
          new CustomEvent("dashboard:add-conference", {
            detail: payload,
          }),
        );

        showFeedback("Conference created successfully.", "success");
        window.setTimeout(function () {
          closeModal();
        }, 350);
      } catch (error) {
        showFeedback(extractErrorMessage(error), "error");
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });

    renderSettingModeratorList();
    bindConferenceSearch();
    initConferenceContextMenu();
    fetchConferenceList();
  }

  window.DashboardConferenceManager = {
    initConferenceManager: initConferenceManager,
  };
})();
