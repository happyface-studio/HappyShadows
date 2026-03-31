/** Messages between UI iframe and plugin sandbox */

export interface ApplyMessage {
  type: "apply";
  layers: Array<{
    offsetX: number;
    offsetY: number;
    blurRadius: number;
    color: { r: number; g: number; b: number; a: number };
  }>;
}

export interface SelectionMessage {
  type: "selection";
  count: number;
}

export type PluginMessage = ApplyMessage;
export type UIMessage = SelectionMessage;
