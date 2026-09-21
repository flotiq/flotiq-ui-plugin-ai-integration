const GAP = 16;
const EDGE = 8;

const supportsPopover =
    typeof HTMLElement !== "undefined" &&
    Object.prototype.hasOwnProperty.call(HTMLElement.prototype, "popover");

let tooltip = null;
let installed = false;

const getTooltip = () => {
    if (tooltip) return tooltip;

    tooltip = document.createElement("div");
    tooltip.className = "plugin-ai-integration-tooltip";
    tooltip.setAttribute("role", "tooltip");

    if (supportsPopover) tooltip.popover = "manual";

    document.body.appendChild(tooltip);

    return tooltip;
};

const hide = () => {
    if (!tooltip) return;

    tooltip.classList.remove("is-visible");

    if (supportsPopover && tooltip.matches(":popover-open")) {
        tooltip.hidePopover();
    }
};

const show = (trigger) => {
    const text = trigger.dataset.tooltip;
    if (!text) return;

    const tip = getTooltip();

    tip.textContent = text;
    tip.dataset.arrow = String(
        !trigger.classList.contains("plugin-ai-integration-tip--start") &&
            !trigger.classList.contains("plugin-ai-integration-tip--end"),
    );

    if (supportsPopover && !tip.matches(":popover-open")) tip.showPopover();

    const anchor = trigger.getBoundingClientRect();
    const box = tip.getBoundingClientRect();

    let left;
    if (trigger.classList.contains("plugin-ai-integration-tip--start")) {
        left = anchor.left;
    } else if (trigger.classList.contains("plugin-ai-integration-tip--end")) {
        left = anchor.right - box.width;
    } else {
        left = anchor.left + anchor.width / 2 - box.width / 2;
    }

    const maxLeft = document.documentElement.clientWidth - box.width - EDGE;
    left = Math.max(EDGE, Math.min(left, Math.max(EDGE, maxLeft)));

    let top = anchor.top - box.height - GAP;
    const flipped = top < EDGE;

    if (flipped) top = anchor.bottom + GAP;

    tip.dataset.flipped = String(flipped);
    tip.style.left = `${Math.round(left)}px`;
    tip.style.top = `${Math.round(top)}px`;

    tip.classList.add("is-visible");
};

const triggerFrom = (target) =>
    target instanceof Element
        ? target.closest(".plugin-ai-integration-tip[data-tooltip]")
        : null;

export const installTooltips = () => {
    if (installed || typeof document === "undefined") return;
    installed = true;

    document.addEventListener("pointerover", (event) => {
        const trigger = triggerFrom(event.target);

        if (!trigger) {
            if (!triggerFrom(event.relatedTarget)) hide();
            return;
        }

        show(trigger);
    });

    document.addEventListener("pointerout", (event) => {
        const trigger = triggerFrom(event.target);
        if (trigger && !trigger.contains(event.relatedTarget)) hide();
    });

    document.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") hide();
    });
};

installTooltips();
