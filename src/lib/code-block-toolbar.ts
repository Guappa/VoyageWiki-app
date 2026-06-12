const COPY_LABEL = "Copy";
const COPIED_LABEL = "Copied";
const COPIED_DURATION_MS = 1500;

function findOwnerPre(button: HTMLElement): HTMLPreElement | null {
  const wrapper = button.closest(".code-block");
  if (!wrapper) return null;
  return wrapper.querySelector("pre");
}

async function handleCopyClick(button: HTMLButtonElement): Promise<void> {
  const pre = findOwnerPre(button);
  if (!pre) return;
  const code = pre.innerText;
  try {
    await navigator.clipboard.writeText(code);
    button.textContent = COPIED_LABEL;
  } catch {
    button.textContent = "Copy failed";
  }
  setTimeout(() => { button.textContent = COPY_LABEL; }, COPIED_DURATION_MS);
}

export function attachCopyButtons(): void {
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[data-copy-button]:not([data-copy-wired])');
  buttons.forEach((button) => {
    button.setAttribute("data-copy-wired", "true");
    button.addEventListener("click", () => { void handleCopyClick(button); });
  });
}
document.addEventListener("astro:page-load", attachCopyButtons);

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachCopyButtons);
  } else {
    attachCopyButtons();
  }
}
