(function () {
  const STREAM_REFRESH_MS = 20000;
  const PREVIEW_REFRESH_MS = 800;
  const WEBCAST_SETTINGS_SYNC_TTL_MS = 120000;
  const HLS_PLAY_TIMEOUT_MS = 10000;
  const LAYOUT_STREAM_RELOAD_DEBOUNCE_MS = 120;

  let currentConference = "";
  let currentStreamSrc = "";
  let currentPreviewSrc = "";
  let activeRequestId = 0;
  let refreshTimer = null;
  let previewTimer = null;
  let layoutReloadTimer = null;
  let layoutTileSyncFrameId = 0;
  let rowClickBound = false;
  let hlsInstance = null;
  let currentRenderMode = "none";
  let webcastSettingsSync = {
    conference: "",
    at: 0,
  };

  let videoEl = null;
  let previewEl = null;
  let statusEl = null;

  function getApiClient() {
    return window.DashboardAxios && window.DashboardAxios.vinteo
      ? window.DashboardAxios.vinteo
      : null;
  }

  function extractErrorMessage(error, fallbackMessage) {
    if (error && error.response && error.response.data) {
      const data = error.response.data;
      if (typeof data === "string" && data.trim()) {
        return data.trim();
      }
      if (typeof data === "object") {
        if (typeof data.message === "string" && data.message.trim()) {
          return data.message.trim();
        }
        if (typeof data.error === "string" && data.error.trim()) {
          return data.error.trim();
        }
      }
      if (error.response.status) {
        return "Request failed with status " + error.response.status + ".";
      }
    }

    if (error && typeof error.message === "string" && error.message.trim()) {
      return error.message.trim();
    }

    return fallbackMessage || "Request failed.";
  }

  function getActiveConferenceNumber() {
    const activeItem = document.querySelector(".conference-item.active");
    if (!activeItem) {
      return "";
    }
    return String(activeItem.dataset.number || "").trim();
  }

  function getPrimaryTile() {
    return (
      document.querySelector(
        ".zoom-grid .zoom-tile.main:not(.zoom-overlay-tile)",
      ) ||
      document.querySelector(".zoom-grid .zoom-tile:not(.zoom-overlay-tile)")
    );
  }

  function normalizeLabel(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  function isSingleTileLayout() {
    const grid = document.querySelector(".zoom-grid");
    if (!grid) {
      return false;
    }

    const tiles = grid.querySelectorAll(".zoom-tile:not(.zoom-overlay-tile)");
    return tiles.length === 1;
  }

  function getPrimaryTileLabel() {
    const primaryTile = getPrimaryTile();
    if (!primaryTile) {
      return "";
    }

    const siteName = String(primaryTile.dataset.siteName || "").trim();
    if (siteName) {
      return siteName;
    }

    const label = primaryTile.querySelector(".zoom-label");
    return label ? String(label.textContent || "").trim() : "";
  }

  function resolvePrimaryTileParticipantShot() {
    if (!isSingleTileLayout()) {
      return "";
    }

    const matchedRow = resolveRowByTileLabel(getPrimaryTileLabel());
    if (matchedRow) {
      return String(matchedRow.dataset.participantShot || "").trim();
    }

    const fallbackRow = getRenderableParticipantRows().find(function (row) {
      return Boolean(String(row.dataset.participantShot || "").trim());
    });

    if (!fallbackRow) {
      return "";
    }

    return String(fallbackRow.dataset.participantShot || "").trim();
  }

  function resolvePrimaryTileParticipantCandidates() {
    if (!isSingleTileLayout()) {
      return [];
    }

    const matchedRow = resolveRowByTileLabel(getPrimaryTileLabel());
    if (matchedRow) {
      return getRowIdentityCandidates(matchedRow);
    }

    const fallbackRow = getRenderableParticipantRows().find(function (row) {
      return Boolean(
        String(row.dataset.participantNumber || row.dataset.participantId || "").trim(),
      );
    });
    if (!fallbackRow) {
      return [];
    }

    return getRowIdentityCandidates(fallbackRow);
  }

  function getRenderableParticipantRows() {
    return Array.from(
      document.querySelectorAll(".active-conferences-scroll tbody tr"),
    ).filter(function (row) {
      return !row.classList.contains("participant-empty-row");
    });
  }

  function getRowIdentityCandidates(row) {
    if (!row) {
      return [];
    }

    const cells = row.children || [];
    const idCell = cells[0] || null;
    const nameCell = cells[1] || null;

    return [
      row.dataset.participantNumber,
      row.dataset.participantId,
      idCell ? idCell.getAttribute("title") : "",
      idCell ? idCell.textContent : "",
      nameCell ? nameCell.getAttribute("title") : "",
      nameCell ? nameCell.textContent : "",
    ]
      .map(function (value) {
        return String(value || "").trim();
      })
      .filter(Boolean);
  }

  function resolveRowByTileLabel(tileLabel) {
    const normalizedTileLabel = normalizeLabel(tileLabel);
    if (!normalizedTileLabel || normalizedTileLabel === "no participant") {
      return null;
    }

    const rows = getRenderableParticipantRows();
    return (
      rows.find(function (row) {
        return getRowIdentityCandidates(row).some(function (candidate) {
          return normalizeLabel(candidate) === normalizedTileLabel;
        });
      }) || null
    );
  }

  function getTileLabel(tile) {
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

  function resolveTileShot(tile) {
    const row = resolveRowByTileLabel(getTileLabel(tile));
    if (!row) {
      return "";
    }

    return String(row.dataset.participantShot || "").trim();
  }

  function resolveBestPreviewSource(previewSrc) {
    const directPreview = String(previewSrc || "").trim();
    const participantShot = resolvePrimaryTileParticipantShot();

    if (directPreview) {
      return directPreview;
    }

    if (participantShot) {
      return participantShot;
    }

    if (currentPreviewSrc) {
      return currentPreviewSrc;
    }

    return "";
  }

  function ensureStatusElement() {
    if (statusEl && document.contains(statusEl)) {
      return statusEl;
    }

    const stageBody = document.querySelector(".zoom-stage-body");
    if (!stageBody) {
      return null;
    }

    const existing = stageBody.querySelector(".zoom-stream-status");
    if (existing) {
      statusEl = existing;
      return statusEl;
    }

    statusEl = document.createElement("div");
    statusEl.className = "zoom-stream-status";
    statusEl.hidden = true;
    stageBody.appendChild(statusEl);
    return statusEl;
  }

  function setStatus(message) {
    void message;
    if (statusEl && document.contains(statusEl)) {
      statusEl.hidden = true;
      statusEl.textContent = "";
    }
  }

  function ensureMediaElements() {
    if (!videoEl) {
      videoEl = document.createElement("video");
      videoEl.className = "zoom-live-video";
      videoEl.autoplay = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.setAttribute("playsinline", "");
      videoEl.setAttribute("aria-hidden", "true");
    }

    if (!previewEl) {
      previewEl = document.createElement("img");
      previewEl.className = "zoom-live-preview";
      previewEl.alt = "Conference preview";
      previewEl.setAttribute("aria-hidden", "true");
    }
  }

  function clearLiveMediaTileClass() {
    document
      .querySelectorAll(".zoom-grid .zoom-tile.has-live-media")
      .forEach(function (tile) {
        tile.classList.remove("has-live-media");
      });
  }

  function removeTileShotElements() {
    document
      .querySelectorAll(".zoom-grid .zoom-tile .zoom-tile-shot")
      .forEach(function (img) {
        img.remove();
      });
  }

  function teardownGlobalStreamMedia() {
    stopPreviewLoop();
    destroyHls();
    clearLiveMediaTileClass();

    if (videoEl) {
      videoEl.pause();
      videoEl.removeAttribute("src");
      videoEl.load();
      if (videoEl.parentElement) {
        videoEl.parentElement.removeChild(videoEl);
      }
    }

    if (previewEl) {
      previewEl.removeAttribute("src");
      if (previewEl.parentElement) {
        previewEl.parentElement.removeChild(previewEl);
      }
    }

    currentStreamSrc = "";
    currentPreviewSrc = "";
    currentRenderMode = "none";
  }

  function renderTileShotsForGrid() {
    const tiles = Array.from(
      document.querySelectorAll(
        ".zoom-grid .zoom-tile:not(.zoom-overlay-tile)",
      ),
    );

    if (!tiles.length || tiles.length === 1) {
      return false;
    }

    const isAlreadyGridShots = currentRenderMode === "grid-shots";
    if (!isAlreadyGridShots) {
      teardownGlobalStreamMedia();
    }

    let hasShot = false;

    tiles.forEach(function (tile) {
      const baseShotSrc = normalizeToProxyApiPath(resolveTileShot(tile));
      const existing = tile.querySelector(".zoom-tile-shot");

      if (!baseShotSrc) {
        if (existing) {
          existing.remove();
        }
        tile.classList.remove("has-live-media");
        return;
      }

      hasShot = true;
      const shotImg =
        existing ||
        (function () {
          const img = document.createElement("img");
          img.className = "zoom-tile-shot";
          img.alt = "";
          img.setAttribute("aria-hidden", "true");
          tile.insertBefore(img, tile.firstChild);
          return img;
        })();

      shotImg.classList.remove("is-low-source");
      shotImg.style.removeProperty("--shot-width");
      shotImg.style.removeProperty("--shot-height");

      shotImg.src = buildRefreshableImageUrl(baseShotSrc);
      tile.classList.add("has-live-media");
    });

    if (hasShot) {
      currentRenderMode = "grid-shots";
      setStatus("Participant tile preview mode");
    } else {
      currentRenderMode = "none";
      setStatus("No participant previews available.");
    }

    return true;
  }

  function mountIntoPrimaryTile(element) {
    if (!element) {
      return;
    }

    const primaryTile = getPrimaryTile();
    if (!primaryTile) {
      return;
    }

    clearLiveMediaTileClass();
    primaryTile.classList.add("has-live-media");

    const alternateElement = element === videoEl ? previewEl : videoEl;
    if (
      alternateElement &&
      alternateElement.parentElement &&
      alternateElement !== element
    ) {
      alternateElement.parentElement.removeChild(alternateElement);
    }

    if (
      element.parentElement === primaryTile &&
      primaryTile.firstElementChild === element
    ) {
      return;
    }

    const firstChild = primaryTile.firstChild;
    if (!firstChild) {
      primaryTile.appendChild(element);
      return;
    }

    if (firstChild === element) {
      return;
    }

    primaryTile.insertBefore(element, firstChild);
  }

  function stopPreviewLoop() {
    if (previewTimer) {
      window.clearInterval(previewTimer);
      previewTimer = null;
    }
  }

  function stopRefreshLoop() {
    if (refreshTimer) {
      window.clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  function stopLayoutReloadTimer() {
    if (layoutReloadTimer) {
      window.clearTimeout(layoutReloadTimer);
      layoutReloadTimer = null;
    }
  }

  function stopLayoutTileSyncFrame() {
    if (layoutTileSyncFrameId) {
      window.cancelAnimationFrame(layoutTileSyncFrameId);
      layoutTileSyncFrameId = 0;
    }
  }

  function destroyHls() {
    if (hlsInstance && typeof hlsInstance.destroy === "function") {
      hlsInstance.destroy();
    }
    hlsInstance = null;
  }

  function normalizeUpstreamUrl(url) {
    const value = String(url || "").trim();
    if (!value) {
      return "";
    }

    if (/^https?:\/\//i.test(value)) {
      return value;
    }

    if (value.startsWith("/")) {
      return value;
    }

    return value;
  }

  function normalizeToProxyApiPath(url) {
    const normalized = normalizeUpstreamUrl(url);
    if (!normalized) {
      return "";
    }

    if (normalized.startsWith("/api/vinteo/")) {
      return normalized;
    }

    try {
      const parsed = /^https?:\/\//i.test(normalized)
        ? new URL(normalized)
        : new URL(normalized, window.location.origin);

      const pathWithQuery = parsed.pathname + parsed.search;

      if (pathWithQuery.startsWith("/api/vinteo/")) {
        return pathWithQuery;
      }

      if (parsed.pathname.startsWith("/")) {
        return "/api/vinteo" + pathWithQuery;
      }

      return normalized;
    } catch (error) {
      if (normalized.startsWith("/")) {
        return "/api/vinteo" + normalized;
      }
      return normalized;
    }
  }

  function searchStringDeep(node, matcher, keyMatcher) {
    if (!node) {
      return "";
    }

    if (Array.isArray(node)) {
      for (let index = 0; index < node.length; index += 1) {
        const value = searchStringDeep(node[index], matcher, keyMatcher);
        if (value) {
          return value;
        }
      }
      return "";
    }

    if (typeof node !== "object") {
      return "";
    }

    const keys = Object.keys(node);
    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const value = node[key];
      if (typeof value === "string") {
        if (matcher(value, key) || (keyMatcher && keyMatcher(key, value))) {
          return value;
        }
      }
    }

    for (let index = 0; index < keys.length; index += 1) {
      const key = keys[index];
      const value = searchStringDeep(node[key], matcher, keyMatcher);
      if (value) {
        return value;
      }
    }

    return "";
  }

  function extractToken(payload) {
    return String(
      searchStringDeep(
        payload,
        function () {
          return false;
        },
        function (key, value) {
          const normalizedKey = String(key || "").toLowerCase();
          if (!normalizedKey.includes("token")) {
            return false;
          }
          if (
            normalizedKey.includes("access") ||
            normalizedKey.includes("refresh")
          ) {
            return false;
          }
          return String(value || "").trim().length > 0;
        },
      ) || "",
    ).trim();
  }

  function extractHlsSrc(payload) {
    return normalizeUpstreamUrl(
      searchStringDeep(payload, function (value, key) {
        const text = String(value || "")
          .trim()
          .toLowerCase();
        const normalizedKey = String(key || "").toLowerCase();

        if (normalizedKey.includes("preview") || text.includes("/preview/")) {
          return false;
        }

        return text.includes(".m3u8") || normalizedKey === "src";
      }),
    );
  }

  function extractPreviewSrc(payload) {
    const bestMatch = findBestStringDeep(payload, function (value, key) {
      const text = String(value || "")
        .trim()
        .toLowerCase();
      const normalizedKey = String(key || "").toLowerCase();

      return (
        !text.includes(".m3u8") &&
        (normalizedKey.includes("preview") ||
          text.includes("/stream/preview/") ||
          text.includes("/screenshot/"))
      );
    });

    return normalizeUpstreamUrl(bestMatch);
  }

  function extractParticipantPreviewSrc(payload) {
    const directPreview = extractPreviewSrc(payload);
    if (directPreview) {
      return directPreview;
    }

    const bestMatch = findBestStringDeep(payload, function (value, key) {
      const text = String(value || "")
        .trim()
        .toLowerCase();
      const normalizedKey = String(key || "").toLowerCase();
      if (!text || text.startsWith("sip/")) {
        return false;
      }

      const keyMatched =
        normalizedKey.includes("preview") ||
        normalizedKey.includes("shot") ||
        normalizedKey.includes("screenshot") ||
        normalizedKey.includes("image") ||
        normalizedKey.includes("snapshot") ||
        normalizedKey.includes("thumb");

      const valueMatched =
        text.includes("/preview/") ||
        text.includes("/screenshot/") ||
        text.includes("/snapshot/") ||
        text.includes("/shot/") ||
        text.includes("/image/") ||
        /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i.test(text);

      if (!keyMatched && !valueMatched) {
        return false;
      }

      return !text.includes(".m3u8");
    });

    return normalizeUpstreamUrl(bestMatch);
  }

  function extractStreamsCollection(payload) {
    const roots = [
      payload,
      payload && payload.data,
      payload && payload.data && payload.data.data,
    ];

    for (let index = 0; index < roots.length; index += 1) {
      const root = roots[index];
      if (!root) continue;
      if (Array.isArray(root)) {
        return root;
      }
      if (Array.isArray(root.streams)) {
        return root.streams;
      }
      if (Array.isArray(root.items)) {
        return root.items;
      }
    }

    return [];
  }

  function findConferenceStreamEntry(payload, conferenceNumber) {
    const normalizedConference = String(conferenceNumber || "").trim();
    if (!normalizedConference) {
      return null;
    }

    const streams = extractStreamsCollection(payload);
    for (let index = 0; index < streams.length; index += 1) {
      const item = streams[index];
      if (!item || typeof item !== "object") {
        continue;
      }

      const candidates = [
        item.number,
        item.conference,
        item.conferenceNumber,
        item.id,
        item.stream && item.stream.number,
        item.stream && item.stream.conference,
      ];

      const matched = candidates.some(function (candidate) {
        return String(candidate || "").trim() === normalizedConference;
      });

      if (matched) {
        return item;
      }
    }

    return null;
  }

  function buildStreamSourceCandidates(streamSrc) {
    const candidates = [];
    const direct = normalizeUpstreamUrl(streamSrc);
    const proxied = normalizeToProxyApiPath(streamSrc);

    const isAbsoluteHlsStream =
      /^https?:\/\//i.test(String(direct || "")) &&
      /\/stream\/.+\.m3u8(\?|$)/i.test(String(direct || ""));

    if (direct) {
      candidates.push(direct);
    }
    // Absolute HLS URLs should be consumed directly. Proxy fallback for these
    // often produces 404 on upstream /stream/* in local deployments.
    if (!isAbsoluteHlsStream && proxied && !candidates.includes(proxied)) {
      candidates.push(proxied);
    }

    return candidates;
  }

  function buildPreviewSourceCandidates(previewSrc) {
    const candidates = [];
    const direct = normalizeUpstreamUrl(previewSrc);
    const proxied = normalizeToProxyApiPath(previewSrc);
    const directText = String(direct || "");
    const shouldPreferProxy = directText.startsWith("/");

    if (shouldPreferProxy && proxied) {
      candidates.push(proxied);
    }
    if (direct) {
      candidates.push(direct);
    }
    if (proxied && !candidates.includes(proxied)) {
      candidates.push(proxied);
    }

    return candidates;
  }

  function buildRefreshableImageUrl(sourceUrl) {
    const base = String(sourceUrl || "").trim();
    if (!base) {
      return "";
    }

    if (!base.includes("?")) {
      return base + "?_=" + Date.now();
    }

    return base + "&_=" + Date.now();
  }

  async function resolveConferencePreviewFromParticipants(conferenceNumber) {
    const apiClient = getApiClient();
    if (!apiClient) {
      return "";
    }

    const normalizedConference = String(conferenceNumber || "").trim();
    if (!normalizedConference) {
      return "";
    }

    const endpoint = "/api/v1/participants/" + encodeURIComponent(normalizedConference);
    const variants = [
      {
        params: {
          withScreenshots: true,
          limit: 200,
          offset: 0,
        },
      },
      {
        params: {
          limit: 200,
          offset: 0,
        },
      },
      null,
    ];

    for (let index = 0; index < variants.length; index += 1) {
      const variant = variants[index];
      try {
        const response = variant
          ? await apiClient.get(endpoint, { params: variant.params })
          : await apiClient.get(endpoint);
        const preview = extractParticipantPreviewSrc(response.data);
        if (preview) {
          return preview;
        }
      } catch (_error) {
        // Continue fallback chain.
      }
    }

    return "";
  }

  async function syncWebcastSettings(conferenceNumber) {
    const apiClient = getApiClient();
    if (!apiClient) {
      return;
    }

    const normalizedConference = String(conferenceNumber || "").trim();
    if (!normalizedConference) {
      return;
    }

    const now = Date.now();
    if (
      webcastSettingsSync.conference === normalizedConference &&
      now - webcastSettingsSync.at < WEBCAST_SETTINGS_SYNC_TTL_MS
    ) {
      return;
    }

    const path = "/api/v1/webcast/" + encodeURIComponent(normalizedConference);
    const basePayload = {
      hls: true,
      hlsAbs: true,
      hlsTime: 4,
      hlsListSize: 4,
    };

    if (isSingleTileLayout()) {
      basePayload.mosaic = "1";
    }

    try {
      // Prefer maximum practical quality first.
      await apiClient.patch(path, {
        ...basePayload,
        resolution: "UHD",
        bandwidth: 10240,
      });
    } catch (_error) {
      try {
        // Fallback to widely accepted profile when UHD is unsupported.
        await apiClient.patch(path, {
          ...basePayload,
          resolution: "FULLHD",
          bandwidth: 4096,
        });
      } catch (_error2) {
        // Non-blocking. Some environments may restrict this endpoint.
      }
    } finally {
      webcastSettingsSync = {
        conference: normalizedConference,
        at: now,
      };
    }
  }

  async function resolveStreamData(conferenceNumber) {
    const apiClient = getApiClient();
    if (!apiClient) {
      throw new Error("API client is not ready.");
    }

    const normalizedConference = String(conferenceNumber || "").trim();
    if (!normalizedConference) {
      return { hlsSrc: "", previewSrc: "", token: "" };
    }

    let token = "";
    let hlsSrc = "";
    let previewSrc = "";

    await syncWebcastSettings(normalizedConference);

    const enableResponse = await apiClient.post("/api/v1/enable_webcast", {
      conference: normalizedConference,
    });
    token = extractToken(enableResponse.data);
    hlsSrc = extractHlsSrc(enableResponse.data);
    previewSrc = extractPreviewSrc(enableResponse.data);

    if (!token || (!hlsSrc && !previewSrc)) {
      try {
        const webcastResponse = await apiClient.get(
          "/api/v1/webcast/" + encodeURIComponent(normalizedConference),
        );
        token = token || extractToken(webcastResponse.data);
        hlsSrc = hlsSrc || extractHlsSrc(webcastResponse.data);
        previewSrc = previewSrc || extractPreviewSrc(webcastResponse.data);
      } catch (_error) {
        // Keep fallback chain.
      }
    }

    if (!token || (!hlsSrc && !previewSrc)) {
      try {
        const streamsResponse = await apiClient.get("/api/v1/streams");
        const conferenceEntry = findConferenceStreamEntry(
          streamsResponse.data,
          normalizedConference,
        );
        if (conferenceEntry) {
          token = token || extractToken(conferenceEntry);
          hlsSrc = hlsSrc || extractHlsSrc(conferenceEntry);
          previewSrc = previewSrc || extractPreviewSrc(conferenceEntry);
        }
      } catch (_error) {
        // Keep fallback chain.
      }
    }

    if (token && (!hlsSrc || !previewSrc)) {
      const streamResponse = await apiClient.get(
        "/api/v1/stream/" + encodeURIComponent(token),
      );
      hlsSrc = hlsSrc || extractHlsSrc(streamResponse.data);
      previewSrc = previewSrc || extractPreviewSrc(streamResponse.data);
    }

    return {
      token: token,
      hlsSrc: hlsSrc,
      previewSrc: previewSrc,
    };
  }

  async function resolveParticipantPreviewFromApi(
    conferenceNumber,
    participantCandidates,
  ) {
    const apiClient = getApiClient();
    if (!apiClient) {
      return "";
    }

    const normalizedConference = String(conferenceNumber || "").trim();
    if (!normalizedConference) {
      return "";
    }

    const uniqueCandidates = Array.from(
      new Set(
        (Array.isArray(participantCandidates) ? participantCandidates : [])
          .map(function (value) {
            return String(value || "").trim();
          })
          .filter(Boolean),
      ),
    );

    for (let index = 0; index < uniqueCandidates.length; index += 1) {
      const participant = uniqueCandidates[index];
      const participantPath = encodeURIComponent(participant);
      const conferencePath = encodeURIComponent(normalizedConference);

      try {
        const detailResponse = await apiClient.get(
          "/api/v1/participant/" + conferencePath + "/" + participantPath,
        );
        const detailPreview = extractParticipantPreviewSrc(detailResponse.data);
        if (detailPreview) {
          return detailPreview;
        }
      } catch (_error) {
        // Continue fallback chain for this participant.
      }

      try {
        const settingsResponse = await apiClient.get(
          "/api/v1/participant/" + conferencePath + "/" + participantPath + "/settings",
        );
        const settingsPreview = extractParticipantPreviewSrc(settingsResponse.data);
        if (settingsPreview) {
          return settingsPreview;
        }
      } catch (_error) {
        // Continue with next participant.
      }
    }

    return "";
  }

  function scorePreviewCandidate(value, keyHint) {
    const text = String(value || "").toLowerCase();
    const key = String(keyHint || "").toLowerCase();
    let score = 0;

    if (/\.(png|webp)(\?|$)/i.test(text)) {
      score += 2;
    }
    if (/(\buhd\b|4k|2160|1440|1080|fullhd|fhd|720)/i.test(text)) {
      score += 8;
    }
    if (/(origin|original|source|full|large|hq|high|best|max)/i.test(text)) {
      score += 5;
    }
    if (/(origin|original|source|full|large|hq|high|best|max)/i.test(key)) {
      score += 5;
    }
    if (/(preview|shot|screenshot|snapshot|image|frame)/i.test(key)) {
      score += 2;
    }
    if (/(thumb|thumbnail|tiny|small|icon|low|lq|mini|avatar)/i.test(text)) {
      score -= 8;
    }
    if (/(thumb|thumbnail|tiny|small|icon|low|lq|mini|avatar)/i.test(key)) {
      score -= 8;
    }
    if (/\/in(\?|\/|$)/i.test(text)) {
      score += 6;
    }
    if (/\/out(\?|\/|$)/i.test(text)) {
      score -= 6;
    }

    score += Math.min(text.length / 180, 2);
    return score;
  }

  function findBestStringDeep(node, matcher) {
    const byValue = new Map();

    function walk(value, keyHint) {
      if (value === null || value === undefined) {
        return;
      }

      if (typeof value === "string") {
        if (!matcher(value, keyHint)) {
          return;
        }

        const text = String(value || "").trim();
        if (!text) {
          return;
        }

        const score = scorePreviewCandidate(text, keyHint);
        const cached = byValue.get(text);
        if (!cached || score > cached.score) {
          byValue.set(text, {
            value: text,
            score: score,
          });
        }
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(function (item) {
          walk(item, keyHint);
        });
        return;
      }

      if (typeof value !== "object") {
        return;
      }

      Object.keys(value).forEach(function (key) {
        walk(value[key], key);
      });
    }

    walk(node, "");

    const candidates = Array.from(byValue.values());
    if (!candidates.length) {
      return "";
    }

    candidates.sort(function (a, b) {
      if (a.score !== b.score) {
        return b.score - a.score;
      }
      return b.value.length - a.value.length;
    });

    return candidates[0].value || "";
  }

  function canPlayHlsNatively() {
    if (!videoEl || typeof videoEl.canPlayType !== "function") {
      return false;
    }
    return Boolean(videoEl.canPlayType("application/vnd.apple.mpegurl"));
  }

  function playPreview(previewSrc, statusText) {
    ensureMediaElements();
    removeTileShotElements();
    stopPreviewLoop();

    const previewCandidates = [];
    const sourceInputs = Array.isArray(previewSrc)
      ? previewSrc
      : [resolveBestPreviewSource(previewSrc)];

    sourceInputs.forEach(function (source) {
      const sourceCandidates = buildPreviewSourceCandidates(source);
      sourceCandidates.forEach(function (candidate) {
        if (!candidate) {
          return;
        }
        if (!previewCandidates.includes(candidate)) {
          previewCandidates.push(candidate);
        }
      });
    });

    if (!previewCandidates.length) {
      setStatus("No preview source for this conference stream.");
      return false;
    }

    let previewRevision = 0;
    let previewCandidateIndex = 0;
    let hasActivePreviewSurface =
      currentRenderMode === "preview" &&
      previewEl &&
      previewEl.parentElement &&
      document.contains(previewEl);

    if (currentPreviewSrc) {
      const persistedIndex = previewCandidates.indexOf(currentPreviewSrc);
      if (persistedIndex >= 0) {
        previewCandidateIndex = persistedIndex;
      }
    }

    function activatePreviewSurface() {
      if (!hasActivePreviewSurface) {
        destroyHls();

        if (videoEl) {
          videoEl.pause();
          videoEl.removeAttribute("src");
          videoEl.load();
          if (videoEl.parentElement) {
            videoEl.parentElement.removeChild(videoEl);
          }
        }

        mountIntoPrimaryTile(previewEl);
        hasActivePreviewSurface = true;
        return;
      }

      if (!previewEl.parentElement) {
        mountIntoPrimaryTile(previewEl);
      }
    }

    function updatePreviewSrc(allowFailover) {
      previewRevision += 1;
      const currentRevision = previewRevision;
      const basePreviewSrc = previewCandidates[previewCandidateIndex] || "";
      if (!basePreviewSrc) {
        return;
      }

      const nextSrc = buildRefreshableImageUrl(basePreviewSrc);

      const loader = new Image();
      loader.onload = function () {
        if (currentRevision !== previewRevision) {
          return;
        }
        activatePreviewSurface();
        previewEl.src = nextSrc;
        currentPreviewSrc = basePreviewSrc;
        currentStreamSrc = "";
        currentRenderMode = "preview";
        setStatus(statusText || "Live preview mode");
      };
      loader.onerror = function () {
        if (currentRevision !== previewRevision) {
          return;
        }
        if (previewCandidates.length > 1) {
          previewCandidateIndex =
            (previewCandidateIndex + 1) % previewCandidates.length;
          if (allowFailover) {
            updatePreviewSrc(false);
          }
        }
      };
      loader.src = nextSrc;
    }

    updatePreviewSrc(true);
    previewTimer = window.setInterval(function () {
      updatePreviewSrc(true);
    }, PREVIEW_REFRESH_MS);
    return true;
  }

  async function playVideoStream(streamSrc, previewSrc) {
    ensureMediaElements();
    removeTileShotElements();
    stopPreviewLoop();
    const preferredPreviewSrc = resolveBestPreviewSource(previewSrc);

    const streamCandidates = buildStreamSourceCandidates(streamSrc);
    if (!streamCandidates.length) {
      if (preferredPreviewSrc) {
        return playPreview(preferredPreviewSrc);
      }
      setStatus("No stream source returned.");
      return false;
    }

    mountIntoPrimaryTile(videoEl);

    if (
      currentStreamSrc &&
      streamCandidates.includes(currentStreamSrc) &&
      videoEl.src
    ) {
      try {
        await videoEl.play();
        if (previewEl && previewEl.parentElement) {
          previewEl.parentElement.removeChild(previewEl);
        }
        setStatus("");
        return true;
      } catch (_error) {
        // Continue to re-attach below.
      }
    }

    let streamError = null;

    for (let index = 0; index < streamCandidates.length; index += 1) {
      const candidateSrc = streamCandidates[index];

      try {
        destroyHls();
        videoEl.pause();
        videoEl.removeAttribute("src");
        videoEl.load();

        if (canPlayHlsNatively()) {
          videoEl.src = candidateSrc;
          await videoEl.play();
        } else if (window.Hls && window.Hls.isSupported()) {
          await new Promise(function (resolve, reject) {
            let settled = false;
            let networkRecoveries = 0;
            let mediaRecoveries = 0;
            let timeoutId = null;

            function settle(fn, value) {
              if (settled) return;
              settled = true;
              if (timeoutId) {
                window.clearTimeout(timeoutId);
              }
              fn(value);
            }

            hlsInstance = new window.Hls({
              lowLatencyMode: true,
              liveSyncDurationCount: 2,
              maxBufferLength: 8,
              backBufferLength: 16,
              enableWorker: true,
              capLevelToPlayerSize: false,
              abrEwmaDefaultEstimate: 10 * 1024 * 1024,
            });

            hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, function () {
              const levels = Array.isArray(hlsInstance.levels)
                ? hlsInstance.levels
                : [];
              if (levels.length) {
                let bestLevelIndex = 0;
                let bestBitrate = Number(levels[0].bitrate || 0);
                for (let levelIndex = 1; levelIndex < levels.length; levelIndex += 1) {
                  const bitrate = Number(levels[levelIndex].bitrate || 0);
                  if (bitrate > bestBitrate) {
                    bestBitrate = bitrate;
                    bestLevelIndex = levelIndex;
                  }
                }

                hlsInstance.autoLevelCapping = -1;
                hlsInstance.currentLevel = bestLevelIndex;
                hlsInstance.nextLevel = bestLevelIndex;
                hlsInstance.loadLevel = bestLevelIndex;
              }

              videoEl
                .play()
                .then(function () {
                  settle(resolve);
                })
                .catch(function (error) {
                  settle(reject, error);
                });
            });

            hlsInstance.on(window.Hls.Events.ERROR, function (_event, data) {
              if (!data || !data.fatal) {
                return;
              }

              if (
                data.type === window.Hls.ErrorTypes.NETWORK_ERROR &&
                networkRecoveries < 1
              ) {
                networkRecoveries += 1;
                hlsInstance.startLoad();
                return;
              }

              if (
                data.type === window.Hls.ErrorTypes.MEDIA_ERROR &&
                mediaRecoveries < 1
              ) {
                mediaRecoveries += 1;
                hlsInstance.recoverMediaError();
                return;
              }

              settle(
                reject,
                new Error(String(data.details || "HLS playback failed.")),
              );
            });

            timeoutId = window.setTimeout(function () {
              settle(reject, new Error("HLS playback timeout."));
            }, HLS_PLAY_TIMEOUT_MS);

            hlsInstance.loadSource(candidateSrc);
            hlsInstance.attachMedia(videoEl);
          });
        } else {
          throw new Error("Browser cannot play HLS stream.");
        }

        currentStreamSrc = candidateSrc;
        currentPreviewSrc = "";
        currentRenderMode = "hls";
        if (previewEl && previewEl.parentElement) {
          previewEl.parentElement.removeChild(previewEl);
        }
        setStatus("");
        return true;
      } catch (error) {
        streamError = error;
      }
    }

    if (preferredPreviewSrc) {
      return playPreview(preferredPreviewSrc);
    }

    setStatus(
      extractErrorMessage(streamError, "Cannot play HLS stream."),
    );
    return false;
  }

  async function loadConferenceStream(conferenceNumber) {
    const normalizedConference = String(conferenceNumber || "").trim();
    currentConference = normalizedConference;
    stopLayoutReloadTimer();
    stopRefreshLoop();

    if (!normalizedConference) {
      setStatus("Select a conference to view stream.");
      return;
    }

    const requestId = ++activeRequestId;
    let resolvedStreamData = null;
    const singleTile = isSingleTileLayout();

    try {
      if (singleTile) {
        const immediateParticipantPreview = resolvePrimaryTileParticipantShot();
        if (immediateParticipantPreview) {
          const immediateCandidates = buildPreviewSourceCandidates(
            immediateParticipantPreview,
          );
          const hasImmediatePreview =
            currentRenderMode === "preview" &&
            immediateCandidates.includes(currentPreviewSrc);

          if (!hasImmediatePreview) {
            playPreview(immediateParticipantPreview, "Participant preview mode");
          }
        }

        const previewCandidates = [];

        function addPreviewCandidate(src) {
          const resolved = String(src || "").trim();
          if (!resolved) {
            return;
          }
          if (previewCandidates.includes(resolved)) {
            return;
          }
          previewCandidates.push(resolved);
        }

        addPreviewCandidate(immediateParticipantPreview);

        const participantCandidates = resolvePrimaryTileParticipantCandidates();
        if (participantCandidates.length) {
          const participantPreview = await resolveParticipantPreviewFromApi(
            normalizedConference,
            participantCandidates,
          );
          if (requestId !== activeRequestId) {
            return;
          }
          addPreviewCandidate(participantPreview);
        }

        const conferenceParticipantPreview =
          await resolveConferencePreviewFromParticipants(normalizedConference);
        if (requestId !== activeRequestId) {
          return;
        }
        addPreviewCandidate(conferenceParticipantPreview);

        try {
          resolvedStreamData = await resolveStreamData(normalizedConference);
        } catch (_streamResolveError) {
          resolvedStreamData = null;
        }

        if (requestId !== activeRequestId) {
          return;
        }

        if (resolvedStreamData) {
          addPreviewCandidate(resolvedStreamData.previewSrc);
        }

        if (
          previewCandidates.length &&
          playPreview(previewCandidates, "Participant preview mode")
        ) {
          return;
        }

        if (resolvedStreamData && resolvedStreamData.hlsSrc) {
          const played = await playVideoStream(
            resolvedStreamData.hlsSrc,
            previewCandidates[0] || resolvedStreamData.previewSrc || "",
          );
          if (requestId !== activeRequestId) {
            return;
          }
          if (played) {
            return;
          }
        }

        if (currentRenderMode !== "preview" && currentRenderMode !== "hls") {
          setStatus("No participant preview available for this conference.");
        }
        return;
      }

      if (renderTileShotsForGrid()) {
        if (requestId !== activeRequestId) {
          return;
        }
        return;
      }

      const pinnedParticipantPreview = resolvePrimaryTileParticipantShot();
      if (pinnedParticipantPreview) {
        if (requestId !== activeRequestId) {
          return;
        }

        playPreview(pinnedParticipantPreview, "Participant preview mode");
        return;
      }

      const streamData =
        resolvedStreamData || (await resolveStreamData(normalizedConference));
      if (requestId !== activeRequestId) {
        return;
      }

      await playVideoStream(streamData.hlsSrc, streamData.previewSrc);
    } catch (error) {
      if (requestId !== activeRequestId) {
        return;
      }
      setStatus(extractErrorMessage(error, "Cannot load conference stream."));
    }
  }

  function collectParticipantCandidates(row) {
    if (!row) {
      return [];
    }

    const firstCell = row.children && row.children[0] ? row.children[0] : null;
    const values = [
      row.dataset.participantNumber,
      row.dataset.participantId,
      firstCell ? firstCell.getAttribute("title") : "",
      firstCell ? firstCell.textContent : "",
    ];

    const cleaned = values
      .map(function (value) {
        return String(value || "").trim();
      })
      .filter(Boolean)
      .filter(function (value) {
        const lowered = value.toLowerCase();
        return (
          lowered !== "-" && lowered !== "--" && lowered !== "no participant"
        );
      });

    return Array.from(new Set(cleaned));
  }

  async function focusParticipantOnStage(participantCandidates) {
    const apiClient = getApiClient();
    if (!apiClient) {
      throw new Error("API client is not ready.");
    }

    const conferenceNumber = String(
      currentConference || getActiveConferenceNumber(),
    ).trim();

    if (!conferenceNumber) {
      throw new Error("Conference is not selected.");
    }

    const candidates = Array.isArray(participantCandidates)
      ? participantCandidates
      : [participantCandidates];

    const normalizedCandidates = Array.from(
      new Set(
        candidates
          .map(function (value) {
            return String(value || "").trim();
          })
          .filter(Boolean),
      ),
    );

    if (!normalizedCandidates.length) {
      throw new Error("Participant is not selected.");
    }

    await apiClient.post("/api/v1/enable_lecturer_mode", {
      conference: conferenceNumber,
    });

    let lastError = null;
    const conferenceValue = /^\d+$/.test(conferenceNumber)
      ? Number(conferenceNumber)
      : conferenceNumber;

    for (let index = 0; index < normalizedCandidates.length; index += 1) {
      const candidate = normalizedCandidates[index];
      try {
        await apiClient.post("/api/v1/appoint_lecturer", {
          conference: conferenceValue,
          participant: candidate,
        });
        setStatus("Focused participant " + candidate);
        window.setTimeout(function () {
          if (
            statusEl &&
            statusEl.textContent.startsWith("Focused participant")
          ) {
            setStatus("");
          }
        }, 1500);
        return candidate;
      } catch (error) {
        lastError = error;
      }
    }

    throw (
      lastError || new Error("Cannot appoint lecturer for this participant.")
    );
  }

  function bindParticipantClickFocus() {
    if (rowClickBound) {
      return;
    }

    const tableBody = document.querySelector(
      ".active-conferences-scroll tbody",
    );
    if (!tableBody) {
      return;
    }

    rowClickBound = true;

    tableBody.addEventListener("click", function (event) {
      const target =
        event.target instanceof Element
          ? event.target
          : event.target && event.target.parentElement
            ? event.target.parentElement
            : null;
      if (!target) {
        return;
      }

      if (
        target.closest(
          "button, .media-toggle, .kick-btn, input, select, a, .participant-context-menu",
        )
      ) {
        return;
      }

      const row = target.closest("tr");
      if (!row || row.classList.contains("participant-empty-row")) {
        return;
      }

      const participantCandidates = collectParticipantCandidates(row);
      if (!participantCandidates.length) {
        return;
      }

      const participantShot = String(row.dataset.participantShot || "").trim();
      if (participantShot) {
        playPreview(participantShot, "Participant preview");
      }

      void focusParticipantOnStage(participantCandidates)
        .then(function () {
          return loadConferenceStream(currentConference);
        })
        .catch(function (error) {
          setStatus(
            "Cannot focus participant: " +
              extractErrorMessage(error, "Unknown focus error."),
          );
        });
    });
  }

  function bindConferenceChangeListener() {
    document.addEventListener(
      "dashboard:conference-active-changed",
      function (event) {
        const detail = event && event.detail ? event.detail : {};
        stopLayoutReloadTimer();
        void loadConferenceStream(detail.number || "");
      },
    );
  }

  function scheduleLayoutStreamReload(conferenceNumber) {
    const normalizedConference = String(conferenceNumber || "").trim();
    if (!normalizedConference) {
      return;
    }

    if (layoutReloadTimer) {
      window.clearTimeout(layoutReloadTimer);
    }

    layoutReloadTimer = window.setTimeout(function () {
      layoutReloadTimer = null;
      void loadConferenceStream(normalizedConference);
    }, LAYOUT_STREAM_RELOAD_DEBOUNCE_MS);
  }

  function bindLayoutChangeListener() {
    document.addEventListener("dashboard:layout-rendered", function () {
      if (!currentConference) {
        currentConference = getActiveConferenceNumber();
      }
      if (!currentConference) {
        return;
      }
      scheduleLayoutStreamReload(currentConference);
    });
  }

  function syncMediaForTilePlacement() {
    if (!currentConference) {
      currentConference = getActiveConferenceNumber();
    }
    if (!currentConference) {
      return;
    }

    if (isSingleTileLayout()) {
      const participantShot = resolvePrimaryTileParticipantShot();
      if (participantShot) {
        playPreview(participantShot, "Participant preview mode");
      } else if (currentRenderMode === "none") {
        void loadConferenceStream(currentConference);
      }
      return;
    }

    renderTileShotsForGrid();
  }

  function scheduleTilePlacementMediaSync() {
    stopLayoutTileSyncFrame();
    layoutTileSyncFrameId = window.requestAnimationFrame(function () {
      layoutTileSyncFrameId = 0;
      syncMediaForTilePlacement();
    });
  }

  function bindLayoutTileUpdateListener() {
    document.addEventListener("dashboard:layout-tiles-updated", function () {
      scheduleTilePlacementMediaSync();
    });
  }

  function bindParticipantListChangeListener() {
    document.addEventListener(
      "dashboard:participant-list-updated",
      function () {
        if (!currentConference) {
          currentConference = getActiveConferenceNumber();
        }
        if (!currentConference) {
          return;
        }

        if (isSingleTileLayout()) {
          // Keep HLS stable, but refresh preview fallback when participant shot appears/changes.
          if (currentRenderMode === "hls") {
            return;
          }

          const participantShot = resolvePrimaryTileParticipantShot();
          if (participantShot) {
            const shotCandidates = buildPreviewSourceCandidates(participantShot);
            if (
              currentRenderMode !== "preview" ||
              !shotCandidates.includes(currentPreviewSrc)
            ) {
              playPreview(participantShot, "Participant preview mode");
            }
            return;
          }

          if (currentRenderMode === "none") {
            void loadConferenceStream(currentConference);
          }
          return;
        }

        if (currentRenderMode === "grid-shots") {
          renderTileShotsForGrid();
        }
      },
    );
  }

  function bindGridMutationObserver() {
    const grid = document.querySelector(".zoom-grid");
    if (!grid) {
      return;
    }

    const observer = new MutationObserver(function () {
      if (videoEl && videoEl.parentElement) {
        mountIntoPrimaryTile(videoEl);
      } else if (previewEl && previewEl.parentElement) {
        mountIntoPrimaryTile(previewEl);
      }
    });

    observer.observe(grid, {
      childList: true,
      subtree: false,
    });
  }

  function initStageStreamManager() {
    ensureMediaElements();
    ensureStatusElement();
    bindParticipantClickFocus();
    bindConferenceChangeListener();
    bindLayoutChangeListener();
    bindLayoutTileUpdateListener();
    bindParticipantListChangeListener();
    bindGridMutationObserver();

    currentConference = getActiveConferenceNumber();
    void loadConferenceStream(currentConference);
  }

  window.DashboardStageStream = {
    initStageStreamManager: initStageStreamManager,
    loadConferenceStream: loadConferenceStream,
  };
})();
