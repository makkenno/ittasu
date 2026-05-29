import { assign, setup } from "xstate";

type GraphContext = {
  selectedNodeIds: Set<string>;
  nodesToDelete?: Set<string>;
};

type GraphEvent =
  | { type: "TOGGLE_MODE" }
  | { type: "SELECT_NODE"; nodeId: string; multiple?: boolean }
  | { type: "SET_SELECTION"; nodeIds: string[] }
  | { type: "CLEAR_SELECTION" }
  | { type: "NODE_CLICK"; nodeId: string }
  | { type: "PANE_CLICK" }
  | { type: "NODE_DOUBLE_CLICK"; nodeId: string }
  | { type: "ADD_TASK" }
  | { type: "OPEN_IMPORT" }
  | { type: "OPEN_TEMPLATE" }
  | { type: "OPEN_SAVE_TEMPLATE" }
  | { type: "CLOSE_DIALOG" }
  | { type: "REQUEST_DELETE"; nodeIds: string[] };

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
          event.type === "NODE_CLICK" ? event.nodeId : event.nodeId;
        const next = new Set(context.selectedNodeIds);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
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
    storeNodesToDelete: assign({
      nodesToDelete: ({ event }) =>
        event.type === "REQUEST_DELETE" ? new Set(event.nodeIds) : undefined,
    }),
    clearNodesToDelete: assign({
      nodesToDelete: undefined,
    }),
    notifyNodeClick: () => {},
    notifyPaneClick: () => {},
    notifyNodeDoubleClick: () => {},
    notifyAddTask: () => {},
    performDelete: () => {},
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
          actions: [
            "storeNodesToDelete",
            "performDelete",
            "clearNodesToDelete",
          ],
        },
        SELECT_NODE: {},
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
        OPEN_SAVE_TEMPLATE: {
          target: "savingTemplate",
        },
        REQUEST_DELETE: {
          target: "viewing",
          actions: [
            "storeNodesToDelete",
            "performDelete",
            "clearNodesToDelete",
            "clearSelection",
          ],
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
  },
});
