(function () {
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

  function createGroupItem(name) {
    const details = document.createElement("details");
    details.className = "address-group";
    details.open = true;

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

  function initAddressBookManager() {
    const tree = document.querySelector(".address-tree");
    const addParticipantButton = document.querySelector(
      '[data-address-action="add-participant"]',
    );
    const addGroupButton = document.querySelector(
      '[data-address-action="add-group"]',
    );
    const modal = document.getElementById("address-participant-modal");
    const form = document.getElementById("address-participant-form");
    const targetGroupName = document.getElementById("address-modal-group-name");
    const nameInput = document.getElementById("ab-participant-name");
    const cancelButton = modal
      ? modal.querySelector("[data-address-cancel]")
      : null;
    const groupModal = document.getElementById("address-group-modal");
    const groupForm = document.getElementById("address-group-form");
    const groupNameInput = document.getElementById("ab-group-name");
    const groupParentName = document.getElementById("address-group-parent-name");
    const groupCancelButton = groupModal
      ? groupModal.querySelector("[data-address-group-cancel]")
      : null;

    if (!tree) return;

    let selectedGroup = null;

    function setSelectedGroup(groupElement) {
      if (!groupElement) return;

      const groups = Array.from(tree.querySelectorAll("details.address-group"));
      groups.forEach(function (group) {
        group.classList.toggle("is-selected", group === groupElement);
      });

      selectedGroup = groupElement;
    }

    function getGroupLabel(groupElement) {
      if (!groupElement) return "-";
      const label = groupElement.querySelector(":scope > summary .address-label");
      return label ? label.textContent.trim() : "-";
    }

    function closeParticipantModal() {
      if (!modal) return;
      modal.classList.remove("is-open");
      modal.setAttribute("hidden", "");
    }

    function openParticipantModal() {
      if (!modal || !form || !nameInput) return false;
      const groups = Array.from(tree.querySelectorAll("details.address-group"));
      if (!selectedGroup && groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
      if (!selectedGroup) return false;

      form.reset();
      targetGroupName.textContent = getGroupLabel(selectedGroup);
      modal.removeAttribute("hidden");
      modal.classList.add("is-open");
      window.setTimeout(function () {
        nameInput.focus();
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
      const groups = Array.from(tree.querySelectorAll("details.address-group"));
      if (!selectedGroup && groups.length > 0) {
        setSelectedGroup(groups[0]);
      }
      if (!selectedGroup) return false;

      groupForm.reset();
      groupParentName.textContent = getGroupLabel(selectedGroup);
      groupModal.removeAttribute("hidden");
      groupModal.classList.add("is-open");
      window.setTimeout(function () {
        groupNameInput.focus();
      }, 0);
      return true;
    }

    tree.addEventListener("click", function (event) {
      const summary = event.target.closest("summary.address-node.group");
      if (!summary || !tree.contains(summary)) return;

      const groupElement = summary.closest("details.address-group");
      if (!groupElement) return;
      setSelectedGroup(groupElement);
    });

    const groups = Array.from(tree.querySelectorAll("details.address-group"));
    if (groups.length > 0) {
      setSelectedGroup(groups[0]);
    }

    if (!addParticipantButton || !modal || !form || !targetGroupName || !nameInput) {
      return;
    }

    addParticipantButton.addEventListener("click", function () {
      openParticipantModal();
    });

    modal.addEventListener("click", function (event) {
      if (!event.target.matches("[data-address-modal-close]")) return;
      closeParticipantModal();
    });

    if (cancelButton) {
      cancelButton.addEventListener("click", function () {
        closeParticipantModal();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (!modal.classList.contains("is-open")) return;
      if (event.key === "Escape") {
        closeParticipantModal();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!selectedGroup) return;

      const participantName = nameInput.value.trim();
      if (!participantName) {
        nameInput.focus();
        return;
      }

      selectedGroup.open = true;
      const list = findDirectAddressList(selectedGroup);
      const participantItem = createParticipantItem(participantName);
      list.appendChild(participantItem);
      participantItem.scrollIntoView({ block: "nearest" });
      closeParticipantModal();
    });

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

    groupForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!selectedGroup) return;

      const groupName = groupNameInput.value.trim();
      if (!groupName) {
        groupNameInput.focus();
        return;
      }

      selectedGroup.open = true;
      const children = findDirectAddressChildren(selectedGroup);
      const groupItem = createGroupItem(groupName);
      children.appendChild(groupItem);
      setSelectedGroup(groupItem);
      groupItem.scrollIntoView({ block: "nearest" });
      closeGroupModal();
    });
  }

  window.DashboardAddressBookManager = {
    initAddressBookManager: initAddressBookManager,
  };
})();
