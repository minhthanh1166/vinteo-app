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
        let disconnectedActionMenu = null;
        let disconnectedActionMenuRow = null;

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

        const FAST_CALL_FALLBACK_OPTIONS = {
          resolution: [
            { value: "UHD", label: "UltraHD (4K) 3840x2160" },
            { value: "FULLHD", label: "FullHD 1920x1080" },
            { value: "720p", label: "HD 1280x720" },
            { value: "4CIF", label: "4CIF 704x576" },
            { value: "VGA", label: "VGA 640x480" },
            { value: "CIF", label: "CIF 352x288" },
          ],
          speed: [
            { value: "512", label: "512 Kb/s" },
            { value: "768", label: "768 Kb/s" },
            { value: "1024", label: "1 Mb/s" },
            { value: "1536", label: "1.5 Mb/s" },
            { value: "2048", label: "2 Mb/s" },
            { value: "3072", label: "3 Mb/s" },
            { value: "4096", label: "4 Mb/s" },
          ],
          fps: [
            { value: "15", label: "15" },
            { value: "25", label: "25" },
            { value: "30", label: "30" },
            { value: "60", label: "60" },
          ],
        };

        function getFastCallDefaults(button) {
          const source = button || {};
          const speedValue = Number(
            source.dataset && source.dataset.callSpeed
              ? source.dataset.callSpeed
              : 1536,
          );
          const fpsValue = Number(
            source.dataset && source.dataset.callFps ? source.dataset.callFps : 25,
          );

          return {
            type: String(
              source.dataset && source.dataset.callType
                ? source.dataset.callType
                : "SIP",
            )
              .trim()
              .toUpperCase(),
            resolution: String(
              source.dataset && source.dataset.callResolution
                ? source.dataset.callResolution
                : "720p",
            ).trim(),
            speed: Number.isFinite(speedValue) && speedValue > 0 ? speedValue : 1536,
            fps: Number.isFinite(fpsValue) && fpsValue > 0 ? fpsValue : 25,
          };
        }

        function buildFastCallOptionsFromSelect(selectElement, fallbackOptions) {
          if (
            selectElement &&
            selectElement.options &&
            selectElement.options.length > 0
          ) {
            return Array.from(selectElement.options)
              .map(function (option) {
                const value = String(option.value || "").trim();
                if (!value) {
                  return null;
                }
                return {
                  value: value,
                  label: String(option.textContent || value).trim(),
                };
              })
              .filter(Boolean);
          }

          return (Array.isArray(fallbackOptions) ? fallbackOptions : []).map(
            function (option) {
              return {
                value: String(option.value || "").trim(),
                label: String(option.label || option.value || "").trim(),
              };
            },
          );
        }

        function applyFastCallOptions(selectElement, options, preferredValue) {
          if (!selectElement) {
            return "";
          }

          const normalizedOptions = (Array.isArray(options) ? options : []).filter(
            function (option) {
              return (
                option &&
                typeof option.value === "string" &&
                option.value.trim().length > 0
              );
            },
          );
          selectElement.innerHTML = "";

          normalizedOptions.forEach(function (option) {
            const optionNode = document.createElement("option");
            optionNode.value = option.value;
            optionNode.textContent = option.label || option.value;
            selectElement.appendChild(optionNode);
          });

          const normalizedPreferred = String(preferredValue || "").trim();
          const hasPreferred = normalizedOptions.some(function (option) {
            return option.value === normalizedPreferred;
          });
          if (hasPreferred) {
            selectElement.value = normalizedPreferred;
            return normalizedPreferred;
          }

          const firstOption = normalizedOptions[0];
          if (firstOption) {
            selectElement.value = firstOption.value;
            return firstOption.value;
          }

          return "";
        }

        function openFastCallModal(modalElement) {
          if (!modalElement) {
            return;
          }
          modalElement.removeAttribute("hidden");
          modalElement.classList.add("is-open");
        }

        function closeFastCallModal(modalElement) {
          if (!modalElement) {
            return;
          }
          modalElement.classList.remove("is-open");
          modalElement.setAttribute("hidden", "");
        }

        function dispatchParticipantListRefresh() {
          document.dispatchEvent(
            new CustomEvent("dashboard:conference-list-refreshed"),
          );
          window.setTimeout(function () {
            document.dispatchEvent(
              new CustomEvent("dashboard:conference-list-refreshed"),
            );
          }, 1200);
        }

        async function requestFastCall(conferenceNumber, numberValue, options) {
          const apiClient = getVinteoApiClient();
          if (!apiClient) {
            throw new Error("API client is not ready.");
          }

          const normalizedConference = String(conferenceNumber || "").trim();
          const normalizedNumber = String(numberValue || "").trim();
          const optionObject =
            options && typeof options === "object" ? options : {};
          const typeValue = String(optionObject.type || "SIP")
            .trim()
            .toUpperCase();
          const resolutionValue = String(optionObject.resolution || "720p").trim();
          const speedValue = Number(optionObject.speed);
          const fpsValue = Number(optionObject.fps);

          if (!normalizedConference) {
            throw new Error("Conference is not selected.");
          }
          if (!normalizedNumber) {
            throw new Error("Participant IP/URI is required.");
          }

          const payload = {
            conference: normalizedConference,
            number: normalizedNumber,
            type: typeValue || "SIP",
            resolution: resolutionValue || "720p",
            speed: Number.isFinite(speedValue) && speedValue > 0 ? speedValue : 1536,
            fps: Number.isFinite(fpsValue) && fpsValue > 0 ? fpsValue : 25,
          };

          const response = await apiClient.post("/api/v1/fast_call", payload);
          return response && response.data ? response.data : null;
        }

        function initFastCallButton() {
          const callButton = document.getElementById("participant-fast-call-btn");
          const modal = document.getElementById("participant-fast-call-modal");
          const form = document.getElementById("participant-fast-call-form");
          if (!callButton || !modal || !form) {
            return;
          }
          if (callButton.dataset.bound === "1") {
            return;
          }

          const conferenceSettingForm = document.getElementById(
            "conference-setting-form",
          );
          const typeSelect = form.elements.type;
          const numberInput = form.elements.number;
          const resolutionSelect = form.elements.resolution;
          const speedSelect = form.elements.speed;
          const fpsSelect = form.elements.fps;
          const submitButton = form.querySelector(".participant-fast-call-submit");
          const closeTargets = modal.querySelectorAll("[data-fast-call-close]");
          const defaultTitle = callButton.title;

          if (
            !typeSelect ||
            !numberInput ||
            !resolutionSelect ||
            !speedSelect ||
            !fpsSelect ||
            !submitButton
          ) {
            return;
          }

          function syncFastCallSelectOptions(defaults) {
            const resolutionSource = conferenceSettingForm
              ? conferenceSettingForm.elements.anonymousResolution
              : null;
            const speedSource = conferenceSettingForm
              ? conferenceSettingForm.elements.anonymousBandwidth
              : null;
            const fpsSource = conferenceSettingForm
              ? conferenceSettingForm.elements.anonymousFPS
              : null;
            const resolutionOptions = buildFastCallOptionsFromSelect(
              resolutionSource,
              FAST_CALL_FALLBACK_OPTIONS.resolution,
            );
            const speedOptions = buildFastCallOptionsFromSelect(
              speedSource,
              FAST_CALL_FALLBACK_OPTIONS.speed,
            );
            const fpsOptions = buildFastCallOptionsFromSelect(
              fpsSource,
              FAST_CALL_FALLBACK_OPTIONS.fps,
            );

            applyFastCallOptions(
              resolutionSelect,
              resolutionOptions,
              resolutionSource
                ? resolutionSource.value
                : String(defaults.resolution || "720p"),
            );
            applyFastCallOptions(
              speedSelect,
              speedOptions,
              speedSource ? speedSource.value : String(defaults.speed || "1536"),
            );
            applyFastCallOptions(
              fpsSelect,
              fpsOptions,
              fpsSource ? fpsSource.value : String(defaults.fps || "25"),
            );
          }

          function openModalForConference(conferenceNumber) {
            const defaults = getFastCallDefaults(callButton);
            form.dataset.conference = String(conferenceNumber || "").trim();
            typeSelect.value = defaults.type || "SIP";
            syncFastCallSelectOptions(defaults);
            numberInput.value = "";
            openFastCallModal(modal);
            window.setTimeout(function () {
              numberInput.focus();
            }, 0);
          }

          function isModalOpen() {
            return modal.classList.contains("is-open");
          }

          function closeModalIfIdle() {
            if (form.dataset.busy === "1") {
              return;
            }
            closeFastCallModal(modal);
          }

          callButton.dataset.bound = "1";
          callButton.addEventListener("click", function () {
            if (callButton.dataset.busy === "1") {
              return;
            }

            const conferenceNumber = getActiveConferenceNumber();
            if (!conferenceNumber) {
              window.alert("Please select a conference first.");
              return;
            }
            openModalForConference(conferenceNumber);
          });

          closeTargets.forEach(function (target) {
            target.addEventListener("click", function () {
              closeModalIfIdle();
            });
          });

          document.addEventListener("keydown", function (event) {
            if (!isModalOpen() || event.key !== "Escape") {
              return;
            }
            closeModalIfIdle();
          });

          form.addEventListener("submit", async function (event) {
            event.preventDefault();
            if (form.dataset.busy === "1") {
              return;
            }

            const conferenceNumber = String(
              form.dataset.conference || getActiveConferenceNumber(),
            ).trim();
            const numberValue = String(numberInput.value || "").trim();
            const typeValue = String(typeSelect.value || "SIP")
              .trim()
              .toUpperCase();
            const resolutionValue = String(resolutionSelect.value || "720p").trim();
            const speedValue = Number(speedSelect.value);
            const fpsValue = Number(fpsSelect.value);

            if (!conferenceNumber) {
              window.alert("Please select a conference first.");
              return;
            }
            if (!numberValue) {
              window.alert("Participant IP/URI cannot be empty.");
              numberInput.focus();
              return;
            }

            form.dataset.busy = "1";
            submitButton.disabled = true;
            callButton.dataset.busy = "1";
            callButton.disabled = true;
            callButton.title = "Calling...";

            try {
              await requestFastCall(conferenceNumber, numberValue, {
                type: typeValue,
                resolution: resolutionValue,
                speed: speedValue,
                fps: fpsValue,
              });
              closeFastCallModal(modal);
              dispatchParticipantListRefresh();
            } catch (error) {
              window.alert(
                "Cannot call participant: " + extractRequestErrorMessage(error),
              );
            } finally {
              form.dataset.busy = "0";
              submitButton.disabled = false;
              callButton.dataset.busy = "0";
              callButton.disabled = false;
              callButton.title = defaultTitle;
            }
          });
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

          const conferencePath = encodeURIComponent(normalizedConference);
          const participantPath = encodeURIComponent(normalizedParticipant);

          try {
            await apiClient.delete(
              "/api/v1/participant/" +
                conferencePath +
                "/" +
                participantPath,
            );
            return;
          } catch (deleteError) {
            try {
              await apiClient.post("/api/v1/disconnect", {
                conference: normalizedConference,
                participants: [normalizedParticipant],
              });
            } catch (_disconnectError) {
              throw deleteError;
            }
          }
        }

        async function requestCallParticipant(
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

          await apiClient.post("/api/v1/call", {
            conference: normalizedConference,
            participants: [normalizedParticipant],
          });
        }

        function extractDialTargetFromIdentifier(participantIdentifier) {
          const rawIdentifier = String(participantIdentifier || "").trim();
          if (!rawIdentifier) {
            return { type: "SIP", number: "" };
          }

          let typeValue = "SIP";
          let numberValue = rawIdentifier;

          const prefixed = rawIdentifier.match(/^([a-z0-9_.-]+)[/:|](.+)$/i);
          if (prefixed && prefixed[2]) {
            const normalizedType = String(prefixed[1] || "")
              .trim()
              .toUpperCase();
            if (normalizedType.includes("323")) {
              typeValue = "H323";
            } else if (normalizedType.includes("SIP")) {
              typeValue = "SIP";
            }
            numberValue = String(prefixed[2] || "").trim();
          }

          const ipMatch = numberValue.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
          if (ipMatch && ipMatch[0]) {
            return {
              type: typeValue,
              number: ipMatch[0],
            };
          }

          const cleanedNumber = numberValue
            .replace(/^sip:/i, "")
            .replace(/^h\.?323:/i, "")
            .replace(/-\d+$/, "")
            .trim();

          return {
            type: typeValue,
            number: cleanedNumber,
          };
        }

        async function requestCallParticipantFallback(
          conferenceNumber,
          participantIdentifier,
        ) {
          const dialTarget = extractDialTargetFromIdentifier(participantIdentifier);
          if (!dialTarget.number) {
            throw new Error("Participant number is invalid.");
          }

          await requestFastCall(conferenceNumber, dialTarget.number, {
            type: dialTarget.type || "SIP",
            resolution: "720p",
            speed: 1536,
            fps: 25,
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
              "Cannot disconnect participant: " +
                extractRequestErrorMessage(error),
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
            "Are you sure you want to disconnect " +
            memberName +
            " from this meeting?";

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

        function triggerDeleteWithConfirmation(row) {
          if (!row || row.classList.contains("participant-empty-row")) {
            return;
          }

          const participantNumber = getParticipantNumberFromRow(row);
          const currentRow =
            findRenderedParticipantRowByNumber(participantNumber) || row;
          const memberName =
            getParticipantDisplayNameFromRow(currentRow) || "participant";
          const accepted = window.confirm(
            "Are you sure you want to delete " +
              memberName +
              " from this meeting?",
          );
          if (accepted) {
            void executeKickParticipantRow(currentRow);
          }
        }

        async function callDisconnectedParticipantRow(row) {
          if (!row || row.classList.contains("participant-empty-row")) {
            return false;
          }

          const participantNumber = getParticipantNumberFromRow(row);
          const currentRow =
            findRenderedParticipantRowByNumber(participantNumber) || row;
          if (!currentRow) {
            return false;
          }
          if (currentRow.dataset.callBusy === "1") {
            return false;
          }

          const conferenceNumber = getActiveConferenceNumber();
          const participantIdentifiers = collectParticipantIdentifiers(currentRow);
          if (!conferenceNumber) {
            window.alert("Conference is not selected.");
            return false;
          }
          if (!participantIdentifiers.length) {
            window.alert("Participant is not selected.");
            return false;
          }

          currentRow.dataset.callBusy = "1";

          try {
            let callError = null;
            let called = false;

            for (
              let index = 0;
              index < participantIdentifiers.length;
              index += 1
            ) {
              const candidate = participantIdentifiers[index];
              try {
                await requestCallParticipant(conferenceNumber, candidate);
                called = true;
                break;
              } catch (error) {
                callError = error;
              }
            }

            if (!called) {
              await requestCallParticipantFallback(
                conferenceNumber,
                participantIdentifiers[0],
              );
            }

            dispatchParticipantListRefresh();
            return true;
          } catch (error) {
            window.alert(
              "Cannot call participant: " +
                extractRequestErrorMessage(error),
            );
            return false;
          } finally {
            currentRow.dataset.callBusy = "0";
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

        function createKickButton(memberName, row) {
          const isDisconnected = isParticipantRowDisconnected(row);
          const button = document.createElement("button");
          button.type = "button";
          button.className = "kick-btn" + (isDisconnected ? " is-overflow" : "");
          button.dataset.memberName = memberName;
          button.dataset.actionMode = isDisconnected ? "menu" : "disconnect";

          if (isDisconnected) {
            button.title = "Actions for " + memberName;
            button.setAttribute("aria-label", "Actions for " + memberName);
            button.innerHTML =
              '<svg viewBox="0 0 24 24" aria-hidden="true">' +
              '<path d="M12 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm0 5a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>' +
              "</svg>";
            return button;
          }

          button.title = "Disconnect " + memberName;
          button.setAttribute("aria-label", "Disconnect " + memberName);
          button.innerHTML =
            '<svg viewBox="0 0 24 24" aria-hidden="true">' +
            '<path d="M10 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 10c-3.87 0-7 2.01-7 4.5V20h10.48a5.43 5.43 0 0 1-.48-2.25c0-1.42.55-2.7 1.45-3.66A13.8 13.8 0 0 0 10 14z"/>' +
            '<path d="M15.71 14.29a1 1 0 0 0-1.42 1.42L15.59 17l-1.3 1.29a1 1 0 1 0 1.42 1.42L17 18.41l1.29 1.3a1 1 0 0 0 1.42-1.42L18.41 17l1.3-1.29a1 1 0 0 0-1.42-1.42L17 15.59l-1.29-1.3z"/>' +
            "</svg>";
          return button;
        }

        function closeDisconnectedActionMenu() {
          if (!disconnectedActionMenu) {
            return;
          }
          disconnectedActionMenu.hidden = true;
          disconnectedActionMenuRow = null;
        }

        function ensureDisconnectedActionMenu() {
          if (disconnectedActionMenu) {
            return disconnectedActionMenu;
          }

          const menu = document.createElement("div");
          menu.className = "participant-context-menu participant-row-action-menu";
          menu.hidden = true;
          menu.innerHTML =
            '<button type="button" class="participant-context-menu__item" data-menu-action="call">Call</button>' +
            '<button type="button" class="participant-context-menu__item is-danger" data-menu-action="delete">Delete</button>';
          document.body.appendChild(menu);

          menu.addEventListener("click", function (event) {
            const menuItem = event.target.closest("[data-menu-action]");
            if (!menuItem) {
              return;
            }
            const menuAction = String(menuItem.dataset.menuAction || "").trim();
            const targetRow = disconnectedActionMenuRow;
            closeDisconnectedActionMenu();

            if (!targetRow) {
              return;
            }

            if (menuAction === "call") {
              void callDisconnectedParticipantRow(targetRow);
              return;
            }

            if (menuAction === "delete") {
              triggerDeleteWithConfirmation(targetRow);
            }
          });

          document.addEventListener("click", function (event) {
            if (!menu.hidden && !menu.contains(event.target)) {
              closeDisconnectedActionMenu();
            }
          });

          document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
              closeDisconnectedActionMenu();
            }
          });

          window.addEventListener("resize", closeDisconnectedActionMenu);
          window.addEventListener(
            "scroll",
            function () {
              if (!menu.hidden) {
                closeDisconnectedActionMenu();
              }
            },
            true,
          );

          disconnectedActionMenu = menu;
          return disconnectedActionMenu;
        }

        function openDisconnectedActionMenu(triggerButton, row) {
          const menu = ensureDisconnectedActionMenu();
          if (!menu || !triggerButton || !row) {
            return;
          }

          const participantNumber = getParticipantNumberFromRow(row);
          disconnectedActionMenuRow =
            findRenderedParticipantRowByNumber(participantNumber) || row;

          menu.hidden = false;
          menu.style.left = "0px";
          menu.style.top = "0px";

          const triggerRect = triggerButton.getBoundingClientRect();
          const menuWidth = menu.offsetWidth || 120;
          const menuHeight = menu.offsetHeight || 74;

          const maxLeft = Math.max(window.innerWidth - menuWidth - 8, 8);
          const maxTop = Math.max(window.innerHeight - menuHeight - 8, 8);

          const menuLeft = Math.max(
            8,
            Math.min(triggerRect.right - menuWidth, maxLeft),
          );
          const menuTop = Math.max(8, Math.min(triggerRect.bottom + 4, maxTop));

          menu.style.left = menuLeft + "px";
          menu.style.top = menuTop + "px";
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

            const existingActionCell = row.querySelector("td.kick-col");
            if (existingActionCell) {
              existingActionCell.remove();
            }

            const nameCell = row.children[1];
            const memberName = nameCell
              ? nameCell.textContent.trim()
              : "participant";

            const actionCell = document.createElement("td");
            actionCell.className = "kick-col";

            const actionWrap = document.createElement("div");
            actionWrap.className = "kick-cell";
            actionWrap.appendChild(createKickButton(memberName, row));

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
            const actionMode = String(kickButton.dataset.actionMode || "disconnect")
              .trim()
              .toLowerCase();

            if (actionMode === "menu") {
              event.preventDefault();
              event.stopPropagation();
              openDisconnectedActionMenu(kickButton, targetRow);
              return;
            }

            closeDisconnectedActionMenu();
            triggerKickWithConfirmation(targetRow);
          });
        }

        document.addEventListener(
          "dashboard:participant-list-updated",
          function () {
            closeDisconnectedActionMenu();
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
    initFastCallButton: initFastCallButton,
  };
})();
