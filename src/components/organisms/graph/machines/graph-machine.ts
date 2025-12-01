import { assign, setup } from "xstate";

type GraphContext = {
  selectedNodeIds: Set<string>;
  nodesToDelete?: Set<string>;
  returnMode?: "viewing" | "selecting";
};

type GraphEvent =
  | { type: "TOGGLE_MODE" }
  | { type: "SELECT_NODE"; nodeId: string; multiple?: boolean }
  | { type: "SET_SELECTION"; nodeIds: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "DELETE_SELECTED" }
  | { type: "NODE_CLICK"; nodeId: string }
  | { type: "PANE_CLICK" }
  | { type: "NODE_DOUBLE_CLICK"; nodeId: string }
  | { type: "ADD_TASK" }
  | { type: "OPEN_IMPORT" }
  | { type: "OPEN_TEMPLATE" }
  | { type: "OPEN_SAVE_TEMPLATE" }
  | { type: "CLOSE_DIALOG" }
  | { type: "REQUEST_DELETE"; nodeIds: string[] }
  | { type: "CONFIRM_DELETE" }
  | { type: "CANCEL_DELETE" };

export const graphMachine = setup({
  types: {
    context: {} as GraphContext,
    events: {} as GraphEvent,
  },
  actions: {
    toggleSelection: assign({
      selectedNodeIds: ({ context, event }) => {
        if (event.type !== "NODE_CLICK" && event.type !== "SELECT_NODE")
          return context.selectedNodeIds;
        const nodeId =
          event.type === "NODE_CLICK" ? event.nodeId : event.nodeId; // For SELECT_NODE, event.nodeId is already available.
        const next = new Set(context.selectedNodeIds);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          // Only clear selection if it's a SELECT_NODE event and not multiple,
          // or if it's a NODE_CLICK event (which implies single selection unless already selected).
          // The instruction's toggleSelection for NODE_CLICK doesn't handle multiple,
          // so it will always add/remove.
          if (event.type === "SELECT_NODE" && !event.multiple) {
            next.clear();
          }
          next.add(nodeId);
        }
        return next;
      },
    }),
    setSelection: assign({
      selectedNodeIds: ({ context, event }) => {
        if (event.type !== "SET_SELECTION") return context.selectedNodeIds;
        const next = new Set(context.selectedNodeIds);
        for (const id of event.nodeIds) {
          next.add(id);
        }
        return next;
      },
    }),
    clearSelection: assign({
      selectedNodeIds: () => new Set(),
    }),
    prepareDeleteViewing: assign({
      nodesToDelete: ({ event }) =>
        event.type === "REQUEST_DELETE" ? new Set(event.nodeIds) : undefined,
      returnMode: "viewing",
    }),
    prepareDeleteSelecting: assign({
      nodesToDelete: ({ event }) =>
        event.type === "REQUEST_DELETE" ? new Set(event.nodeIds) : undefined,
      returnMode: "selecting",
    }),
    clearNodesToDelete: assign({
      nodesToDelete: undefined,
      returnMode: undefined,
    }),
    notifyNodeClick: () => {
      // Implementation provided by component
    },
    notifyPaneClick: () => {
      // Implementation provided by component
    },
    notifyNodeDoubleClick: () => {
      // Implementation provided by component
    },
    notifyAddTask: () => {
      // Implementation provided by component
    },
    openImportDialog: () => {
      // Implementation provided by component
    },
    openTemplateDialog: () => {
      // Implementation provided by component
    },
    openSaveTemplateDialog: () => {
      // Implementation provided by component
    },
    performDelete: () => {
      // Implementation provided by component
    },
  },
}).createMachine({
  id: "graph",
  initial: "viewing",
  context: {
    selectedNodeIds: new Set(),
  },
  states: {
    viewing: {
      on: {
        TOGGLE_MODE: {
          target: "selecting",
          actions: "clearSelection",
        },
        NODE_CLICK: {
          actions: "notifyNodeClick",
        },
        PANE_CLICK: {
          actions: "notifyPaneClick",
        },
        NODE_DOUBLE_CLICK: {
          actions: "notifyNodeDoubleClick",
        },
        ADD_TASK: {
          actions: "notifyAddTask",
        },
        OPEN_IMPORT: {
          target: "importing",
        },
        OPEN_TEMPLATE: {
          target: "templating",
        },
        REQUEST_DELETE: {
          target: "deleting",
          actions: "prepareDeleteViewing",
        },
        SELECT_NODE: {
          // viewingモードでの選択イベントは基本的に無視する。
        },
      },
    },
    selecting: {
      on: {
        TOGGLE_MODE: {
          target: "viewing",
          actions: "clearSelection",
        },
        NODE_CLICK: {
          actions: "toggleSelection",
        },
        PANE_CLICK: {
          actions: "clearSelection",
        },
        SELECT_NODE: {
          actions: "toggleSelection",
        },
        SET_SELECTION: {
          actions: "setSelection",
        },
        CLEAR_SELECTION: {
          actions: "clearSelection",
        },
        DELETE_SELECTED: {
          actions: "clearSelection",
        },
        OPEN_SAVE_TEMPLATE: {
          target: "savingTemplate",
        },
        REQUEST_DELETE: {
          target: "deleting",
          actions: "prepareDeleteSelecting",
        },
      },
    },
    importing: {
      on: {
        CLOSE_DIALOG: {
          target: "viewing",
        },
      },
    },
    templating: {
      on: {
        CLOSE_DIALOG: {
          target: "viewing",
        },
      },
    },
    savingTemplate: {
      on: {
        CLOSE_DIALOG: {
          target: "selecting",
        },
      },
    },
    deleting: {
      on: {
        CONFIRM_DELETE: [
          {
            target: "viewing",
            guard: ({ context }) => context.returnMode === "viewing",
            actions: ["performDelete", "clearNodesToDelete"],
          },
          {
            target: "selecting",
            guard: ({ context }) => context.returnMode === "selecting",
            actions: ["performDelete", "clearSelection", "clearNodesToDelete"],
          },
        ],
        CANCEL_DELETE: [
          {
            target: "viewing",
            guard: ({ context }) => context.returnMode === "viewing",
            actions: "clearNodesToDelete",
          },
          {
            target: "selecting",
            guard: ({ context }) => context.returnMode === "selecting",
            actions: "clearNodesToDelete",
          },
        ],
      },
    },
  },
});
