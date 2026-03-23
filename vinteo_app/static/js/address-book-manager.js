(function () {
  const ADDRESS_GROUP_LIMIT = 500;
  const ADDRESS_CONTACT_LIMIT = 500;

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

  function unwrapApiPayload(payload) {
    let current = payload;

    for (let depth = 0; depth < 4; depth += 1) {
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return current;
      }
      if (!Object.prototype.hasOwnProperty.call(current, "data")) {
        return current;
      }
      current = current.data;
    }

    return current;
  }

  function findDirectAddressChildren(groupElement) {
    if (!groupElement) return null;

    for (let i = 0; i < groupElement.children.length; i += 1) {
      const child = groupElement.children[i];
      if (child.classList && child.classList.contains("address-children")) {
        return child;
      }
    }

    const newChildren = document.createElement("div");
    newChildren.className = "address-children";
    groupElement.appendChild(newChildren);
    return newChildren;
  }

  function findDirectAddressList(groupElement) {
    if (!groupElement) return null;

    for (let i = 0; i < groupElement.children.length; i += 1) {
      const child = groupElement.children[i];
      if (child.classList && child.classList.contains("address-list")) {
        return child;
      }
    }

    const newList = document.createElement("ul");
    newList.className = "address-list";
    groupElement.appendChild(newList);
    return newList;
  }

  function createParticipantItem(name) {
    const item = document.createElement("li");
    item.className = "address-node participant";

    const fileIcon = document.createElement("span");
    fileIcon.className = "address-file";
    fileIcon.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "address-label";
    label.textContent = name;

    item.appendChild(fileIcon);
    item.appendChild(label);
    return item;
  }

  function createGroupItem(name, options) {
    const optionObject = options && typeof options === "object" ? options : {};
    const details = document.createElement("details");
    details.className = "address-group";
    details.open = true;

    const identity = String(optionObject.identity || "").trim();
    const sourceId = String(optionObject.sourceId || "").trim();
    const isSourceRoot = Boolean(optionObject.isSourceRoot);

    if (identity) {
      details.dataset.identity = identity;
    }
    if (sourceId) {
      details.dataset.sourceId = sourceId;
    }
    if (isSourceRoot) {
      details.dataset.sourceRoot = "1";
    }

    const summary = document.createElement("summary");
    summary.className = "address-node group";

    const caret = document.createElement("span");
    caret.className = "address-caret";
    caret.setAttribute("aria-hidden", "true");

    const folder = document.createElement("span");
    folder.className = "address-folder";
    folder.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    label.className = "address-label";
    label.textContent = name;

    summary.appendChild(caret);
    summary.appendChild(folder);
    summary.appendChild(label);

    const list = document.createElement("ul");
    list.className = "address-list";

    details.appendChild(summary);
    details.appendChild(list);
    return details;
  }

  function getGroupLabel(groupElement) {
    if (!groupElement) return "-";
    const label = groupElement.querySelector(":scope > summary .address-label");
    return label ? label.textContent.trim() : "-";
  }

  function normalizeSourceItems(payload) {
    const unwrapped = unwrapApiPayload(payload);
    const list = Array.isArray(unwrapped)
      ? unwrapped
      : unwrapped && Array.isArray(unwrapped.list)
        ? unwrapped.list
        : unwrapped && Array.isArray(unwrapped.sources)
          ? unwrapped.sources
          : [];

    return list
      .map(function (entry, index) {
        const sourceId = String(
          (entry && (entry.sourceId || entry.id || entry.source)) || "",
        ).trim();
        const name = String(
          (entry && (entry.name || entry.title || sourceId)) || "",
        ).trim();
        if (!sourceId && !name) {
          return null;
        }
        return {
          sourceId: sourceId || "source-" + index,
          name: name || sourceId || "Source " + (index + 1),
        };
      })
      .filter(Boolean);
  }

  function normalizeGroupItems(payload) {
    const unwrapped = unwrapApiPayload(payload);
    const list = Array.isArray(unwrapped)
      ? unwrapped
      : unwrapped && Array.isArray(unwrapped.list)
        ? unwrapped.list
        : unwrapped && Array.isArray(unwrapped.groups)
          ? unwrapped.groups
          : [];

    return list
      .map(function (entry) {
        const identity = String((entry && entry.identity) || "").trim();
        const name = String(
          (entry && (entry.name || entry.title || identity)) || "",
        ).trim();
        const source = String((entry && entry.source) || "").trim();
        if (!name) {
          return null;
        }
        return {
          identity: identity,
          name: name,
          source: source,
        };
      })
      .filter(Boolean);
  }

  function normalizeContactItems(payload) {
    const unwrapped = unwrapApiPayload(payload);
    const list = Array.isArray(unwrapped)
      ? unwrapped
      : unwrapped && Array.isArray(unwrapped.list)
        ? unwrapped.list
        : unwrapped && Array.isArray(unwrapped.contacts)
          ? unwrapped.contacts
          : [];

    return list
      .map(function (entry) {
        const identity = String((entry && entry.identity) || "").trim();
        const address = String((entry && entry.address) || "").trim();
        const name = String(
          (entry &&
            (entry.name ||
              (entry.account && entry.account.name) ||
              (entry.account && entry.account.number) ||
              address)) ||
            "",
        ).trim();
        if (!name) {
          return null;
        }
        return {
          identity: identity,
          name: name,
          address: address,
        };
      })
      .filter(Boolean);
  }

  function toSourceId(value) {
    return String(value || "").trim();
  }

  function createFallbackSource(sourceId, index) {
    const normalized = toSourceId(sourceId);
    return {
      sourceId: normalized || "source-fallback-" + index,
      name: normalized || "Address Book",
    };
  }

  function ensureSourceListFromGroups(existingSources, groups) {
    const sourceMap = new Map();
    const normalizedExisting = Array.isArray(existingSources)
      ? existingSources.filter(Boolean)
      : [];

    normalizedExisting.forEach(function (source, index) {
      const fallback = createFallbackSource(
        source && source.sourceId ? source.sourceId : "",
        index,
      );
      const sourceId = toSourceId(
        source && source.sourceId ? source.sourceId : fallback.sourceId,
      );
      const sourceName = String(
        (source && source.name) || fallback.name || sourceId,
      ).trim();
      sourceMap.set(sourceId, {
        sourceId: sourceId,
        name: sourceName || sourceId,
      });
    });

    (Array.isArray(groups) ? groups : []).forEach(function (group, index) {
      const sourceId = toSourceId(group && group.source);
      if (!sourceId || sourceMap.has(sourceId)) {
        return;
      }
      sourceMap.set(sourceId, createFallbackSource(sourceId, index));
    });

    if (!sourceMap.size) {
      sourceMap.set("default", createFallbackSource("default", 0));
    }

    return Array.from(sourceMap.values());
  }

  function attachGroupsToSources(groups, sources) {
    const sourceList = ensureSourceListFromGroups(sources, groups);
    const groupMap = new Map();

    sourceList.forEach(function (source) {
      groupMap.set(source.sourceId, []);
    });

    const firstSourceId = sourceList.length ? sourceList[0].sourceId : "default";
    (Array.isArray(groups) ? groups : []).forEach(function (group) {
      const declaredSourceId = toSourceId(group && group.source);
      const targetSourceId =
        declaredSourceId && groupMap.has(declaredSourceId)
          ? declaredSourceId
          : firstSourceId;
      const normalizedGroup = {
        identity: String((group && group.identity) || "").trim(),
        name: String((group && group.name) || "").trim(),
        source: targetSourceId,
      };
      const current = groupMap.get(targetSourceId) || [];
      current.push(normalizedGroup);
      groupMap.set(targetSourceId, current);
    });

    return {
      sources: sourceList,
      groupMap: groupMap,
    };
  }

  function randomHex(bytes) {
    const size = Number(bytes) > 0 ? Number(bytes) : 1;
    const parts = [];
    for (let i = 0; i < size; i += 1) {
      parts.push(Math.floor(Math.random() * 256));
    }
    return parts
      .map(function (value) {
        return value.toString(16).padStart(2, "0");
      })
      .join("");
  }

  function generateIdentity() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === "function"
    ) {
      return window.crypto.randomUUID();
    }

    // Fallback UUID v4 when randomUUID is unavailable.
    const p1 = randomHex(4);
    const p2 = randomHex(2);
    const p3 = "4" + randomHex(2).slice(1);
    const p4 = (8 + Math.floor(Math.random() * 4)).toString(16) + randomHex(2).slice(1);
    const p5 = randomHex(6);
    return p1 + "-" + p2 + "-" + p3 + "-" + p4 + "-" + p5;
  }

  function buildCreateGroupPayload(groupName) {
    const normalizedName = String(groupName || "").trim();
    return {
      identity: generateIdentity(),
      name: normalizedName,
      weight: 0,
    };
  }

  async function fetchAddressBookSources(apiClient) {
    try {
      const response = await apiClient.get("/api/v2/addressBook/sources");
      return normalizeSourceItems(response.data);
    } catch (error) {
      console.warn(
        "[AddressBook] Cannot load sources:",
        extractRequestErrorMessage(error),
      );
      return [];
    }
  }

  async function fetchAddressBookGroups(apiClient, sourceId) {
    const normalizedSource = String(sourceId || "").trim();
    const requestVariants = normalizedSource
      ? [
          {
            source: normalizedSource,
            search: "",
            limit: ADDRESS_GROUP_LIMIT,
            offset: 0,
          },
          {
            source: normalizedSource,
            limit: ADDRESS_GROUP_LIMIT,
            offset: 0,
          },
          {
            source: normalizedSource,
          },
        ]
      : [
          {
            search: "",
            limit: ADDRESS_GROUP_LIMIT,
            offset: 0,
          },
          {
            limit: ADDRESS_GROUP_LIMIT,
            offset: 0,
          },
          {},
        ];

    let lastError = null;
    for (let index = 0; index < requestVariants.length; index += 1) {
      const params = requestVariants[index];
      try {
        const response = await apiClient.get("/api/v2/addressBook/groups", {
          params: params,
        });
        const normalizedGroups = normalizeGroupItems(response.data);
        if (normalizedGroups.length || index === requestVariants.length - 1) {
          return normalizedGroups;
        }
      } catch (error) {
        lastError = error;
      }
    }

    if (lastError) {
      console.warn(
        "[AddressBook] Cannot load groups:",
        extractRequestErrorMessage(lastError),
      );
    }
    return [];
  }

  async function fetchAddressBookContacts(apiClient, sourceId, groupIdentity) {
    const normalizedSource = String(sourceId || "").trim();
    const normalizedGroup = String(groupIdentity || "").trim();
    if (!normalizedSource || !normalizedGroup) {
      return [];
    }

    const response = await apiClient.get("/api/v2/addressBook/contacts", {
      params: {
        source: normalizedSource,
        search: "",
        limit: ADDRESS_CONTACT_LIMIT,
        offset: 0,
        group: normalizedGroup,
        withoutGroup: false,
      },
    });

    return normalizeContactItems(response.data);
  }

  function buildTreeFromApi(tree, sources, groupMap, contactMap) {
    if (!tree) {
      return;
    }

    tree.innerHTML = "";

    sources.forEach(function (source) {
      const sourceNode = createGroupItem(source.name, {
        sourceId: source.sourceId,
        isSourceRoot: true,
      });
      const children = findDirectAddressChildren(sourceNode);
      const groups = groupMap.get(source.sourceId) || [];

      groups.forEach(function (group) {
        const groupNode = createGroupItem(group.name, {
          identity: group.identity,
          sourceId: source.sourceId,
        });
        const contactKey = source.sourceId + "::" + String(group.identity || "");
        const contacts = contactMap.get(contactKey) || [];
        if (contacts.length) {
          const list = findDirectAddressList(groupNode);
          contacts.forEach(function (contact) {
            list.appendChild(createParticipantItem(contact.name));
          });
        }
        children.appendChild(groupNode);
      });

      tree.appendChild(sourceNode);
    });
  }

  function renderAddressBookEmptyState(tree, message) {
    if (!tree) {
      return;
    }

    tree.innerHTML = "";
    const emptyNode = document.createElement("div");
    emptyNode.className = "address-empty-state";
    emptyNode.textContent = String(message || "No address book data from API.");
    tree.appendChild(emptyNode);
  }

  function resolveSourceId(groupElement) {
    let current = groupElement || null;
    while (current) {
      const sourceId = String(current.dataset.sourceId || "").trim();
      if (sourceId) {
        return sourceId;
      }
      const parentChildren = current.parentElement;
      const parentGroup = parentChildren
        ? parentChildren.closest("details.address-group")
        : null;
      current = parentGroup || null;
    }
    return "";
  }

  function initAddressBookManager() {
    const tree = document.querySelector(".address-tree");
    const addParticipantButton = document.querySelector(
      '[data-address-action="add-participant"]',
    );
    const addGroupButton = document.querySelector(
      '[data-address-action="add-group"]',
    );
    const participantModal = document.getElementById("address-participant-modal");
    const participantForm = document.getElementById("address-participant-form");
    const targetGroupName = document.getElementById("address-modal-group-name");
    const participantNameInput = document.getElementById("ab-participant-name");
    const participantCancelButton = participantModal
      ? participantModal.querySelector("[data-address-cancel]")
      : null;
    const groupModal = document.getElementById("address-group-modal");
    const groupForm = document.getElementById("address-group-form");
    const groupNameInput = document.getElementById("ab-group-name");
    const groupParentName = document.getElementById("address-group-parent-name");
    const groupCancelButton = groupModal
      ? groupModal.querySelector("[data-address-group-cancel]")
      : null;

    if (!tree) {
      return;
    }

    let selectedGroup = null;

    function setSelectedGroup(groupElement) {
      if (!groupElement) return;

      const groups = Array.from(tree.querySelectorAll("details.address-group"));
      groups.forEach(function (group) {
        group.classList.toggle("is-selected", group === groupElement);
      });

      selectedGroup = groupElement;
    }

    function ensureSelectedGroup() {
      if (selectedGroup && tree.contains(selectedGroup)) {
        return selectedGroup;
      }

      const groups = Array.from(tree.querySelectorAll("details.address-group"));
      if (!groups.length) {
        selectedGroup = null;
        return null;
      }

      setSelectedGroup(groups[0]);
      return selectedGroup;
    }

    function closeParticipantModal() {
      if (!participantModal) return;
      participantModal.classList.remove("is-open");
      participantModal.setAttribute("hidden", "");
    }

    function openParticipantModal() {
      if (
        !participantModal ||
        !participantForm ||
        !participantNameInput ||
        !targetGroupName
      ) {
        return false;
      }
      if (!ensureSelectedGroup()) return false;

      participantForm.reset();
      targetGroupName.textContent = getGroupLabel(selectedGroup);
      participantModal.removeAttribute("hidden");
      participantModal.classList.add("is-open");
      window.setTimeout(function () {
        participantNameInput.focus();
      }, 0);
      return true;
    }

    function closeGroupModal() {
      if (!groupModal) return;
      groupModal.classList.remove("is-open");
      groupModal.setAttribute("hidden", "");
    }

    function openGroupModal() {
      if (!groupModal || !groupForm || !groupNameInput || !groupParentName) {
        return false;
      }
      if (!ensureSelectedGroup()) return false;

      groupForm.reset();
      groupParentName.textContent = getGroupLabel(selectedGroup);
      groupModal.removeAttribute("hidden");
      groupModal.classList.add("is-open");
      window.setTimeout(function () {
        groupNameInput.focus();
      }, 0);
      return true;
    }

    async function loadAddressBookFromApi() {
      const apiClient = getVinteoApiClient();
      if (!apiClient) {
        selectedGroup = null;
        renderAddressBookEmptyState(tree, "Address book API is unavailable.");
        return;
      }

      let sources = await fetchAddressBookSources(apiClient);
      let groupMap = new Map();
      const contactMap = new Map();

      if (sources.length) {
        await Promise.all(
          sources.map(async function (source) {
            const sourceId = toSourceId(source && source.sourceId);
            if (!sourceId) {
              return;
            }
            const groups = await fetchAddressBookGroups(apiClient, sourceId);
            groupMap.set(sourceId, groups);
          }),
        );
      }

      const hasGroupsFromScopedRequests = Array.from(groupMap.values()).some(
        function (groups) {
          return Array.isArray(groups) && groups.length > 0;
        },
      );

      if (!hasGroupsFromScopedRequests) {
        const unscopedGroups = await fetchAddressBookGroups(apiClient, "");
        if (!unscopedGroups.length) {
          selectedGroup = null;
          renderAddressBookEmptyState(tree, "No address book data from API.");
          return;
        }
        const attached = attachGroupsToSources(unscopedGroups, sources);
        sources = attached.sources;
        groupMap = attached.groupMap;
      } else {
        sources = ensureSourceListFromGroups(
          sources,
          Array.from(groupMap.values()).flat(),
        );
      }

      await Promise.all(
        sources.map(async function (source) {
          const sourceId = toSourceId(source && source.sourceId);
          if (!sourceId) {
            return;
          }
          const groups = groupMap.get(sourceId) || [];
          await Promise.all(
            groups.map(async function (group) {
              const groupIdentity = String(group && group.identity ? group.identity : "").trim();
              if (!groupIdentity) {
                return;
              }
              const contactKey = sourceId + "::" + groupIdentity;
              try {
                const contacts = await fetchAddressBookContacts(
                  apiClient,
                  sourceId,
                  groupIdentity,
                );
                contactMap.set(contactKey, contacts);
              } catch (_error) {
                contactMap.set(contactKey, []);
              }
            }),
          );
        }),
      );

      buildTreeFromApi(tree, sources, groupMap, contactMap);
      if (!ensureSelectedGroup()) {
        selectedGroup = null;
        renderAddressBookEmptyState(tree, "No address book data from API.");
      }
    }

    tree.addEventListener("click", function (event) {
      const summary = event.target.closest("summary.address-node.group");
      if (!summary || !tree.contains(summary)) return;

      const groupElement = summary.closest("details.address-group");
      if (!groupElement) return;
      setSelectedGroup(groupElement);
    });

    void loadAddressBookFromApi().catch(function (_error) {
      selectedGroup = null;
      renderAddressBookEmptyState(tree, "Cannot load address book from API.");
    });

    if (
      addParticipantButton &&
      participantModal &&
      participantForm &&
      targetGroupName &&
      participantNameInput
    ) {
      addParticipantButton.addEventListener("click", function () {
        openParticipantModal();
      });

      participantModal.addEventListener("click", function (event) {
        if (!event.target.matches("[data-address-modal-close]")) return;
        closeParticipantModal();
      });

      if (participantCancelButton) {
        participantCancelButton.addEventListener("click", function () {
          closeParticipantModal();
        });
      }

      document.addEventListener("keydown", function (event) {
        if (!participantModal.classList.contains("is-open")) return;
        if (event.key === "Escape") {
          closeParticipantModal();
        }
      });

      participantForm.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!ensureSelectedGroup()) return;

        const participantName = participantNameInput.value.trim();
        if (!participantName) {
          participantNameInput.focus();
          return;
        }

        selectedGroup.open = true;
        const list = findDirectAddressList(selectedGroup);
        const participantItem = createParticipantItem(participantName);
        list.appendChild(participantItem);
        participantItem.scrollIntoView({ block: "nearest" });
        closeParticipantModal();
      });
    }

    if (
      !addGroupButton ||
      !groupModal ||
      !groupForm ||
      !groupNameInput ||
      !groupParentName
    ) {
      return;
    }

    addGroupButton.addEventListener("click", function () {
      openGroupModal();
    });

    groupModal.addEventListener("click", function (event) {
      if (!event.target.matches("[data-address-group-modal-close]")) return;
      closeGroupModal();
    });

    if (groupCancelButton) {
      groupCancelButton.addEventListener("click", function () {
        closeGroupModal();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!groupModal.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        closeGroupModal();
      }
    });

    groupForm.addEventListener("submit", async function (event) {
      event.preventDefault();
      if (!ensureSelectedGroup()) return;
      if (groupForm.dataset.busy === "1") {
        return;
      }

      const groupName = groupNameInput.value.trim();
      if (!groupName) {
        groupNameInput.focus();
        return;
      }

      groupForm.dataset.busy = "1";
      groupNameInput.disabled = true;

      try {
        const apiClient = getVinteoApiClient();
        let createdGroup = null;

        if (apiClient) {
          const response = await apiClient.post(
            "/api/v2/addressBook/groups",
            buildCreateGroupPayload(groupName),
          );
          const groups = normalizeGroupItems(response.data);
          createdGroup = groups.length ? groups[0] : null;
          const unwrappedCreated = unwrapApiPayload(response.data);
          if (
            !createdGroup &&
            unwrappedCreated &&
            typeof unwrappedCreated === "object"
          ) {
            createdGroup = {
              identity: String(unwrappedCreated.identity || "").trim(),
              name:
                String(unwrappedCreated.name || groupName).trim() || groupName,
              source: String(unwrappedCreated.source || "").trim(),
            };
          }
        }

        selectedGroup.open = true;
        const children = findDirectAddressChildren(selectedGroup);
        const sourceId =
          (createdGroup && createdGroup.source) || resolveSourceId(selectedGroup);
        const groupItem = createGroupItem(
          (createdGroup && createdGroup.name) || groupName,
          {
            identity: createdGroup ? createdGroup.identity : "",
            sourceId: sourceId,
          },
        );
        children.appendChild(groupItem);
        setSelectedGroup(groupItem);
        groupItem.scrollIntoView({ block: "nearest" });
        closeGroupModal();
      } catch (error) {
        window.alert("Cannot create address group: " + extractRequestErrorMessage(error));
      } finally {
        groupForm.dataset.busy = "0";
        groupNameInput.disabled = false;
      }
    });
  }

  window.DashboardAddressBookManager = {
    initAddressBookManager: initAddressBookManager,
  };
})();
