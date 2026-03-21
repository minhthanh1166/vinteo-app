(function () {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function makeModalCardDraggable(card) {
    if (!card || card.dataset.draggableBound === "1") {
      return;
    }

    const modal = card.closest(".confirm-modal");
    if (!modal) {
      return;
    }

    const handle = card.querySelector(".confirm-modal-title") || card;
    const interactiveSelector =
      "button, input, select, textarea, a, [data-no-drag]";

    card.dataset.draggableBound = "1";
    handle.classList.add("confirm-modal-drag-handle");

    let dragging = false;
    let pointerId = null;
    let offsetX = 0;
    let offsetY = 0;

    function onPointerMove(event) {
      if (!dragging || pointerId !== event.pointerId) {
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const nextLeft = clamp(
        event.clientX - offsetX,
        8,
        Math.max(8, window.innerWidth - cardRect.width - 8),
      );
      const nextTop = clamp(
        event.clientY - offsetY,
        8,
        Math.max(8, window.innerHeight - cardRect.height - 8),
      );

      card.style.left = nextLeft + "px";
      card.style.top = nextTop + "px";
    }

    function stopDragging(event) {
      if (!dragging || pointerId !== event.pointerId) {
        return;
      }

      dragging = false;
      pointerId = null;
      card.classList.remove("is-dragging");

      if (typeof handle.releasePointerCapture === "function") {
        try {
          handle.releasePointerCapture(event.pointerId);
        } catch (_error) {
          // Ignore capture release issues on some browsers.
        }
      }
    }

    handle.addEventListener("pointerdown", function (event) {
      if (event.button !== 0) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(interactiveSelector) &&
        !target.closest(".confirm-modal-title")
      ) {
        return;
      }

      const cardRect = card.getBoundingClientRect();
      if (cardRect.width <= 0 || cardRect.height <= 0) {
        return;
      }

      event.preventDefault();

      dragging = true;
      pointerId = event.pointerId;
      offsetX = event.clientX - cardRect.left;
      offsetY = event.clientY - cardRect.top;

      card.classList.add("is-dragging");
      card.style.position = "absolute";
      card.style.margin = "0";
      card.style.left = cardRect.left + "px";
      card.style.top = cardRect.top + "px";

      if (typeof handle.setPointerCapture === "function") {
        try {
          handle.setPointerCapture(event.pointerId);
        } catch (_error) {
          // Ignore capture failures.
        }
      }
    });

    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", stopDragging);
    handle.addEventListener("pointercancel", stopDragging);
  }

  function initDraggableModals() {
    const cards = document.querySelectorAll(".confirm-modal .confirm-modal-card");
    cards.forEach(function (card) {
      makeModalCardDraggable(card);
    });
  }

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

      const card = modal.querySelector(".confirm-modal-card");
      if (card) {
        makeModalCardDraggable(card);
      }

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
    initDraggableModals: initDraggableModals,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDraggableModals);
  } else {
    initDraggableModals();
  }
})();
