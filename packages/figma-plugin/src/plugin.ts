/// <reference types="@figma/plugin-typings" />
import type { PluginMessage, UIMessage } from "./messages";

figma.showUI(__html__, { width: 420, height: 620, themeColors: true });

// Notify UI of selection count on start and on change
function sendSelection() {
  const msg: UIMessage = {
    type: "selection",
    count: figma.currentPage.selection.length,
  };
  figma.ui.postMessage(msg);
}

sendSelection();
figma.on("selectionchange", sendSelection);

// Handle messages from the UI
figma.ui.onmessage = (msg: PluginMessage) => {
  if (msg.type === "apply") {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify("Select at least one layer to apply shadows.");
      return;
    }

    // Preview card in the plugin UI is 140×170px.
    // Scale shadow values proportionally to the target node size.
    const PREVIEW_CARD_SIZE = 170;

    for (const node of selection) {
      if (!("effects" in node)) continue;

      const scale = Math.max(node.width, node.height) / PREVIEW_CARD_SIZE;

      // Preserve non-shadow effects
      const otherEffects = (node.effects as readonly Effect[]).filter(
        (e) => e.type !== "DROP_SHADOW"
      );

      const dropShadows: DropShadowEffect[] = msg.layers.map((layer) => ({
        type: "DROP_SHADOW",
        visible: true,
        blendMode: "NORMAL",
        color: {
          r: layer.color.r,
          g: layer.color.g,
          b: layer.color.b,
          a: layer.color.a,
        },
        offset: { x: layer.offsetX * scale, y: layer.offsetY * scale },
        radius: layer.blurRadius * scale,
        spread: 0,
      }));

      node.effects = [...otherEffects, ...dropShadows];
    }

    figma.notify(`Applied HappyShadow to ${selection.length} layer(s)`);
  }
};
