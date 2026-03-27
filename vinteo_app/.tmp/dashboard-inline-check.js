(function () {
        function setParticipantMediaState(button, shouldBeOn) {
          if (!button) return;

          const mediaType = button.dataset.media || "media";
          const onLabel = button.dataset.onLabel || "On";
          const offLabel = button.dataset.offLabel || "Off";
          const stateText = button
            .closest(".media-cell")
            ?.querySelector(".media-state");

          button.classList.toggle("is-on", shouldBeOn);
          button.classList.toggle("is-off", !shouldBeOn);
          button.setAttribute("aria-pressed", String(shouldBeOn));
          button.title = shouldBeOn
            ? "Turn off " + mediaType
            : "Turn on " + mediaType;

          if (stateText) {
            stateText.textContent = shouldBeOn ? onLabel : offLabel;
          }
        }

        function getVinteoApiClient() {
          return window.DashboardAxios && window.DashboardAxios.vinteo
            ? window.DashboardAxios.vinteo
            : null;
        }

        function extractRequestErrorMessage(error) {
          if (
            error &&
            error.response &&
            error.response.data &&
            typeof error.response.data === "object"
          ) {
            const message =
              error.response.data.message ||
              error.response.data.error ||
              error.response.data.status;
            if (typeof message === "string" && message.trim()) {
              return message.trim();
            }
          }

          if (error && typeof error.message === "string" && error.message.trim()) {
            return error.message.trim();
          }

          return "Request failed.";
        }

        function getActiveConferenceNumber() {
          const activeConferenceItem = document.querySelector(".conference-item.active");
          if (!activeConferenceItem) {
            return "";
          }
          return String(activeConferenceItem.dataset.number || "").trim();
        }

        function getParticipantNumberFromButton(button) {
          const row = button ? button.closest("tr") : null;
          if (!row) {
            return "";
          }

          return String(
            row.dataset.participantNumber || row.dataset.participantId || "",
          ).trim();
        }

        function getParticipantNumberFromRow(row) {
          if (!row) {
            return "";
          }
          return String(
            row.dataset.participantNumber || row.dataset.participantId || "",
          ).trim();
        }

        function getParticipantDisplayNameFromRow(row) {
          const nameCell = row && row.children ? row.children[1] : null;
          return nameCell ? String(nameCell.textContent || "").trim() : "";
        }

        function findRenderedParticipantRowByNumber(participantNumber) {
          const normalized = String(participantNumber || "").trim();
          if (!normalized) {
            return null;
          }

          const rows = Array.from(
            document.querySelectorAll(".active-conferences-scroll tbody tr"),
          ).filter(function (row) {
            return !row.classList.contains("participant-empty-row");
          });

          return (
            rows.find(function (row) {
              return getParticipantNumberFromRow(row) === normalized;
            }) || null
          );
        }

        function findRenderedMediaButton(participantNumber, mediaType) {
          const row = findRenderedParticipantRowByNumber(participantNumber);
          if (!row) {
            return null;
          }
          return row.querySelector(".media-toggle." + mediaType);
        }

        let cachedKickConfirmPopup = null;
        let kickConfirmPopupInitialized = false;

        function getKickConfirmPopup() {
          if (kickConfirmPopupInitialized) {
            return cachedKickConfirmPopup;
          }

          kickConfirmPopupInitialized = true;
          const popupManager = window.DashboardPopupManager;
          if (
            popupManager &&
            typeof popupManager.createConfirmPopup === "function"
          ) {
            cachedKickConfirmPopup = popupManager.createConfirmPopup({
              modalId: "kick-confirm-modal",
              messageSelector: "#kick-confirm-message",
              confirmSelector: "[data-kick-confirm]",
              cancelSelector: "[data-kick-cancel]",
              closeSelector: "[data-kick-modal-close]",
            });
          }

          return cachedKickConfirmPopup;
        }

        async function requestAudioStateChange(
          conferenceNumber,
          participants,
          shouldEnable,
        ) {
          const apiClient = getVinteoApiClient();
          if (!apiClient) {
            throw new Error("API client is not ready.");
          }

          const normalizedConference = String(conferenceNumber || "").trim();
          const normalizedParticipants = Array.from(
            new Set(
              (Array.isArray(participants) ? participants : [])
                .map(function (value) {
                  return String(value || "").trim();
                })
                .filter(Boolean),
            ),
          );

          if (!normalizedConference) {
            throw new Error("Conference is not selected.");
          }
          if (!normalizedParticipants.length) {
            throw new Error("Participant is not selected.");
          }

          await apiClient.post(
            shouldEnable ? "/api/v1/enable_audio" : "/api/v1/disable_audio",
            {
              conference: normalizedConference,
              participants: normalizedParticipants,
            },
          );
        }

        async function requestCameraStateChange(
          conferenceNumber,
          participants,
          shouldEnable,
        ) {
          const apiClient = getVinteoApiClient();
          if (!apiClient) {
            throw new Error("API client is not ready.");
          }

          const normalizedConference = String(conferenceNumber || "").trim();
          const normalizedParticipants = Array.from(
            new Set(
              (Array.isArray(participants) ? participants : [])
                .map(function (value) {
                  return String(value || "").trim();
                })
                .filter(Boolean),
            ),
          );

          if (!normalizedConference) {
            throw new Error("Conference is not selected.");
          }
          if (!normalizedParticipants.length) {
            throw new Error("Participant is not selected.");
          }

          await apiClient.post(
            shouldEnable ? "/api/v1/enable_camera" : "/api/v1/disable_camera",
            {
              conference: normalizedConference,
              participants: normalizedParticipants,
            },
          );
        }

        async function requestMicStateChange(
          conferenceNumber,
          participants,
          shouldEnable,
        ) {
          const apiClient = getVinteoApiClient();
          if (!apiClient) {
            throw new Error("API client is not ready.");
          }

          const normalizedConference = String(conferenceNumber || "").trim();
          const normalizedParticipants = Array.from(
            new Set(
              (Array.isArray(participants) ? participants : [])
                .map(function (value) {
                  return String(value || "").trim();
                })
                .filter(Boolean),
            ),
          );

          if (!normalizedConference) {
            throw new Error("Conference is not selected.");
          }
          if (!normalizedParticipants.length) {
            throw new Error("Participant is not selected.");
          }

          const payload = {
            conference: normalizedConference,
            participants: normalizedParticipants,
          };

          if (!shouldEnable) {
            payload.notLecturer = false;
          }

          await apiClient.post(
            shouldEnable ? "/api/v1/enable_mic" : "/api/v1/disable_mic",
            payload,
          );
        }

        async function requestVideoStateChange(
          conferenceNumber,
          participants,
          shouldEnable,
        ) {
          const apiClient = getVinteoApiClient();
          if (!apiClient) {
            throw new Error("API client is not ready.");
          }

          const normalizedConference = String(conferenceNumber || "").trim();
          const normalizedParticipants = Array.from(
            new Set(
              (Array.isArray(participants) ? participants : [])
                .map(function (value) {
                  return String(value || "").trim();
                })
                .filter(Boolean),
            ),
          );

          if (!normalizedConference) {
            throw new Error("Conference is not selected.");
          }
          if (!normalizedParticipants.length) {
            throw new Error("Participant is not selected.");
          }

          await apiClient.post(
            shouldEnable ? "/api/v1/enable_video" : "/api/v1/disable_video",
            {
              conference: normalizedConference,
              participants: normalizedParticipants,
            },
          );
        }

        async function requestDeleteParticipant(
          conferenceNumber,
          participantNumber,
        ) {
          const apiClient = getVinteoApiClient();
          if (!apiClient) {
            throw new Error("API client is not ready.");
          }

          const normalizedConference = String(conferenceNumber || "").trim();
          const normalizedParticipant = String(participantNumber || "").trim();

          if (!normalizedConference) {
            throw new Error("Conference is not selected.");
          }
          if (!normalizedParticipant) {
            throw new Error("Participant is not selected.");
          }

          await apiClient.post("/api/v1/disconnect", {
            conference: normalizedConference,
            participants: [normalizedParticipant],
          });
        }

        function collectParticipantIdentifiers(row) {
          if (!row) {
            return [];
          }

          const idCell = row.children && row.children[0] ? row.children[0] : null;
          const idCellTitle = idCell ? String(idCell.getAttribute("title") || "").trim() : "";
          const idCellText = idCell ? String(idCell.textContent || "").trim() : "";
          const candidateValues = [
            getParticipantNumberFromRow(row),
            String(row.dataset.participantId || "").trim(),
            idCellTitle,
            idCellText,
          ];

          return Array.from(
            new Set(
              candidateValues.filter(function (value) {
                return Boolean(value);
              }),
            ),
          );
        }

        function removeParticipantVisualsByName(participantName) {
          const normalizedName = String(participantName || "")
            .trim()
            .toLowerCase();
          if (!normalizedName || normalizedName === "no participant") {
            return;
          }

          const tiles = Array.from(
            document.querySelectorAll(".zoom-grid .zoom-tile:not(.zoom-overlay-tile)"),
          );

          tiles.forEach(function (tile) {
            const siteName = String(tile.dataset.siteName || "")
              .trim()
              .toLowerCase();
            if (siteName !== normalizedName) {
              return;
            }
            tile.dataset.siteName = "No Participant";
            const label = tile.querySelector(".zoom-label");
            if (label) {
              label.textContent = "No Participant";
            }
            tile.classList.remove("is-presentation");
          });
        }

        async function executeKickParticipantRow(row) {
          if (!row || row.classList.contains("participant-empty-row")) {
            return false;
          }

          const participantNumber = getParticipantNumberFromRow(row);
          const currentRow =
            findRenderedParticipantRowByNumber(participantNumber) || row;

          if (!currentRow || currentRow.classList.contains("participant-empty-row")) {
            return false;
          }

          if (currentRow.dataset.kickBusy === "1") {
            return false;
          }

          const conferenceNumber = getActiveConferenceNumber();
          const participantName = getParticipantDisplayNameFromRow(currentRow);
          const kickButton = currentRow.querySelector(".kick-btn");
          const participantIdentifiers = collectParticipantIdentifiers(currentRow);

          currentRow.dataset.kickBusy = "1";
          if (kickButton) {
            kickButton.disabled = true;
          }

          try {
            let disconnectError = null;
            let disconnected = false;

            for (let index = 0; index < participantIdentifiers.length; index += 1) {
              const candidate = participantIdentifiers[index];
              try {
                await requestDeleteParticipant(conferenceNumber, candidate);
                disconnected = true;
                break;
              } catch (error) {
                disconnectError = error;
              }
            }

            if (!disconnected) {
              throw disconnectError || new Error("Participant does not exist.");
            }

            currentRow.remove();
            removeParticipantVisualsByName(participantName);
            syncMuteAllButtonState();
            return true;
          } catch (error) {
            window.alert(
              "Cannot remove participant: " + extractRequestErrorMessage(error),
            );
            return false;
          } finally {
            currentRow.dataset.kickBusy = "0";
            if (kickButton) {
              kickButton.disabled = false;
            }
          }
        }

        function triggerKickWithConfirmation(row) {
          if (!row || row.classList.contains("participant-empty-row")) {
            return;
          }

          const participantNumber = getParticipantNumberFromRow(row);
          const currentRow =
            findRenderedParticipantRowByNumber(participantNumber) || row;
          const memberName =
            getParticipantDisplayNameFromRow(currentRow) || "participant";
          const message =
            "Are you sure you want to kick " +
            memberName +
            " out of this meeting?";

          const kickPopup = getKickConfirmPopup();
          const usedModal =
            kickPopup &&
            kickPopup.open({
              message: message,
              onConfirm: function () {
                void executeKickParticipantRow(currentRow);
              },
            });
          if (usedModal) {
            return;
          }

          const accepted = window.confirm(message);
          if (accepted) {
            void executeKickParticipantRow(currentRow);
          }
        }

        function getMediaTypeFromButton(button) {
          if (!button) return "";
          return String(button.dataset.media || "").trim().toLowerCase();
        }

        async function applyParticipantMediaChange(button, shouldBeOn, options) {
          const optionObject = options && typeof options === "object" ? options : {};
          const optionMediaType = String(optionObject.mediaType || "")
            .trim()
            .toLowerCase();
          const optionParticipantNumber = String(
            optionObject.participantNumber || "",
          ).trim();

          const mediaType = optionMediaType || getMediaTypeFromButton(button);
          const participantNumber =
            optionParticipantNumber || getParticipantNumberFromButton(button);
          const resolvedButton =
            button || findRenderedMediaButton(participantNumber, mediaType);

          if (!resolvedButton || resolvedButton.dataset.busy === "1") {
            return false;
          }

          const conferenceNumber = getActiveConferenceNumber();
          const shouldSyncMuteAll = mediaType === "audio";

          resolvedButton.dataset.busy = "1";
          resolvedButton.disabled = true;

          try {
            if (mediaType === "audio") {
              await requestAudioStateChange(
                conferenceNumber,
                [participantNumber],
                shouldBeOn,
              );
            } else if (mediaType === "camera") {
              await requestCameraStateChange(
                conferenceNumber,
                [participantNumber],
                shouldBeOn,
              );
            } else if (mediaType === "mic") {
              await requestMicStateChange(
                conferenceNumber,
                [participantNumber],
                shouldBeOn,
              );
            } else if (mediaType === "video") {
              await requestVideoStateChange(
                conferenceNumber,
                [participantNumber],
                shouldBeOn,
              );
            }

            const currentRenderedButton = findRenderedMediaButton(
              participantNumber,
              mediaType,
            );
            if (currentRenderedButton) {
              setParticipantMediaState(currentRenderedButton, shouldBeOn);
            } else {
              setParticipantMediaState(resolvedButton, shouldBeOn);
            }

            if (shouldSyncMuteAll) {
              syncMuteAllButtonState();
            }

            return true;
          } catch (error) {
            let errorPrefix = "Cannot update participant media: ";
            if (mediaType === "audio") {
              errorPrefix = "Cannot update participant audio: ";
            } else if (mediaType === "camera") {
              errorPrefix = "Cannot update participant camera: ";
            } else if (mediaType === "mic") {
              errorPrefix = "Cannot update participant microphone: ";
            } else if (mediaType === "video") {
              errorPrefix = "Cannot update participant video: ";
            }
            window.alert(errorPrefix + extractRequestErrorMessage(error));
            return false;
          } finally {
            resolvedButton.dataset.busy = "0";
            resolvedButton.disabled = false;
          }
        }

        function syncMuteAllButtonState() {
          const muteAllButton = document.querySelector(
            ".panel-mic-btn.mic-all",
          );
          const audioButtons = Array.from(
            document.querySelectorAll(".media-toggle.audio"),
          );

          if (!muteAllButton) return;

          if (audioButtons.length === 0) {
            muteAllButton.classList.remove("is-muted");
            muteAllButton.setAttribute("aria-pressed", "false");
            muteAllButton.title = "Mute all participants";
            return;
          }

          const allMuted = audioButtons.every(function (button) {
            return button.classList.contains("is-off");
          });

          muteAllButton.classList.toggle("is-muted", allMuted);
          muteAllButton.setAttribute("aria-pressed", String(allMuted));
          muteAllButton.title = allMuted
            ? "Unmute all participants"
            : "Mute all participants";
        }

        function initMicToggle() {
          const muteAllButton = document.querySelector(
            ".panel-mic-btn.mic-all",
          );
          if (!muteAllButton) return;

          muteAllButton.addEventListener("click", async function () {
            if (muteAllButton.dataset.busy === "1") {
              return;
            }

            const willMuteAll = !muteAllButton.classList.contains("is-muted");
            const audioButtons = Array.from(document.querySelectorAll(
              ".media-toggle.audio",
            ));
            const conferenceNumber = getActiveConferenceNumber();
            const participantNumbers = audioButtons
              .map(function (button) {
                return getParticipantNumberFromButton(button);
              })
              .filter(Boolean);

            if (!audioButtons.length) {
              return;
            }

            muteAllButton.dataset.busy = "1";
            muteAllButton.disabled = true;

            try {
              await requestAudioStateChange(
                conferenceNumber,
                participantNumbers,
                !willMuteAll,
              );
              audioButtons.forEach(function (button) {
                setParticipantMediaState(button, !willMuteAll);
              });
              syncMuteAllButtonState();
            } catch (error) {
              window.alert(
                "Cannot update participant audio: " +
                  extractRequestErrorMessage(error),
              );
            } finally {
              muteAllButton.dataset.busy = "0";
              muteAllButton.disabled = false;
            }

          });

          syncMuteAllButtonState();
        }

        function initParticipantMediaToggles() {
          const tableBody = document.querySelector(".active-conferences-scroll tbody");
          if (!tableBody) return;
          if (tableBody.dataset.mediaBound === "1") return;

          tableBody.dataset.mediaBound = "1";

          tableBody.addEventListener("click", function (event) {
            const toggleButton = event.target.closest(".media-toggle");
            if (toggleButton && tableBody.contains(toggleButton)) {
              const isOn = toggleButton.classList.contains("is-on");
              void applyParticipantMediaChange(toggleButton, !isOn);
              return;
            }

            const mediaCell = event.target.closest(".media-cell");
            if (!mediaCell || !tableBody.contains(mediaCell)) {
              return;
            }

            const button = mediaCell.querySelector(".media-toggle");
            if (!button) {
              return;
            }

            const isOn = button.classList.contains("is-on");
            void applyParticipantMediaChange(button, !isOn);
          });
        }

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
            return getParticipantDisplayNameFromRow(row);
          }

          function findRowByName(name) {
            const normalized = normalizeName(name);
            if (!normalized) {
              return null;
            }

            const rows = Array.from(tableBody.querySelectorAll("tr")).filter(
              function (row) {
                return !row.classList.contains("participant-empty-row");
              },
            );

            return (
              rows.find(function (row) {
                return normalizeName(getRowName(row)) === normalized;
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

            const rows = Array.from(tableBody.querySelectorAll("tr")).filter(
              function (row) {
                return !row.classList.contains("participant-empty-row");
              },
            );

            return (
              rows.find(function (row) {
                return getParticipantNumberFromRow(row) === normalized;
              }) || null
            );
          }

          function resolveActiveRow() {
            if (activeParticipantNumber) {
              const rowByNumber = findRowByParticipantNumber(
                activeParticipantNumber,
              );
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

        function initMediaSortButtons() {
          const table = document.querySelector(
            ".active-conferences-scroll table",
          );
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

            const text = String(statusCell.textContent || "")
              .trim()
              .toLowerCase();
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
              const statusMode =
                button.dataset.sortStatusMode || "connected-first";
              const rows = Array.from(tableBody.querySelectorAll("tr")).map(
                function (row, index) {
                  return { row: row, index: index };
                },
              );

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

        function createKickButton(memberName) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "kick-btn";
          button.dataset.memberName = memberName;
          button.title = "Kick " + memberName;
          button.setAttribute("aria-label", "Kick " + memberName);
          button.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M10 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-3.87 0-7 2.01-7 4.5V20h10.48a5.43 5.43 0 0 1-.48-2.25c0-1.42.55-2.7 1.45-3.66A13.8 13.8 0 0 0 10 14z"/>' +
            '<path d="M15.71 14.29a1 1 0 0 0-1.42 1.42L15.59 17l-1.3 1.29a1 1 0 1 0 1.42 1.42L17 18.41l1.29 1.3a1 1 0 0 0 1.42-1.42L18.41 17l1.3-1.29a1 1 0 0 0-1.42-1.42L17 15.59l-1.29-1.3z"/>' +
            "</svg>";
          return button;
        }

        function initKickMemberButtons() {
          const participantTable = document.querySelector(
            ".active-conferences-scroll table",
          );
          const tableBody = participantTable
            ? participantTable.querySelector("tbody")
            : null;

          if (!participantTable || !tableBody) return;

          Array.from(tableBody.querySelectorAll("tr")).forEach(function (row) {
            if (row.classList.contains("participant-empty-row")) return;
            if (row.querySelector("td.kick-col")) return;

            const nameCell = row.children[1];
            const memberName = nameCell
              ? nameCell.textContent.trim()
              : "participant";

            const actionCell = document.createElement("td");
            actionCell.className = "kick-col";

            const actionWrap = document.createElement("div");
            actionWrap.className = "kick-cell";
            actionWrap.appendChild(createKickButton(memberName));

            actionCell.appendChild(actionWrap);
            row.appendChild(actionCell);
          });

          if (tableBody.dataset.kickBound === "1") return;
          tableBody.dataset.kickBound = "1";

          tableBody.addEventListener("click", function (event) {
            const kickButton = event.target.closest(".kick-btn");
            if (!kickButton) return;

            const targetRow = kickButton.closest("tr");
            if (!targetRow) return;

            triggerKickWithConfirmation(targetRow);
          });
        }

        document.addEventListener("dashboard:participant-list-updated", function () {
          initKickMemberButtons();
          syncMuteAllButtonState();
        });

        function initLeaveConferenceConfirm() {
          const leaveButton = document.querySelector(".zoom-control-btn.leave");
          const popupManager = window.DashboardPopupManager;
          const leavePopup =
            popupManager &&
            typeof popupManager.createConfirmPopup === "function"
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
          const searchInput = document.getElementById(
            "conference-search-input",
          );

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
              const descriptionText = normalizeSearchText(
                item.dataset.description,
              );
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

        function syncParticipantListHeight() {
          const stage = document.querySelector(".split-main .zoom-stage");
          const participantBoxes = Array.from(
            document.querySelectorAll(".info-grid .box"),
          );

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

            const headHeight = boxHead
              ? Math.ceil(boxHead.getBoundingClientRect().height)
              : 0;
            const bodyHeight = Math.max(stageHeight - headHeight - 2, 120);

            box.style.height = stageHeight + "px";
            box.style.maxHeight = stageHeight + "px";
            participantBody.style.height = bodyHeight + "px";
            participantBody.style.maxHeight = bodyHeight + "px";
          });
        }

        function syncConferenceListHeight() {
          const activeConferences = document.querySelector(
            ".active-conferences-wide",
          );
          const navPanel = document.querySelector(".sidebar .nav-panel");
          const list = document.querySelector(".sidebar .conference-list");
          const caption = navPanel
            ? navPanel.querySelector(".panel-caption")
            : null;
          const toolbar = navPanel
            ? navPanel.querySelector(".conference-toolbar")
            : null;

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
          const captionHeight = caption
            ? Math.ceil(caption.getBoundingClientRect().height)
            : 0;
          const toolbarHeight = toolbar
            ? Math.ceil(toolbar.getBoundingClientRect().height)
            : 0;
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

        window.addEventListener("load", function () {
          initSystemTimeClock();
          initMicToggle();
          initParticipantMediaToggles();
          initParticipantContextMenu();
          initMediaSortButtons();
          initKickMemberButtons();
          initLeaveConferenceConfirm();
          initConferenceSearch();
          if (
            window.DashboardAddressBookManager &&
            typeof window.DashboardAddressBookManager.initAddressBookManager ===
              "function"
          ) {
            window.DashboardAddressBookManager.initAddressBookManager();
          }
          if (
            window.DashboardConferenceManager &&
            typeof window.DashboardConferenceManager.initConferenceManager ===
              "function"
          ) {
            window.DashboardConferenceManager.initConferenceManager();
          }
          if (
            window.DashboardParticipantManager &&
            typeof window.DashboardParticipantManager.initParticipantManager ===
              "function"
          ) {
            window.DashboardParticipantManager.initParticipantManager();
          }
          if (
            window.DashboardLayout &&
            typeof window.DashboardLayout.initLayoutSelector === "function"
          ) {
            window.DashboardLayout.initLayoutSelector();
          }
          syncDashboardLayoutHeights();
          window.requestAnimationFrame(syncDashboardLayoutHeights);
        });
        window.addEventListener("resize", syncDashboardLayoutHeights);
      })();
