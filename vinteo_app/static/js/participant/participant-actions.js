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

          if (
            error &&
            typeof error.message === "string" &&
            error.message.trim()
          ) {
            return error.message.trim();
          }

          return "Request failed.";
        }

        function getActiveConferenceNumber() {
          const activeConferenceItem = document.querySelector(
            ".conference-item.active",
          );
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

        function isParticipantRowDisconnected(row) {
          if (!row || row.classList.contains("participant-empty-row")) {
            return true;
          }

          const statusCell = row.children && row.children[2] ? row.children[2] : null;
          const statusText = String(
            (statusCell && statusCell.textContent) || "",
          ).trim().toLowerCase();

          if (statusText.includes("disconnect")) {
            return true;
          }

          if (statusCell && statusCell.classList.contains("crit")) {
            return true;
          }

          return false;
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

          const idCell =
            row.children && row.children[0] ? row.children[0] : null;
          const idCellTitle = idCell
            ? String(idCell.getAttribute("title") || "").trim()
            : "";
          const idCellText = idCell
            ? String(idCell.textContent || "").trim()
            : "";
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
            document.querySelectorAll(
              ".zoom-grid .zoom-tile:not(.zoom-overlay-tile)",
            ),
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

          if (
            !currentRow ||
            currentRow.classList.contains("participant-empty-row")
          ) {
            return false;
          }

          if (currentRow.dataset.kickBusy === "1") {
            return false;
          }

          const conferenceNumber = getActiveConferenceNumber();
          const participantName = getParticipantDisplayNameFromRow(currentRow);
          const kickButton = currentRow.querySelector(".kick-btn");
          const participantIdentifiers =
            collectParticipantIdentifiers(currentRow);

          currentRow.dataset.kickBusy = "1";
          if (kickButton) {
            kickButton.disabled = true;
          }

          try {
            let disconnectError = null;
            let disconnected = false;

            for (
              let index = 0;
              index < participantIdentifiers.length;
              index += 1
            ) {
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
          return String(button.dataset.media || "")
            .trim()
            .toLowerCase();
        }

        async function applyParticipantMediaChange(
          button,
          shouldBeOn,
          options,
        ) {
          const optionObject =
            options && typeof options === "object" ? options : {};
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
          const shouldSyncMuteAll = [
            "audio",
            "video",
            "mic",
            "camera",
          ].includes(mediaType);

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

        function syncBulkMediaButtonState(config) {
          const toggleButton = document.querySelector(config.buttonSelector);
          if (!toggleButton) return;

          const mediaButtons = Array.from(
            document.querySelectorAll(".media-toggle." + config.mediaType),
          );

          if (mediaButtons.length === 0) {
            toggleButton.classList.remove("is-muted");
            toggleButton.setAttribute("aria-pressed", "false");
            toggleButton.title = config.disableAllTitle;
            return;
          }

          const allOff = mediaButtons.every(function (button) {
            return button.classList.contains("is-off");
          });

          toggleButton.classList.toggle("is-muted", allOff);
          toggleButton.setAttribute("aria-pressed", String(allOff));
          toggleButton.title = allOff
            ? config.enableAllTitle
            : config.disableAllTitle;
        }

        function syncMuteAllButtonState() {
          syncBulkMediaButtonState({
            buttonSelector: ".panel-mic-btn.mic-all",
            mediaType: "mic",
            disableAllTitle: "Mute all microphones",
            enableAllTitle: "Unmute all microphones",
          });
          syncBulkMediaButtonState({
            buttonSelector: ".panel-mic-btn.camera-all",
            mediaType: "camera",
            disableAllTitle: "Turn off all cameras",
            enableAllTitle: "Turn on all cameras",
          });
          syncBulkMediaButtonState({
            buttonSelector: ".panel-mic-btn.audio-all",
            mediaType: "audio",
            disableAllTitle: "Turn off all audio",
            enableAllTitle: "Turn on all audio",
          });
          syncBulkMediaButtonState({
            buttonSelector: ".panel-mic-btn.video-all",
            mediaType: "video",
            disableAllTitle: "Turn off all video",
            enableAllTitle: "Turn on all video",
          });
        }

        function collectBulkMediaTargets(mediaType, willDisableAll) {
          const mediaButtons = Array.from(
            document.querySelectorAll(".media-toggle." + mediaType),
          );
          const targetByParticipant = new Map();

          mediaButtons.forEach(function (button) {
            const row = button.closest("tr");
            if (!row || isParticipantRowDisconnected(row)) {
              return;
            }

            const currentOn = button.classList.contains("is-on");
            const shouldChange = willDisableAll ? currentOn : !currentOn;
            if (!shouldChange) {
              return;
            }

            const participantNumber = getParticipantNumberFromButton(button);
            if (!participantNumber) {
              return;
            }

            if (!targetByParticipant.has(participantNumber)) {
              targetByParticipant.set(participantNumber, []);
            }
            targetByParticipant.get(participantNumber).push(button);
          });

          return {
            mediaButtons: mediaButtons,
            targetByParticipant: targetByParticipant,
            participantNumbers: Array.from(targetByParticipant.keys()),
          };
        }

        function bindBulkMediaToggle(config) {
          const toggleButton = document.querySelector(config.buttonSelector);
          if (!toggleButton) return;
          if (toggleButton.dataset.bulkMediaBound === "1") return;

          toggleButton.dataset.bulkMediaBound = "1";
          toggleButton.addEventListener("click", async function () {
            if (toggleButton.dataset.busy === "1") {
              return;
            }

            const willDisableAll = !toggleButton.classList.contains("is-muted");
            const conferenceNumber = getActiveConferenceNumber();
            const targets = collectBulkMediaTargets(
              config.mediaType,
              willDisableAll,
            );

            if (!targets.mediaButtons.length) {
              return;
            }
            if (!targets.participantNumbers.length) {
              syncMuteAllButtonState();
              return;
            }

            toggleButton.dataset.busy = "1";
            toggleButton.disabled = true;

            try {
              const shouldEnable = !willDisableAll;
              let changedParticipants = new Set();

              try {
                await config.requestFn(
                  conferenceNumber,
                  targets.participantNumbers,
                  shouldEnable,
                );
                changedParticipants = new Set(targets.participantNumbers);
              } catch (_batchError) {
                const singleResults = await Promise.allSettled(
                  targets.participantNumbers.map(function (participantNumber) {
                    return config
                      .requestFn(
                        conferenceNumber,
                        [participantNumber],
                        shouldEnable,
                      )
                      .then(function () {
                        return participantNumber;
                      });
                  }),
                );

                singleResults.forEach(function (result) {
                  if (result.status === "fulfilled" && result.value) {
                    changedParticipants.add(result.value);
                  }
                });

                if (!changedParticipants.size) {
                  throw _batchError;
                }
              }

              changedParticipants.forEach(function (participantNumber) {
                const buttons =
                  targets.targetByParticipant.get(participantNumber) || [];
                buttons.forEach(function (button) {
                  setParticipantMediaState(button, shouldEnable);
                });
              });
              syncMuteAllButtonState();
            } catch (error) {
              window.alert(
                config.errorPrefix + extractRequestErrorMessage(error),
              );
            } finally {
              toggleButton.dataset.busy = "0";
              toggleButton.disabled = false;
            }
          });
        }

        function initMicToggle() {
          bindBulkMediaToggle({
            buttonSelector: ".panel-mic-btn.mic-all",
            mediaType: "mic",
            requestFn: requestMicStateChange,
            errorPrefix: "Cannot update participant microphone: ",
          });

          bindBulkMediaToggle({
            buttonSelector: ".panel-mic-btn.camera-all",
            mediaType: "camera",
            requestFn: requestCameraStateChange,
            errorPrefix: "Cannot update participant camera: ",
          });

          bindBulkMediaToggle({
            buttonSelector: ".panel-mic-btn.audio-all",
            mediaType: "audio",
            requestFn: requestAudioStateChange,
            errorPrefix: "Cannot update participant audio: ",
          });

          bindBulkMediaToggle({
            buttonSelector: ".panel-mic-btn.video-all",
            mediaType: "video",
            requestFn: requestVideoStateChange,
            errorPrefix: "Cannot update participant video: ",
          });

          syncMuteAllButtonState();
        }

        function initParticipantMediaToggles() {
          const tableBody = document.querySelector(
            ".active-conferences-scroll tbody",
          );
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

        document.addEventListener(
          "dashboard:participant-list-updated",
          function () {
            initKickMemberButtons();
            syncMuteAllButtonState();
          },
        );

  window.DashboardParticipantActions = {
    setParticipantMediaState: setParticipantMediaState,
    getVinteoApiClient: getVinteoApiClient,
    extractRequestErrorMessage: extractRequestErrorMessage,
    getActiveConferenceNumber: getActiveConferenceNumber,
    getParticipantNumberFromButton: getParticipantNumberFromButton,
    getParticipantNumberFromRow: getParticipantNumberFromRow,
    getParticipantDisplayNameFromRow: getParticipantDisplayNameFromRow,
    isParticipantRowDisconnected: isParticipantRowDisconnected,
    findRenderedParticipantRowByNumber: findRenderedParticipantRowByNumber,
    findRenderedMediaButton: findRenderedMediaButton,
    triggerKickWithConfirmation: triggerKickWithConfirmation,
    applyParticipantMediaChange: applyParticipantMediaChange,
    syncMuteAllButtonState: syncMuteAllButtonState,
    initMicToggle: initMicToggle,
    initParticipantMediaToggles: initParticipantMediaToggles,
    initKickMemberButtons: initKickMemberButtons,
  };
})();
