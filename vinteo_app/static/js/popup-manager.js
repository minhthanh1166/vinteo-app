(function () {
  function createConfirmPopup(config) {
    const modal = document.getElementById(config.modalId);
    if (!modal) return null;

    const messageElement = config.messageSelector
      ? modal.querySelector(config.messageSelector)
      : null;
    const confirmButton = modal.querySelector(config.confirmSelector);
    const cancelButton = modal.querySelector(config.cancelSelector);
    const closeSelector = config.closeSelector;
    let pendingAction = null;

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("hidden", "");
      pendingAction = null;
    }

    function open(options) {
      if (!confirmButton) return false;

      pendingAction =
        options && typeof options.onConfirm === "function"
          ? options.onConfirm
          : null;

      if (
        messageElement &&
        options &&
        typeof options.message === "string" &&
        options.message.length > 0
      ) {
        messageElement.textContent = options.message;
      }

      modal.removeAttribute("hidden");
      modal.classList.add("is-open");
      confirmButton.focus();
      return true;
    }

    if (modal.dataset.popupBound !== "1") {
      modal.dataset.popupBound = "1";

      modal.addEventListener("click", function (event) {
        if (!event.target.matches(closeSelector)) return;
        close();
      });

      if (cancelButton) {
        cancelButton.addEventListener("click", function () {
          close();
        });
      }

      if (confirmButton) {
        confirmButton.addEventListener("click", function () {
          if (pendingAction) {
            pendingAction();
          }
          close();
        });
      }

      document.addEventListener("keydown", function (event) {
        if (!modal.classList.contains("is-open")) return;

        if (event.key === "Escape") {
          close();
          return;
        }

        if (event.key === "Enter" && document.activeElement === cancelButton) {
          event.preventDefault();
          close();
        }
      });
    }

    return {
      open: open,
      close: close,
    };
  }

  window.DashboardPopupManager = {
    createConfirmPopup: createConfirmPopup,
  };
})();
