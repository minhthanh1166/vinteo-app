(function () {
  const PARTICIPANT_REFRESH_MS = 5000;
  const ACCOUNT_CACHE_TTL_MS = 60000;
  let managerInitialized = false;

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

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
    }

    if (typeof error.message === "string" && error.message.trim()) {
      return error.message.trim();
    }

    return "Request failed.";
  }

  function extractParticipantsPayload(payload) {
    const candidateRoots = [payload, payload && payload.data, payload && payload.data && payload.data.data];

    for (let index = 0; index < candidateRoots.length; index += 1) {
      const root = candidateRoots[index];
      if (!root || typeof root !== "object") {
        continue;
      }

      if (Array.isArray(root)) {
        return root;
      }

      if (Array.isArray(root.participants)) {
        return root.participants;
      }

      if (
        root.participants &&
        typeof root.participants === "object" &&
        Array.isArray(root.participants.items)
      ) {
        return root.participants.items;
      }

      if (
        root.participants &&
        typeof root.participants === "object" &&
        !Array.isArray(root.participants)
      ) {
        const values = Object.values(root.participants).filter(function (item) {
          return item && typeof item === "object";
        });
        if (values.length > 0) {
          return values;
        }
      }
    }

    return [];
  }

  function extractParticipantDetailsPayload(payload) {
    const roots = [payload, payload && payload.data, payload && payload.data && payload.data.data];
    for (let index = 0; index < roots.length; index += 1) {
      const root = roots[index];
      if (!root || typeof root !== "object") continue;
      if (root.participant && typeof root.participant === "object") {
        return root.participant;
      }
      if (root.number !== undefined) {
        return root;
      }
    }
    return null;
  }

  function extractAccountPayload(payload) {
    const roots = [payload, payload && payload.data, payload && payload.data && payload.data.data];
    for (let index = 0; index < roots.length; index += 1) {
      const root = roots[index];
      if (!root || typeof root !== "object") continue;

      if (Array.isArray(root.accounts) && root.accounts.length > 0) {
        return root.accounts[0];
      }

      if (root.account && typeof root.account === "object") {
        return root.account;
      }
    }
    return null;
  }

  function boolValue(value) {
    return value === true;
  }

  function inferStatus(participant) {
    if (!participant || typeof participant !== "object") {
      return { text: "Unknown", className: "warn" };
    }

    if (boolValue(participant.isDisconnected)) {
      return { text: "Disconnected", className: "crit" };
    }

    if (boolValue(participant.isOnline)) {
      return { text: "Connected", className: "ok" };
    }

    if (Number(participant.registered) > 0) {
      return { text: "Connected", className: "ok" };
    }

    return { text: "Standby", className: "warn" };
  }

  function inferRole(participant) {
    if (!participant || typeof participant !== "object") {
      return "Participant";
    }
    if (boolValue(participant.isModerator)) {
      return "Moderator";
    }
    if (boolValue(participant.isLecturer)) {
      return "Lecturer";
    }
    if (boolValue(participant.isLead)) {
      return "Lead";
    }
    if (boolValue(participant.isAnonymous)) {
      return "Anonymous";
    }
    return "Participant";
  }

  function extractIp(participant) {
    const detail = participant && participant._details ? participant._details : null;
    const account = participant && participant._account ? participant._account : null;
    const candidates = [
      account && account.status && account.status.address,
      account && account.settings && account.settings.ip,
      detail && detail.number,
      detail && detail.displayName,
      detail && detail.watermark,
      participant && participant.number,
      participant && participant.displayName,
      participant && participant.watermark,
    ];
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/;

    for (let index = 0; index < candidates.length; index += 1) {
      const text = String(candidates[index] || "");
      const match = text.match(ipPattern);
      if (match && match[0]) {
        return match[0];
      }
    }

    return "-";
  }

  function inferSip(participant) {
    const detail = participant && participant._details ? participant._details : null;
    const account = participant && participant._account ? participant._account : null;
    const number = String(
      (detail && detail.number) ||
        (participant && participant.number) ||
        (account && account.number) ||
        "",
    ).trim();
    const type = String(
      (detail && detail.type) ||
        (participant && participant.type) ||
        (account && account.type) ||
        "",
    ).toUpperCase();
    if (!number) {
      return "-";
    }
    if (type.includes("SIP")) {
      return number;
    }
    if (number.includes("@") || /^sip[:/]/i.test(number)) {
      return number;
    }
    return "-";
  }

  function inferNetwork(participant) {
    if (!participant || typeof participant !== "object") {
      return "-";
    }

    const detail = participant._details || null;
    const account = participant._account || null;

    const values = [
      account && account.settings && account.settings.transport,
      detail && detail.network,
      participant.network,
      detail && detail.params && detail.params.network,
      participant.params && participant.params.network,
    ];

    for (let index = 0; index < values.length; index += 1) {
      if (values[index] === null || values[index] === undefined) {
        continue;
      }
      const normalized = String(values[index]).trim();
      if (!normalized) {
        continue;
      }

      const lower = normalized.toLowerCase();
      if (
        lower.includes("cap.") ||
        lower === "yes" ||
        lower === "no" ||
        lower === "auto" ||
        lower === "port"
      ) {
        continue;
      }

      if (normalized) {
        return normalized;
      }
    }

    return "-";
  }

  function inferMediaFlag(participant, mediaType) {
    const detail = participant && participant._details ? participant._details : null;
    const params =
      detail && detail.params
        ? detail.params
        : participant && participant.params
          ? participant.params
          : {};
    if (mediaType === "audio") {
      if (typeof params.audio === "boolean") return params.audio;
      if (typeof params.remoteMic === "boolean") return params.remoteMic;
      if (typeof params.mic === "boolean") return params.mic;
      return false;
    }

    if (typeof params.video === "boolean") return params.video;
    if (typeof params.remoteCam === "boolean") return params.remoteCam;
    if (typeof params.camera === "boolean") return params.camera;
    return false;
  }

  function inferMicFlag(participant) {
    const detail = participant && participant._details ? participant._details : null;
    const params =
      detail && detail.params
        ? detail.params
        : participant && participant.params
          ? participant.params
          : {};

    if (typeof params.mic === "boolean") return params.mic;
    if (typeof params.remoteMic === "boolean") return params.remoteMic;
    return false;
  }

  function inferCameraFlag(participant) {
    const detail = participant && participant._details ? participant._details : null;
    const params =
      detail && detail.params
        ? detail.params
        : participant && participant.params
          ? participant.params
          : {};

    if (typeof params.camera === "boolean") return params.camera;
    if (typeof params.remoteCam === "boolean") return params.remoteCam;
    return false;
  }


  function extractParticipantShot(participant) {
    const detail = participant && participant._details ? participant._details : null;
    const source = detail || participant || {};
    const shots = Array.isArray(source.shots)
      ? source.shots
      : Array.isArray(participant && participant.shots)
        ? participant.shots
        : [];
    if (!shots.length) {
      return "";
    }
    return String(shots[0] || "").trim();
  }

  function createMediaCell(mediaType, isOn) {
    const stateText = isOn ? "On" : "Off";
    const pressed = isOn ? "true" : "false";
    const buttonTitle = isOn ? "Turn off " + mediaType : "Turn on " + mediaType;
    const toggleClass = isOn ? "is-on" : "is-off";
    let mediaIconPath = "";

    if (mediaType === "audio") {
      mediaIconPath =
        '<path d="M11 6 8.5 8.5H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h3.5L11 18a1 1 0 0 0 1.7-.71V6.71A1 1 0 0 0 11 6z"/>' +
        '<path d="M15.4 9.3a1 1 0 0 1 1.4 0 3.8 3.8 0 0 1 0 5.4 1 1 0 0 1-1.4-1.4 1.8 1.8 0 0 0 0-2.6 1 1 0 0 1 0-1.4z"/>';
    } else if (mediaType === "video") {
      mediaIconPath =
        '<path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm6 4v6l5-3-5-3z"/>';
    } else if (mediaType === "camera") {
      mediaIconPath =
        '<path d="M9 6h6l1.2 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2.8L9 6z"/>' +
        '<path d="M12 15.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>';
    } else {
      mediaIconPath =
        '<path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zm-5 8a1 1 0 0 1 1 1 4 4 0 0 0 8 0 1 1 0 1 1 2 0 6 6 0 0 1-5 5.91V21h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-3.09A6 6 0 0 1 6 12a1 1 0 0 1 1-1z"/>';
    }

    return (
      '<td class="media-cell-col">' +
      '<div class="media-cell">' +
      '<span class="media-state">' +
      stateText +
      "</span>" +
      '<button type="button" class="media-toggle ' +
      mediaType +
      " " +
      toggleClass +
      '" data-media="' +
      mediaType +
      '" data-on-label="On" data-off-label="Off" aria-pressed="' +
      pressed +
      '" title="' +
      buttonTitle +
      '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' +
      mediaIconPath +
      "</svg>" +
      "</button>" +
      "</div>" +
      "</td>"
    );
  }

  function createTextCell(value, extraClass) {
    const text = String(value === null || value === undefined ? "-" : value).trim() || "-";
    const classAttr = extraClass ? ' class="' + escapeHtml(extraClass) + '"' : "";
    return (
      "<td" +
      classAttr +
      ' title="' +
      escapeHtml(text) +
      '">' +
      escapeHtml(text) +
      "</td>"
    );
  }

  function renderEmptyRow(tableBody, message, conferenceNumber) {
    if (!tableBody) return;
    tableBody.innerHTML =
      '<tr class="participant-empty-row">' +
      '<td colspan="13">' +
      escapeHtml(message) +
      "</td>" +
      "</tr>";
    document.dispatchEvent(
      new CustomEvent("dashboard:participant-list-updated", {
        detail: {
          total: 0,
          conferenceNumber: String(conferenceNumber || "").trim(),
        },
      }),
    );
  }

  function renderParticipants(tableBody, participants, conferenceNumber) {
    if (!tableBody) return;

    if (!Array.isArray(participants) || participants.length === 0) {
      renderEmptyRow(tableBody, "No participants", conferenceNumber);
      return;
    }

    const rowsHtml = participants
      .map(function (participant) {
        const detail = participant && participant._details ? participant._details : null;
        const source = detail || participant;
        const status = inferStatus(source);
        const idValue = String(
          source && (source.id || source.number)
            ? source.id || source.number
            : "-",
        ).trim();
        const nameValue = String(
          (source &&
            (source.description ||
              source.displayName ||
              source.watermark)) ||
            source.number ||
            "-",
        ).trim();
        const roleValue = inferRole(source);
        const networkValue = inferNetwork(participant);
        const ipValue = extractIp(participant);
        const typeValue =
          String(
            (source && source.type) ||
              (participant && participant.type) ||
              "-",
          ).trim() || "-";
        const sipValue = inferSip(participant);
        const micOn = inferMicFlag(participant);
        const cameraOn = inferCameraFlag(participant);
        const audioOn = inferMediaFlag(participant, "audio");
        const videoOn = inferMediaFlag(participant, "video");
        const participantNumber = getParticipantNumberForPath(participant) || idValue;
        const participantShot = extractParticipantShot(participant);

        return (
          '<tr data-participant-id="' +
          escapeHtml(idValue) +
          '" data-participant-number="' +
          escapeHtml(participantNumber) +
          '" data-participant-shot="' +
          escapeHtml(participantShot) +
          '">' +
          createTextCell(idValue) +
          createTextCell(nameValue) +
          createTextCell(status.text, "state " + status.className) +
          createTextCell(roleValue) +
          createTextCell(networkValue) +
          createTextCell(ipValue) +
          createTextCell(typeValue) +
          createTextCell(sipValue) +
          createMediaCell("mic", micOn) +
          createMediaCell("camera", cameraOn) +
          createMediaCell("audio", audioOn) +
          createMediaCell("video", videoOn) +
          "</tr>"
        );
      })
      .join("");

    tableBody.innerHTML = rowsHtml;
    document.dispatchEvent(
      new CustomEvent("dashboard:participant-list-updated", {
        detail: {
          total: participants.length,
          conferenceNumber: String(conferenceNumber || "").trim(),
        },
      }),
    );
  }

  function getInitialActiveConferenceNumber() {
    const activeConferenceItem = document.querySelector(".conference-item.active");
    if (!activeConferenceItem) {
      return "";
    }
    return String(activeConferenceItem.dataset.number || "").trim();
  }

  function getParticipantNumberForPath(participant) {
    const source = participant && participant._details ? participant._details : participant;
    return String(
      (source && (source.number || source.id)) ||
        (participant && participant.number) ||
        "",
    ).trim();
  }

  function inferAccountLookupKey(participant) {
    const participantNumber = getParticipantNumberForPath(participant);
    if (!participantNumber) {
      return "";
    }

    const normalized = participantNumber.replace(/^sip[:/]/i, "").trim();
    if (!normalized) {
      return "";
    }

    if (/^\d+$/.test(normalized)) {
      return normalized;
    }

    if (/^[a-z0-9._-]+$/i.test(normalized) && !normalized.includes("@")) {
      return normalized;
    }

    return "";
  }

  async function enrichParticipants(
    apiClient,
    conferenceNumber,
    participants,
    options,
  ) {
    if (!Array.isArray(participants) || participants.length === 0) {
      return [];
    }

    const requestStillCurrent = options && options.requestStillCurrent
      ? options.requestStillCurrent
      : function () {
          return true;
        };
    const accountCache = options && options.accountCache ? options.accountCache : new Map();
    const pendingAccountRequests =
      options && options.pendingAccountRequests
        ? options.pendingAccountRequests
        : new Map();
    const endpointState = options && options.endpointState ? options.endpointState : {};

    async function getParticipantDetails(participantNumber) {
      if (!participantNumber) {
        return null;
      }
      try {
        const response = await apiClient.get(
          "/api/v1/participant/" +
            encodeURIComponent(conferenceNumber) +
            "/" +
            encodeURIComponent(participantNumber),
        );
        return extractParticipantDetailsPayload(response.data);
      } catch (error) {
        return null;
      }
    }

    async function getAccountDetails(accountKey) {
      if (!accountKey || endpointState.accountForbidden) {
        return null;
      }

      const cached = accountCache.get(accountKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
      }

      if (pendingAccountRequests.has(accountKey)) {
        return pendingAccountRequests.get(accountKey);
      }

      const requestPromise = (async function () {
        try {
          const response = await apiClient.get(
            "/api/v1/account/" + encodeURIComponent(accountKey),
          );
          const account = extractAccountPayload(response.data);
          accountCache.set(accountKey, {
            value: account,
            expiresAt: Date.now() + ACCOUNT_CACHE_TTL_MS,
          });
          return account;
        } catch (error) {
          const status = error && error.response ? Number(error.response.status) : 0;
          if (status === 401 || status === 403) {
            endpointState.accountForbidden = true;
          }
          accountCache.set(accountKey, {
            value: null,
            expiresAt: Date.now() + Math.floor(ACCOUNT_CACHE_TTL_MS / 2),
          });
          return null;
        } finally {
          pendingAccountRequests.delete(accountKey);
        }
      })();

      pendingAccountRequests.set(accountKey, requestPromise);
      return requestPromise;
    }

    const results = await Promise.all(
      participants.map(async function (participant) {
        if (!requestStillCurrent()) {
          return participant;
        }

        const participantNumber = getParticipantNumberForPath(participant);
        const details = await getParticipantDetails(participantNumber);
        const merged = Object.assign({}, participant, {
          _details: details || null,
        });

        if (!requestStillCurrent()) {
          return merged;
        }

        const accountKey = inferAccountLookupKey(merged);
        if (!accountKey) {
          return merged;
        }

        const account = await getAccountDetails(accountKey);
        return Object.assign({}, merged, {
          _account: account || null,
        });
      }),
    );

    return results;
  }

  function initParticipantManager() {
    if (managerInitialized) {
      return;
    }

    const tableBody = document.querySelector(".active-conferences-scroll tbody");
    const apiClient = window.DashboardAxios ? window.DashboardAxios.vinteo : null;

    if (!tableBody) {
      return;
    }

    managerInitialized = true;

    let latestRequestId = 0;
    let latestConferenceNumber = "";
    let refreshTimer = null;
    const accountCache = new Map();
    const pendingAccountRequests = new Map();
    const endpointState = {
      accountForbidden: false,
    };

    function resetRefreshTimer() {
      if (refreshTimer) {
        window.clearInterval(refreshTimer);
        refreshTimer = null;
      }

      if (!latestConferenceNumber) {
        return;
      }

      refreshTimer = window.setInterval(function () {
        if (document.hidden) {
          return;
        }
        void loadParticipants(latestConferenceNumber, true);
      }, PARTICIPANT_REFRESH_MS);
    }

    async function loadParticipants(conferenceNumber, silent) {
      const normalizedConferenceNumber = String(conferenceNumber || "").trim();
      latestConferenceNumber = normalizedConferenceNumber;
      resetRefreshTimer();

      if (!normalizedConferenceNumber) {
        renderEmptyRow(tableBody, "Select a conference", normalizedConferenceNumber);
        return;
      }

      if (!apiClient) {
        renderEmptyRow(tableBody, "API client is not ready", normalizedConferenceNumber);
        return;
      }

      const requestId = ++latestRequestId;

      try {
        const response = await apiClient.get(
          "/api/v1/participants/" + encodeURIComponent(normalizedConferenceNumber),
          {
            params: {
              limit: 200,
              offset: 0,
            },
          },
        );

        if (requestId !== latestRequestId) {
          return;
        }

        let participants = extractParticipantsPayload(response.data);

        if (!participants.length) {
          const retryResponse = await apiClient.get(
            "/api/v1/participants/" + encodeURIComponent(normalizedConferenceNumber),
          );
          if (requestId !== latestRequestId) {
            return;
          }
          participants = extractParticipantsPayload(retryResponse.data);
        }

        participants = await enrichParticipants(
          apiClient,
          normalizedConferenceNumber,
          participants,
          {
            requestStillCurrent: function () {
              return requestId === latestRequestId;
            },
            accountCache: accountCache,
            pendingAccountRequests: pendingAccountRequests,
            endpointState: endpointState,
          },
        );

        if (requestId !== latestRequestId) {
          return;
        }

        renderParticipants(tableBody, participants, normalizedConferenceNumber);
      } catch (error) {
        if (requestId !== latestRequestId) {
          return;
        }
        if (silent) {
          return;
        }
        renderEmptyRow(
          tableBody,
          "Cannot load participants: " + extractErrorMessage(error),
          normalizedConferenceNumber,
        );
      }
    }

    document.addEventListener(
      "dashboard:conference-active-changed",
      function (event) {
        const detail = event && event.detail ? event.detail : {};
        void loadParticipants(detail.number);
      },
    );

    document.addEventListener("dashboard:conference-list-refreshed", function () {
      void loadParticipants(latestConferenceNumber, true);
    });

    const initialConferenceNumber = getInitialActiveConferenceNumber();
    void loadParticipants(initialConferenceNumber);
  }

  window.DashboardParticipantManager = {
    initParticipantManager: initParticipantManager,
  };
})();
