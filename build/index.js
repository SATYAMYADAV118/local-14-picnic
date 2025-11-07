(() => {
  var __create = Object.create;
  var __getProtoOf = Object.getPrototypeOf;
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __toESM = (mod, isNodeMode, target) => {
    target = mod != null ? __create(__getProtoOf(mod)) : {};
    const to = isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target;
    for (let key of __getOwnPropNames(mod))
      if (!__hasOwnProp.call(to, key))
        __defProp(to, key, {
          get: () => mod[key],
          enumerable: true
        });
    return to;
  };
  var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);

  // node_modules/react/index.js
  var require_react = __commonJS((exports, module) => {
    var element = globalThis.wp && globalThis.wp.element || globalThis.React;
    if (!element) {
      throw new Error("wp.element (React) is not available in this environment.");
    }
    module.exports = element;
    module.exports.default = element;
  });

  // node_modules/react-dom/client.js
  var require_client = __commonJS((exports, module) => {
    var element = globalThis.wp && globalThis.wp.element || globalThis.ReactDOM || globalThis.React && globalThis.ReactDOM;
    if (!element) {
      throw new Error("react-dom/client stub requires wp.element.render or ReactDOM.");
    }
    function createRoot(container) {
      if (element.createRoot) {
        return element.createRoot(container);
      }
      const render = element.render || globalThis.wp && globalThis.wp.element && globalThis.wp.element.render;
      if (!render) {
        throw new Error("ReactDOM.render is not available");
      }
      return {
        render(node) {
          render(node, container);
        }
      };
    }
    module.exports = { createRoot };
    module.exports.default = { createRoot };
  });

  // node_modules/chart.js/index.js
  var require_chart = __commonJS((exports, module) => {
    var Chart = globalThis.Chart;
    if (!Chart) {
      throw new Error("Chart.js global is required before loading this bundle.");
    }
    module.exports = Chart;
    module.exports.ArcElement = Chart.ArcElement;
    module.exports.Tooltip = Chart.Tooltip;
    module.exports.Legend = Chart.Legend;
    module.exports.LineElement = Chart.LineElement;
    module.exports.PointElement = Chart.PointElement;
    module.exports.CategoryScale = Chart.CategoryScale;
    module.exports.LinearScale = Chart.LinearScale;
    module.exports.default = Chart;
  });

  // node_modules/classnames/index.js
  var require_classnames = __commonJS((exports, module) => {
    function classnames() {
      const classes = [];
      for (let i = 0;i < arguments.length; i++) {
        const value = arguments[i];
        if (!value) {
          continue;
        }
        if (typeof value === "string") {
          classes.push(value);
        } else if (Array.isArray(value)) {
          classes.push(classnames.apply(null, value));
        } else if (typeof value === "object") {
          for (const key in value) {
            if (Object.prototype.hasOwnProperty.call(value, key) && value[key]) {
              classes.push(key);
            }
          }
        }
      }
      return classes.join(" ");
    }
    module.exports = classnames;
    module.exports.default = classnames;
  });

  // node_modules/react/jsx-runtime.js
  var require_jsx_runtime = __commonJS((exports) => {
    var React = require_react();
    var Fragment = React.Fragment || function Fragment(props) {
      return props.children || null;
    };
    function jsx(type, props, key) {
      return React.createElement(type, assignKey(props, key));
    }
    function jsxs(type, props, key) {
      return React.createElement(type, assignKey(props, key));
    }
    function assignKey(props, key) {
      if (key !== undefined && key !== null) {
        return Object.assign({}, props, { key });
      }
      return props;
    }
    exports.Fragment = Fragment;
    exports.jsx = jsx;
    exports.jsxs = jsxs;
    exports.jsxDEV = jsx;
  });

  // node_modules/react/jsx-dev-runtime.js
  var require_jsx_dev_runtime = __commonJS((exports, module) => {
    module.exports = require_jsx_runtime();
  });

  // assets/src/index.tsx
  var import_react11 = __toESM(require_react());
  var import_client = __toESM(require_client());
  var import_chart3 = __toESM(require_chart());
  var import_classnames = __toESM(require_classnames());

  // assets/src/views/DashboardView.tsx
  var import_react3 = __toESM(require_react());

  // assets/src/widgets/FundingChart.tsx
  var import_react = __toESM(require_react());
  var import_chart = __toESM(require_chart());
  var jsx_dev_runtime = __toESM(require_jsx_dev_runtime());
  var FundingChart = ({ snapshot }) => {
    const canvas = import_react.useRef(null);
    const chartRef = import_react.useRef(null);
    import_react.useEffect(() => {
      const node = canvas.current;
      if (!node) {
        return;
      }
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const totals = Object.values(snapshot).reduce((acc, item) => {
        return { income: acc.income + item.income, expense: acc.expense + item.expense };
      }, { income: 0, expense: 0 });
      chartRef.current = new import_chart.Chart(node, {
        type: "doughnut",
        data: {
          labels: ["Income", "Expense"],
          datasets: [
            {
              data: [totals.income, totals.expense],
              backgroundColor: ["var(--l4p-primary)", "var(--l4p-warning)"],
              borderWidth: 0
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "bottom"
            }
          }
        }
      });
      return () => {
        chartRef.current?.destroy();
      };
    }, [snapshot]);
    return /* @__PURE__ */ jsx_dev_runtime.jsxDEV("canvas", {
      ref: canvas,
      "aria-label": "Funding donut chart",
      role: "img"
    }, undefined, false, undefined, this);
  };

  // assets/src/widgets/LineTrendChart.tsx
  var import_react2 = __toESM(require_react());
  var import_chart2 = __toESM(require_chart());
  var jsx_dev_runtime2 = __toESM(require_jsx_dev_runtime());
  var LineTrendChart = ({ snapshot }) => {
    const canvas = import_react2.useRef(null);
    const chartRef = import_react2.useRef(null);
    import_react2.useEffect(() => {
      const node = canvas.current;
      if (!node) {
        return;
      }
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      const labels = Object.keys(snapshot);
      const income = labels.map((label) => snapshot[label].income);
      const expense = labels.map((label) => snapshot[label].expense);
      chartRef.current = new import_chart2.Chart(node, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Income",
              data: income,
              borderColor: "var(--l4p-primary)",
              tension: 0.4
            },
            {
              label: "Expense",
              data: expense,
              borderColor: "var(--l4p-warning)",
              tension: 0.4
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: true,
              position: "bottom"
            }
          }
        }
      });
      return () => {
        chartRef.current?.destroy();
      };
    }, [snapshot]);
    return /* @__PURE__ */ jsx_dev_runtime2.jsxDEV("canvas", {
      ref: canvas,
      "aria-label": "Income vs expense trend",
      role: "img"
    }, undefined, false, undefined, this);
  };

  // assets/src/widgets/Timeline.tsx
  var jsx_dev_runtime3 = __toESM(require_jsx_dev_runtime());
  var Timeline = ({ items }) => {
    return /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("ul", {
      className: "l4p-timeline",
      children: [
        items.map((item) => /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("li", {
          children: [
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("span", {
              className: "l4p-dot",
              "aria-hidden": "true"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("div", {
              children: [
                /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("p", {
                  children: item.message
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("time", {
                  dateTime: item.created_at,
                  children: new Date(item.created_at).toLocaleString()
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, item.id, true, undefined, this)),
        items.length === 0 && /* @__PURE__ */ jsx_dev_runtime3.jsxDEV("li", {
          className: "l4p-empty",
          children: "No notifications yet."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/widgets/CommunityMiniFeed.tsx
  var jsx_dev_runtime4 = __toESM(require_jsx_dev_runtime());
  var CommunityMiniFeed = ({ posts }) => {
    return /* @__PURE__ */ jsx_dev_runtime4.jsxDEV("ul", {
      className: "l4p-mini-feed",
      children: [
        posts.map((post) => /* @__PURE__ */ jsx_dev_runtime4.jsxDEV("li", {
          children: [
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV("p", {
              children: post.body
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime4.jsxDEV("time", {
              dateTime: post.created_at,
              children: new Date(post.created_at).toLocaleString()
            }, undefined, false, undefined, this)
          ]
        }, post.id, true, undefined, this)),
        posts.length === 0 && /* @__PURE__ */ jsx_dev_runtime4.jsxDEV("li", {
          className: "l4p-empty",
          children: "No community updates yet."
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/utils/api.ts
  async function fetchJSON(endpoint, options = {}) {
    const response = await fetch(`${l4pApp.root}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        "X-WP-Nonce": l4pApp.nonce,
        ...options.headers || {}
      },
      credentials: "same-origin",
      ...options
    });
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    return response.json();
  }
  async function sendJSON(endpoint, method, body) {
    return fetchJSON(endpoint, {
      method,
      body: JSON.stringify(body)
    });
  }

  // assets/src/widgets/StatChip.tsx
  var jsx_dev_runtime5 = __toESM(require_jsx_dev_runtime());
  var StatChip = ({ label, value, delta, tone }) => {
    return /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("div", {
      className: `l4p-stat-chip is-${tone}`,
      children: [
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("span", {
          className: "l4p-stat-label",
          children: label
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("strong", {
          children: value
        }, undefined, false, undefined, this),
        delta && /* @__PURE__ */ jsx_dev_runtime5.jsxDEV("span", {
          className: "l4p-stat-delta",
          children: delta
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/DashboardView.tsx
  var jsx_dev_runtime6 = __toESM(require_jsx_dev_runtime());
  var DashboardView = ({ addToast }) => {
    const [data, setData] = import_react3.useState(null);
    const [loading, setLoading] = import_react3.useState(true);
    const loadDashboard = () => {
      setLoading(true);
      fetchJSON("dashboard").then((response) => {
        setData(response);
      }).catch(() => {
        addToast({ type: "error", message: "Unable to load dashboard data." });
      }).finally(() => {
        setLoading(false);
      });
    };
    import_react3.useEffect(() => {
      loadDashboard();
      const handler = () => loadDashboard();
      window.addEventListener("l4p-refresh-dashboard", handler);
      return () => {
        window.removeEventListener("l4p-refresh-dashboard", handler);
      };
    }, []);
    if (loading) {
      return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("div", {
        className: "l4p-skeleton",
        "aria-busy": "true",
        "aria-live": "polite"
      }, undefined, false, undefined, this);
    }
    if (!data) {
      return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("div", {
        className: "l4p-empty",
        children: "No dashboard data yet."
      }, undefined, false, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("div", {
      className: "l4p-grid",
      children: [
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("section", {
          className: "l4p-card l4p-span-2",
          "aria-labelledby": "l4p-my-tasks",
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("header", {
              className: "l4p-card-header",
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("h2", {
                  id: "l4p-my-tasks",
                  children: "My Tasks"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(StatChip, {
                  label: "Due Soon",
                  value: data.myTasks.length.toString(),
                  delta: "",
                  tone: "primary"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("ul", {
              className: "l4p-task-list",
              children: [
                data.myTasks.map((task) => /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("li", {
                  className: `is-${task.status}`,
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("div", {
                      children: [
                        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("h3", {
                          children: task.title
                        }, undefined, false, undefined, this),
                        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("p", {
                          children: task.description
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("span", {
                      className: "l4p-date-badge",
                      children: task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"
                    }, undefined, false, undefined, this)
                  ]
                }, task.id, true, undefined, this)),
                data.myTasks.length === 0 && /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("li", {
                  className: "l4p-empty",
                  children: "No tasks assigned."
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("section", {
          className: "l4p-card",
          "aria-labelledby": "l4p-funding-donut",
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("header", {
              className: "l4p-card-header",
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("h2", {
                  id: "l4p-funding-donut",
                  children: "Funding Snapshot"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("button", {
                  className: "l4p-link",
                  children: "View All"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(FundingChart, {
              snapshot: data.fundingSnapshot
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("section", {
          className: "l4p-card",
          "aria-labelledby": "l4p-income-trend",
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("header", {
              className: "l4p-card-header",
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("h2", {
                id: "l4p-income-trend",
                children: "7-day Income vs Expense"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(LineTrendChart, {
              snapshot: data.fundingSnapshot
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("section", {
          className: "l4p-card",
          "aria-labelledby": "l4p-latest-notes",
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("header", {
              className: "l4p-card-header",
              children: /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("h2", {
                id: "l4p-latest-notes",
                children: "Latest Notifications"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(Timeline, {
              items: data.notifications
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("section", {
          className: "l4p-card",
          "aria-labelledby": "l4p-community",
          children: [
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("header", {
              className: "l4p-card-header",
              children: [
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("h2", {
                  id: "l4p-community",
                  children: "Community Feed"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime6.jsxDEV("button", {
                  className: "l4p-link",
                  children: "View All"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime6.jsxDEV(CommunityMiniFeed, {
              posts: data.community
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/TasksView.tsx
  var import_react5 = __toESM(require_react());

  // assets/src/utils/useDraft.ts
  var import_react4 = __toESM(require_react());
  var TTL_MS = 30 * 60 * 1000;
  function useDraft(key, initialValue) {
    const storageKey = `l4p-draft-${key}`;
    const [value, setValue] = import_react4.useState(() => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        if (!raw) {
          return null;
        }
        const parsed = JSON.parse(raw);
        if (Date.now() > parsed.expires) {
          window.localStorage.removeItem(storageKey);
          return null;
        }
        return parsed.value;
      } catch (error) {
        return null;
      }
    });
    const latest = import_react4.useRef(value || initialValue);
    import_react4.useEffect(() => {
      latest.current = value || initialValue;
    }, [value, initialValue]);
    const update = (next) => {
      setValue(next);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({ value: next, expires: Date.now() + TTL_MS }));
      } catch (error) {}
    };
    const clear = () => {
      setValue(null);
      window.localStorage.removeItem(storageKey);
    };
    return { value, update, clear };
  }

  // assets/src/views/TasksView.tsx
  var jsx_dev_runtime7 = __toESM(require_jsx_dev_runtime());
  var emptyTask = {
    title: "",
    description: "",
    status: "todo"
  };
  var TasksView = ({ addToast }) => {
    const [tasks, setTasks] = import_react5.useState([]);
    const [loading, setLoading] = import_react5.useState(true);
    const [isEditing, setIsEditing] = import_react5.useState(false);
    const [editingTask, setEditingTask] = import_react5.useState(emptyTask);
    const [comments, setComments] = import_react5.useState([]);
    const [commentsLoading, setCommentsLoading] = import_react5.useState(false);
    const [filter, setFilter] = import_react5.useState("");
    const draft = useDraft("tasks-draft", editingTask);
    const canWrite = l4pApp.currentUser.roles.includes("l4p_coordinator") || l4pApp.currentUser.roles.includes("l4p_volunteer") && l4pApp.settings.volunteer_create_tasks;
    const canComment = l4pApp.currentUser.roles.includes("l4p_coordinator") || l4pApp.currentUser.roles.includes("l4p_volunteer");
    const isCoordinator = l4pApp.currentUser.roles.includes("l4p_coordinator");
    import_react5.useEffect(() => {
      loadTasks();
    }, []);
    import_react5.useEffect(() => {
      draft.update(editingTask);
    }, [editingTask]);
    import_react5.useEffect(() => {
      if (!isEditing) {
        draft.clear();
      }
    }, [isEditing]);
    const loadTasks = () => {
      fetchJSON("tasks").then((items) => {
        setTasks(items);
      }).catch(() => addToast({ type: "error", message: "Unable to load tasks." })).finally(() => setLoading(false));
    };
    const openDrawer = (task) => {
      setIsEditing(true);
      setEditingTask(task ? { ...task } : draft.value || emptyTask);
      if (task && task.id) {
        loadComments(task.id);
      } else {
        setComments([]);
      }
    };
    const closeDrawer = () => {
      setIsEditing(false);
      setEditingTask(emptyTask);
      setComments([]);
    };
    const handleSave = async () => {
      if (!canWrite) {
        return;
      }
      try {
        if (editingTask.id) {
          await sendJSON(`tasks/${editingTask.id}`, "POST", editingTask);
          addToast({ type: "success", message: "Task updated." });
        } else {
          await sendJSON("tasks", "POST", editingTask);
          addToast({ type: "success", message: "Task created." });
        }
        closeDrawer();
        loadTasks();
        window.dispatchEvent(new CustomEvent("l4p-refresh-dashboard"));
      } catch (error) {
        addToast({ type: "error", message: "Could not save task." });
      }
    };
    const loadComments = (taskId) => {
      setCommentsLoading(true);
      fetchJSON(`tasks/${taskId}/comments`).then((items) => setComments(items)).catch(() => addToast({ type: "error", message: "Unable to load comments." })).finally(() => setCommentsLoading(false));
    };
    const handleCommentSubmit = async (body, parentId) => {
      if (!editingTask.id) {
        return;
      }
      try {
        await sendJSON(`tasks/${editingTask.id}/comments`, "POST", {
          body,
          parent_id: parentId || undefined
        });
        addToast({ type: "success", message: "Comment added." });
        loadComments(editingTask.id);
      } catch (error) {
        addToast({ type: "error", message: "Could not add comment." });
      }
    };
    const handleCommentDelete = async (commentId) => {
      if (!editingTask.id) {
        return;
      }
      try {
        await fetchJSON(`tasks/comments/${commentId}`, { method: "DELETE" });
        addToast({ type: "success", message: "Comment removed." });
        loadComments(editingTask.id);
      } catch (error) {
        addToast({ type: "error", message: "Could not remove comment." });
      }
    };
    const commentTree = buildCommentTree(comments);
    const filteredTasks = filter ? tasks.filter((task) => task.status === filter) : tasks;
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
      className: "l4p-stack",
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("header", {
          className: "l4p-toolbar",
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("h1", {
              children: "Tasks"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
              className: "l4p-toolbar-actions",
              children: [
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("select", {
                  value: filter,
                  onChange: (event) => setFilter(event.target.value),
                  "aria-label": "Filter tasks by status",
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                      value: "",
                      children: "All"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                      value: "todo",
                      children: "To do"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                      value: "doing",
                      children: "In progress"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                      value: "done",
                      children: "Done"
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                canWrite && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
                  className: "l4p-button",
                  onClick: () => openDrawer(),
                  children: "New Task"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        loading ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
          className: "l4p-skeleton",
          "aria-busy": "true"
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("table", {
          className: "l4p-table",
          role: "grid",
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("thead", {
              children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("tr", {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("th", {
                    scope: "col",
                    children: "Title"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("th", {
                    scope: "col",
                    children: "Status"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("th", {
                    scope: "col",
                    children: "Priority"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("th", {
                    scope: "col",
                    children: "Due"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("th", {
                    scope: "col",
                    children: "Actions"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("tbody", {
              children: [
                filteredTasks.map((task) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("tr", {
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("td", {
                      children: task.title
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("td", {
                      children: task.status
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("td", {
                      children: task.priority || "—"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("td", {
                      children: task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("td", {
                      children: canWrite && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
                        className: "l4p-link",
                        onClick: () => openDrawer(task),
                        children: "Edit"
                      }, undefined, false, undefined, this)
                    }, undefined, false, undefined, this)
                  ]
                }, task.id, true, undefined, this)),
                filteredTasks.length === 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("tr", {
                  children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("td", {
                    colSpan: 5,
                    className: "l4p-empty",
                    children: "No tasks yet."
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        isEditing && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
          className: "l4p-drawer",
          role: "dialog",
          "aria-modal": "true",
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
            className: "l4p-drawer-content",
            children: [
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("header", {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("h2", {
                    children: editingTask.id ? "Edit Task" : "Create Task"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
                    "aria-label": "Close",
                    onClick: closeDrawer,
                    children: "×"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("form", {
                onSubmit: (event) => {
                  event.preventDefault();
                  handleSave();
                },
                children: [
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("label", {
                    children: [
                      "Title",
                      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("input", {
                        value: editingTask.title || "",
                        onChange: (event) => setEditingTask((prev) => ({ ...prev, title: event.target.value })),
                        required: true
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("label", {
                    children: [
                      "Description",
                      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("textarea", {
                        value: editingTask.description || "",
                        onChange: (event) => setEditingTask((prev) => ({ ...prev, description: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("label", {
                    children: [
                      "Status",
                      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("select", {
                        value: editingTask.status || "todo",
                        onChange: (event) => setEditingTask((prev) => ({ ...prev, status: event.target.value })),
                        children: [
                          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                            value: "todo",
                            children: "To do"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                            value: "doing",
                            children: "In progress"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("option", {
                            value: "done",
                            children: "Done"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("label", {
                    children: [
                      "Priority",
                      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("input", {
                        value: editingTask.priority || "",
                        onChange: (event) => setEditingTask((prev) => ({ ...prev, priority: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("label", {
                    children: [
                      "Due Date",
                      /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("input", {
                        type: "date",
                        value: editingTask.due_date ? editingTask.due_date.substring(0, 10) : "",
                        onChange: (event) => setEditingTask((prev) => ({ ...prev, due_date: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("footer", {
                    children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
                      type: "submit",
                      className: "l4p-button",
                      children: "Save"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              editingTask.id && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("section", {
                className: "l4p-task-discussion",
                children: [
                  /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("header", {
                    children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("h3", {
                      children: "Discussion"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this),
                  commentsLoading ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
                    className: "l4p-skeleton",
                    "aria-busy": "true"
                  }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TaskCommentsList, {
                    comments: commentTree,
                    onReply: handleCommentSubmit,
                    onDelete: handleCommentDelete,
                    canComment,
                    canDelete: (comment) => isCoordinator || comment.author_id === l4pApp.currentUser.id,
                    taskId: editingTask.id
                  }, undefined, false, undefined, this),
                  canComment ? /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TaskCommentComposer, {
                    storageKey: `task-${editingTask.id}-root`,
                    onSubmit: (body) => handleCommentSubmit(body),
                    label: "Add a comment"
                  }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("p", {
                    className: "l4p-muted",
                    children: "You do not have permission to comment on tasks."
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  var buildCommentTree = (items) => {
    const map = new Map;
    const roots = [];
    items.forEach((item) => {
      map.set(item.id, { ...item, children: [] });
    });
    map.forEach((node) => {
      if (node.parent_id && map.has(node.parent_id)) {
        map.get(node.parent_id).children.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };
  var TaskCommentsList = ({ comments, onReply, onDelete, canComment, canDelete, taskId }) => {
    if (comments.length === 0) {
      return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("p", {
        className: "l4p-empty",
        children: "No comments yet."
      }, undefined, false, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("ul", {
      className: "l4p-comment-thread",
      children: comments.map((comment) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TaskCommentItem, {
        comment,
        onReply,
        onDelete,
        canComment,
        canDelete,
        taskId
      }, comment.id, false, undefined, this))
    }, undefined, false, undefined, this);
  };
  var TaskCommentItem = ({ comment, onReply, onDelete, canComment, canDelete, taskId }) => {
    const [showReply, setShowReply] = import_react5.useState(false);
    const draftKey = `task-${taskId}-reply-${comment.id}`;
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("li", {
      className: "l4p-comment-item",
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
          className: "l4p-comment-body",
          children: [
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("header", {
              children: [
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("strong", {
                  children: comment.author_name
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("time", {
                  dateTime: comment.created_at,
                  children: new Date(comment.created_at).toLocaleString()
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("p", {
              dangerouslySetInnerHTML: { __html: comment.body }
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
              className: "l4p-comment-actions",
              children: [
                canComment && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
                  className: "l4p-link",
                  onClick: () => setShowReply((prev) => !prev),
                  children: showReply ? "Cancel" : "Reply"
                }, undefined, false, undefined, this),
                canDelete(comment) && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
                  className: "l4p-link l4p-danger",
                  onClick: () => onDelete(comment.id),
                  children: "Delete"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        showReply && canComment && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
          className: "l4p-comment-reply",
          children: /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TaskCommentComposer, {
            storageKey: draftKey,
            onSubmit: (body) => {
              onReply(body, comment.id);
              setShowReply(false);
            },
            label: "Reply"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        comment.children.length > 0 && /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("ul", {
          className: "l4p-comment-children",
          children: comment.children.map((child) => /* @__PURE__ */ jsx_dev_runtime7.jsxDEV(TaskCommentItem, {
            comment: child,
            onReply,
            onDelete,
            canComment,
            canDelete,
            taskId
          }, child.id, false, undefined, this))
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  var TaskCommentComposer = ({ storageKey, onSubmit, label }) => {
    const draft = useDraft(storageKey, "");
    return /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("div", {
      className: "l4p-comment-composer",
      children: [
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("textarea", {
          value: draft.value || "",
          onChange: (event) => draft.update(event.target.value),
          placeholder: label
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime7.jsxDEV("button", {
          className: "l4p-button",
          onClick: () => {
            if (!draft.value || !draft.value.trim()) {
              return;
            }
            onSubmit(draft.value);
            draft.clear();
          },
          children: label
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/FundingView.tsx
  var import_react6 = __toESM(require_react());
  var jsx_dev_runtime8 = __toESM(require_jsx_dev_runtime());
  var emptyFunding = {
    type: "income",
    tx_date: new Date().toISOString().substring(0, 10)
  };
  var FundingView = ({ addToast }) => {
    const [records, setRecords] = import_react6.useState([]);
    const [loading, setLoading] = import_react6.useState(true);
    const [isCoordinator] = import_react6.useState(l4pApp.currentUser.roles.includes("l4p_coordinator"));
    const [isEditing, setIsEditing] = import_react6.useState(false);
    const [record, setRecord] = import_react6.useState(emptyFunding);
    const loadFunding = () => {
      fetchJSON("funding").then((items) => setRecords(items)).catch(() => addToast({ type: "error", message: "Unable to load funding." })).finally(() => setLoading(false));
    };
    import_react6.useEffect(() => {
      loadFunding();
    }, []);
    const open = (item) => {
      if (!isCoordinator) {
        addToast({ type: "error", message: "You don't have permission to modify funding records." });
        return;
      }
      setRecord(item ? { ...item } : emptyFunding);
      setIsEditing(true);
    };
    const close = () => {
      setIsEditing(false);
    };
    const save = async () => {
      try {
        if (record.id) {
          await sendJSON(`funding/${record.id}`, "POST", record);
        } else {
          await sendJSON("funding", "POST", record);
        }
        addToast({ type: "success", message: "Funding saved." });
        close();
        loadFunding();
        window.dispatchEvent(new CustomEvent("l4p-refresh-dashboard"));
      } catch (error) {
        addToast({ type: "error", message: "Could not save funding." });
      }
    };
    const remove = async () => {
      if (!record.id) {
        return;
      }
      try {
        await fetchJSON(`funding/${record.id}`, { method: "DELETE" });
        addToast({ type: "success", message: "Funding deleted." });
        close();
        loadFunding();
        window.dispatchEvent(new CustomEvent("l4p-refresh-dashboard"));
      } catch (error) {
        addToast({ type: "error", message: "Could not delete funding." });
      }
    };
    return /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("div", {
      className: "l4p-stack",
      children: [
        /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("header", {
          className: "l4p-toolbar",
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("h1", {
              children: "Funding"
            }, undefined, false, undefined, this),
            isCoordinator && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("div", {
              className: "l4p-toolbar-actions",
              children: [
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("a", {
                  className: "l4p-button",
                  href: `${l4pApp.root}funding/export`,
                  children: "Export CSV"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("button", {
                  className: "l4p-button",
                  onClick: () => open(),
                  children: "Add Transaction"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        loading ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("div", {
          className: "l4p-skeleton",
          "aria-busy": "true"
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("table", {
          className: "l4p-table",
          role: "grid",
          children: [
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("thead", {
              children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("tr", {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("th", {
                    scope: "col",
                    children: "Date"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("th", {
                    scope: "col",
                    children: "Type"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("th", {
                    scope: "col",
                    children: "Category"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("th", {
                    scope: "col",
                    children: "Amount"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("th", {
                    scope: "col",
                    children: "Note"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("th", {
                    scope: "col",
                    children: "Actions"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("tbody", {
              children: [
                records.map((item) => /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("tr", {
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                      children: new Date(item.tx_date).toLocaleDateString()
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                      children: item.type
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                      children: item.category || "—"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                      children: item.amount.toLocaleString(undefined, { style: "currency", currency: l4pApp.settings.currency || "USD" })
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                      children: item.note || "—"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                      children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("button", {
                        className: "l4p-link",
                        onClick: () => open(item),
                        children: isCoordinator ? "Edit" : "View"
                      }, undefined, false, undefined, this)
                    }, undefined, false, undefined, this)
                  ]
                }, item.id, true, undefined, this)),
                records.length === 0 && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("tr", {
                  children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("td", {
                    colSpan: 6,
                    className: "l4p-empty",
                    children: "No funding records."
                  }, undefined, false, undefined, this)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this),
        isEditing && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("div", {
          className: "l4p-drawer",
          role: "dialog",
          "aria-modal": "true",
          children: /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("div", {
            className: "l4p-drawer-content",
            children: [
              /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("header", {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("h2", {
                    children: record.id ? "Edit Transaction" : "Add Transaction"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("button", {
                    "aria-label": "Close",
                    onClick: close,
                    children: "×"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              isCoordinator ? /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("form", {
                onSubmit: (event) => {
                  event.preventDefault();
                  save();
                },
                children: [
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("label", {
                    children: [
                      "Type",
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("select", {
                        value: record.type,
                        onChange: (event) => setRecord((prev) => ({ ...prev, type: event.target.value })),
                        children: [
                          /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("option", {
                            value: "income",
                            children: "Income"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("option", {
                            value: "expense",
                            children: "Expense"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("label", {
                    children: [
                      "Amount",
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("input", {
                        type: "number",
                        step: "0.01",
                        value: record.amount || "",
                        onChange: (event) => setRecord((prev) => ({ ...prev, amount: Number(event.target.value) })),
                        required: true
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("label", {
                    children: [
                      "Category",
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("input", {
                        value: record.category || "",
                        onChange: (event) => setRecord((prev) => ({ ...prev, category: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("label", {
                    children: [
                      "Note",
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("textarea", {
                        value: record.note || "",
                        onChange: (event) => setRecord((prev) => ({ ...prev, note: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("label", {
                    children: [
                      "Transaction Date",
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("input", {
                        type: "date",
                        value: record.tx_date?.substring(0, 10),
                        onChange: (event) => setRecord((prev) => ({ ...prev, tx_date: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("footer", {
                    className: "l4p-drawer-actions",
                    children: [
                      record.id && /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("button", {
                        type: "button",
                        className: "l4p-button is-secondary",
                        onClick: remove,
                        children: "Delete"
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("button", {
                        type: "submit",
                        className: "l4p-button",
                        children: "Save"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this)
                ]
              }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("div", {
                className: "l4p-card l4p-readonly",
                children: [
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("p", {
                    children: "This transaction is read-only for volunteers."
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime8.jsxDEV("button", {
                    className: "l4p-button",
                    onClick: close,
                    children: "Close"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/NotificationsView.tsx
  var import_react7 = __toESM(require_react());
  var jsx_dev_runtime9 = __toESM(require_jsx_dev_runtime());
  var NotificationsView = ({ addToast, onUnreadChange }) => {
    const [items, setItems] = import_react7.useState([]);
    const [loading, setLoading] = import_react7.useState(true);
    const [unread, setUnread] = import_react7.useState(0);
    const [processing, setProcessing] = import_react7.useState(false);
    const loadNotifications = () => {
      setLoading(true);
      fetchJSON("notifications").then((response) => {
        setItems(response.items);
        setUnread(response.unread);
        onUnreadChange(response.unread);
      }).finally(() => setLoading(false));
    };
    import_react7.useEffect(() => {
      loadNotifications();
    }, []);
    import_react7.useEffect(() => {
      if (!loading && unread > 0) {
        markAll();
      }
    }, [loading]);
    const markAll = async () => {
      if (processing || items.length === 0) {
        return;
      }
      setProcessing(true);
      try {
        await fetchJSON("notifications/mark-all", { method: "POST" });
        const next = items.map((item) => ({ ...item, is_read: true }));
        setItems(next);
        setUnread(0);
        onUnreadChange(0);
      } catch (error) {
        addToast({ type: "error", message: "Could not mark notifications as read." });
      } finally {
        setProcessing(false);
      }
    };
    const markSingle = async (id) => {
      if (processing) {
        return;
      }
      setProcessing(true);
      try {
        const response = await fetchJSON(`notifications/${id}/read`, {
          method: "POST"
        });
        setItems((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
        setUnread(response.unread);
        onUnreadChange(response.unread);
      } catch (error) {
        addToast({ type: "error", message: "Could not mark notification as read." });
      } finally {
        setProcessing(false);
      }
    };
    if (loading) {
      return /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("div", {
        className: "l4p-skeleton",
        "aria-busy": "true"
      }, undefined, false, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("section", {
      className: "l4p-stack",
      children: [
        /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("header", {
          className: "l4p-toolbar",
          children: [
            /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("h1", {
              children: "Notifications"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("button", {
              className: "l4p-button is-secondary",
              onClick: markAll,
              disabled: processing || items.length === 0,
              children: "Mark All"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("ul", {
          className: "l4p-timeline",
          children: [
            items.map((item) => /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("li", {
              className: !item.is_read ? "is-unread" : "",
              children: [
                /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("span", {
                  className: "l4p-dot",
                  "aria-hidden": "true"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("div", {
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("p", {
                      children: item.message
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("time", {
                      dateTime: item.created_at,
                      children: new Date(item.created_at).toLocaleString()
                    }, undefined, false, undefined, this),
                    !item.is_read && /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("button", {
                      className: "l4p-link",
                      onClick: () => markSingle(item.id),
                      disabled: processing,
                      children: "Mark as Read"
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, item.id, true, undefined, this)),
            items.length === 0 && /* @__PURE__ */ jsx_dev_runtime9.jsxDEV("li", {
              className: "l4p-empty",
              children: "No notifications yet."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/CommunityView.tsx
  var import_react8 = __toESM(require_react());
  var jsx_dev_runtime10 = __toESM(require_jsx_dev_runtime());
  var CommunityView = ({ addToast }) => {
    const [posts, setPosts] = import_react8.useState([]);
    const [comments, setComments] = import_react8.useState({});
    const [loading, setLoading] = import_react8.useState(true);
    const [newPostDraft] = import_react8.useState(() => useDraft("community-new-post", ""));
    const [editingPost, setEditingPost] = import_react8.useState(null);
    const [postEditValue, setPostEditValue] = import_react8.useState("");
    const [editingComment, setEditingComment] = import_react8.useState(null);
    const [commentEditValue, setCommentEditValue] = import_react8.useState("");
    const isCoordinator = l4pApp.currentUser.roles.includes("l4p_coordinator");
    const isVolunteer = l4pApp.currentUser.roles.includes("l4p_volunteer");
    const volunteerPostingEnabled = Boolean(l4pApp.settings.volunteer_community_post);
    const canPost = isCoordinator || isVolunteer && volunteerPostingEnabled;
    const loadPosts = () => {
      fetchJSON("community/posts").then((items) => {
        setPosts(items);
        items.forEach((post) => loadComments(post.id));
        setEditingPost(null);
        setPostEditValue("");
        setEditingComment(null);
        setCommentEditValue("");
      }).catch(() => addToast({ type: "error", message: "Unable to load posts." })).finally(() => setLoading(false));
    };
    const loadComments = (postId) => {
      fetchJSON(`community/posts/${postId}/comments`).then((items) => {
        setComments((prev) => ({ ...prev, [postId]: items }));
      });
    };
    import_react8.useEffect(() => {
      loadPosts();
    }, []);
    const submitPost = async () => {
      if (!newPostDraft.value || !newPostDraft.value.trim()) {
        return;
      }
      try {
        await sendJSON("community/posts", "POST", { body: newPostDraft.value });
        newPostDraft.clear();
        addToast({ type: "success", message: "Post shared." });
        loadPosts();
      } catch (error) {
        addToast({ type: "error", message: "Could not publish post." });
      }
    };
    const submitPostEdit = async (postId) => {
      try {
        await sendJSON(`community/posts/${postId}`, "POST", { body: postEditValue });
        addToast({ type: "success", message: "Post updated." });
        setEditingPost(null);
        setPostEditValue("");
        loadPosts();
      } catch (error) {
        addToast({ type: "error", message: "Could not update post." });
      }
    };
    const deletePost = async (postId) => {
      try {
        await fetchJSON(`community/posts/${postId}`, { method: "DELETE" });
        addToast({ type: "success", message: "Post deleted." });
        loadPosts();
      } catch (error) {
        addToast({ type: "error", message: "Could not delete post." });
      }
    };
    const submitComment = async (postId, body, clear) => {
      if (!body.trim()) {
        return;
      }
      try {
        await sendJSON(`community/posts/${postId}/comments`, "POST", { body });
        clear();
        addToast({ type: "success", message: "Reply added." });
        loadComments(postId);
      } catch (error) {
        addToast({ type: "error", message: "Could not add reply." });
      }
    };
    const submitCommentEdit = async (commentId) => {
      try {
        await sendJSON(`community/comments/${commentId}`, "POST", { body: commentEditValue });
        addToast({ type: "success", message: "Comment updated." });
        setEditingComment(null);
        setCommentEditValue("");
        const postEntry = Object.entries(comments).find(([, commentList]) => commentList.some((comment) => comment.id === commentId));
        if (postEntry) {
          loadComments(Number(postEntry[0]));
        }
      } catch (error) {
        addToast({ type: "error", message: "Could not update comment." });
      }
    };
    const deleteComment = async (commentId, postId) => {
      try {
        await fetchJSON(`community/comments/${commentId}`, { method: "DELETE" });
        addToast({ type: "success", message: "Comment deleted." });
        if (editingComment === commentId) {
          setEditingComment(null);
          setCommentEditValue("");
        }
        loadComments(postId);
      } catch (error) {
        addToast({ type: "error", message: "Could not delete comment." });
      }
    };
    if (loading) {
      return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
        className: "l4p-skeleton",
        "aria-busy": "true"
      }, undefined, false, undefined, this);
    }
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("section", {
      className: "l4p-stack",
      children: [
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("header", {
          className: "l4p-toolbar",
          children: /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("h1", {
            children: "Community"
          }, undefined, false, undefined, this)
        }, undefined, false, undefined, this),
        canPost && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
          className: "l4p-card",
          children: [
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("h2", {
              children: "Share an update"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("textarea", {
              "aria-label": "Community post",
              value: newPostDraft.value || "",
              onChange: (event) => newPostDraft.update(event.target.value),
              placeholder: "Celebrate wins, share needs, or ask questions..."
            }, undefined, false, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
              className: "l4p-button",
              onClick: submitPost,
              children: "Post"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
          className: "l4p-stack",
          children: [
            posts.map((post) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("article", {
              className: "l4p-card",
              children: [
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("header", {
                  className: "l4p-card-header",
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
                      children: [
                        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("h3", {
                          children: post.author_name
                        }, undefined, false, undefined, this),
                        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("time", {
                          dateTime: post.created_at,
                          children: new Date(post.created_at).toLocaleString()
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    (isCoordinator || post.author_id === l4pApp.currentUser.id) && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
                      className: "l4p-inline-actions",
                      children: editingPost === post.id ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
                        children: [
                          /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                            className: "l4p-link",
                            onClick: () => submitPostEdit(post.id),
                            children: "Save"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                            className: "l4p-link",
                            onClick: () => {
                              setEditingPost(null);
                              setPostEditValue("");
                            },
                            children: "Cancel"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
                        children: [
                          /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                            className: "l4p-link",
                            onClick: () => {
                              setEditingPost(post.id);
                              setPostEditValue(post.body);
                            },
                            children: "Edit"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                            className: "l4p-link l4p-danger",
                            onClick: () => deletePost(post.id),
                            children: "Delete"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                editingPost === post.id ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("textarea", {
                  value: postEditValue,
                  onChange: (event) => setPostEditValue(event.target.value)
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("p", {
                  dangerouslySetInnerHTML: { __html: post.body }
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
                  className: "l4p-comments",
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("h3", {
                      children: "Replies"
                    }, undefined, false, undefined, this),
                    /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("ul", {
                      children: [
                        (comments[post.id] || []).map((comment) => /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("li", {
                          children: [
                            /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("header", {
                              className: "l4p-comment-meta",
                              children: [
                                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("strong", {
                                  children: comment.author_name
                                }, undefined, false, undefined, this),
                                /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("time", {
                                  dateTime: comment.created_at,
                                  children: new Date(comment.created_at).toLocaleString()
                                }, undefined, false, undefined, this)
                              ]
                            }, undefined, true, undefined, this),
                            editingComment === comment.id ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("textarea", {
                              value: commentEditValue,
                              onChange: (event) => setCommentEditValue(event.target.value)
                            }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("p", {
                              dangerouslySetInnerHTML: { __html: comment.body }
                            }, undefined, false, undefined, this),
                            (isCoordinator || comment.author_id === l4pApp.currentUser.id) && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
                              className: "l4p-inline-actions",
                              children: editingComment === comment.id ? /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
                                children: [
                                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                                    className: "l4p-link",
                                    onClick: () => submitCommentEdit(comment.id),
                                    children: "Save"
                                  }, undefined, false, undefined, this),
                                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                                    className: "l4p-link",
                                    onClick: () => {
                                      setEditingComment(null);
                                      setCommentEditValue("");
                                    },
                                    children: "Cancel"
                                  }, undefined, false, undefined, this)
                                ]
                              }, undefined, true, undefined, this) : /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(jsx_dev_runtime10.Fragment, {
                                children: [
                                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                                    className: "l4p-link",
                                    onClick: () => {
                                      setEditingComment(comment.id);
                                      setCommentEditValue(comment.body);
                                    },
                                    children: "Edit"
                                  }, undefined, false, undefined, this),
                                  /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
                                    className: "l4p-link l4p-danger",
                                    onClick: () => deleteComment(comment.id, post.id),
                                    children: "Delete"
                                  }, undefined, false, undefined, this)
                                ]
                              }, undefined, true, undefined, this)
                            }, undefined, false, undefined, this)
                          ]
                        }, comment.id, true, undefined, this)),
                        (comments[post.id] || []).length === 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("li", {
                          className: "l4p-empty",
                          children: "No replies yet."
                        }, undefined, false, undefined, this)
                      ]
                    }, undefined, true, undefined, this),
                    canPost && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV(ReplyBox, {
                      postId: post.id,
                      onSubmit: submitComment
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, post.id, true, undefined, this)),
            posts.length === 0 && /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
              className: "l4p-empty",
              children: "No posts yet."
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  var ReplyBox = ({ postId, onSubmit }) => {
    const draft = useDraft(`community-comment-${postId}`, "");
    return /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("div", {
      className: "l4p-reply-box",
      children: [
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("textarea", {
          "aria-label": "Reply",
          value: draft.value || "",
          onChange: (event) => draft.update(event.target.value),
          placeholder: "Add a reply"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime10.jsxDEV("button", {
          className: "l4p-button",
          onClick: () => onSubmit(postId, draft.value || "", draft.clear),
          children: "Reply"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/CrewView.tsx
  var import_react9 = __toESM(require_react());
  var jsx_dev_runtime11 = __toESM(require_jsx_dev_runtime());
  var emptyMember = {
    name: "",
    email: "",
    role: "l4p_volunteer",
    role_label: "Volunteer",
    skills: [],
    avatar: ""
  };
  var CrewView = ({ addToast }) => {
    const [members, setMembers] = import_react9.useState([]);
    const [loading, setLoading] = import_react9.useState(true);
    const [isEditing, setIsEditing] = import_react9.useState(false);
    const [member, setMember] = import_react9.useState(emptyMember);
    const [avatarPreview, setAvatarPreview] = import_react9.useState("");
    const [uploading, setUploading] = import_react9.useState(false);
    const isCoordinator = l4pApp.currentUser.roles.includes("l4p_coordinator");
    const loadCrew = () => {
      fetchJSON("crew").then((items) => setMembers(items)).finally(() => setLoading(false));
    };
    import_react9.useEffect(() => {
      loadCrew();
    }, []);
    const open = (item) => {
      if (!isCoordinator) {
        return;
      }
      setMember(item ? { ...item } : emptyMember);
      setAvatarPreview(item?.avatar || "");
      setIsEditing(true);
    };
    const close = () => {
      setIsEditing(false);
      setMember(emptyMember);
      setAvatarPreview("");
    };
    const save = async () => {
      try {
        const payload = { ...member };
        if (typeof avatarPreview === "string") {
          payload.avatar_url = avatarPreview;
        }
        delete payload.avatar;
        if (member.id) {
          await sendJSON(`crew/${member.id}`, "POST", payload);
        } else {
          await sendJSON("crew", "POST", payload);
        }
        addToast({ type: "success", message: "Crew updated." });
        close();
        loadCrew();
      } catch (error) {
        addToast({ type: "error", message: "Could not save crew member." });
      }
    };
    const uploadAvatar = async (file) => {
      if (file.size > 1024 * 1024) {
        addToast({ type: "error", message: "Avatar must be smaller than 1MB." });
        return;
      }
      if (!["image/png", "image/jpeg"].includes(file.type)) {
        addToast({ type: "error", message: "Avatar must be a JPG or PNG." });
        return;
      }
      const formData = new FormData;
      formData.append("avatar", file);
      setUploading(true);
      try {
        const response = await fetch(`${l4pApp.root}crew/upload`, {
          method: "POST",
          headers: {
            "X-WP-Nonce": l4pApp.nonce
          },
          body: formData
        });
        if (!response.ok) {
          throw new Error("Upload failed");
        }
        const data = await response.json();
        setAvatarPreview(data.url);
        setMember((prev) => ({ ...prev, avatar_url: data.url, avatar: data.url }));
        addToast({ type: "success", message: "Avatar uploaded." });
      } catch (error) {
        addToast({ type: "error", message: "Could not upload avatar." });
      } finally {
        setUploading(false);
      }
    };
    return /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("section", {
      className: "l4p-stack",
      children: [
        /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("header", {
          className: "l4p-toolbar",
          children: [
            /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("h1", {
              children: "Crew"
            }, undefined, false, undefined, this),
            isCoordinator && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("button", {
              className: "l4p-button",
              onClick: () => open(),
              children: "Add Member"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        loading ? /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("div", {
          className: "l4p-skeleton",
          "aria-busy": "true"
        }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("div", {
          className: "l4p-crew-grid",
          children: members.map((item) => /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("article", {
            className: "l4p-crew-card",
            children: [
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("img", {
                src: item.avatar,
                alt: "",
                role: "presentation"
              }, undefined, false, undefined, this),
              item.disabled && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("span", {
                className: "l4p-badge is-warning",
                children: "Disabled"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("h2", {
                children: item.name
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("p", {
                children: item.role_label
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("p", {
                children: item.email
              }, undefined, false, undefined, this),
              item.phone && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("p", {
                children: item.phone
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("div", {
                className: "l4p-skill-tags",
                children: (item.skills || []).map((skill) => /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("span", {
                  children: skill
                }, skill, false, undefined, this))
              }, undefined, false, undefined, this),
              isCoordinator && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("button", {
                className: "l4p-link",
                onClick: () => open(item),
                children: "Manage"
              }, undefined, false, undefined, this)
            ]
          }, item.id, true, undefined, this))
        }, undefined, false, undefined, this),
        isCoordinator && isEditing && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("div", {
          className: "l4p-drawer",
          role: "dialog",
          "aria-modal": "true",
          children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("div", {
            className: "l4p-drawer-content",
            children: [
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("header", {
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("h2", {
                    children: member.id ? "Edit Member" : "Add Member"
                  }, undefined, false, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("button", {
                    "aria-label": "Close",
                    onClick: close,
                    children: "×"
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("form", {
                onSubmit: (event) => {
                  event.preventDefault();
                  save();
                },
                children: [
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    children: [
                      "Name",
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("input", {
                        value: member.name || "",
                        onChange: (event) => setMember((prev) => ({ ...prev, name: event.target.value })),
                        required: true
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    children: [
                      "Email",
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("input", {
                        type: "email",
                        value: member.email || "",
                        onChange: (event) => setMember((prev) => ({ ...prev, email: event.target.value })),
                        required: true
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    children: [
                      "Phone",
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("input", {
                        value: member.phone || "",
                        onChange: (event) => setMember((prev) => ({ ...prev, phone: event.target.value }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    className: "l4p-avatar-upload",
                    children: [
                      "Avatar",
                      avatarPreview ? /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("img", {
                        src: avatarPreview,
                        alt: "",
                        className: "l4p-avatar-preview"
                      }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("span", {
                        className: "l4p-empty",
                        children: "No avatar selected."
                      }, undefined, false, undefined, this),
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("input", {
                        type: "file",
                        accept: "image/png,image/jpeg",
                        onChange: (event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            uploadAvatar(file);
                          }
                        },
                        disabled: uploading
                      }, undefined, false, undefined, this),
                      avatarPreview && /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("button", {
                        type: "button",
                        className: "l4p-link",
                        onClick: () => {
                          setAvatarPreview("");
                          setMember((prev) => ({ ...prev, avatar_url: "", avatar: "" }));
                        },
                        children: "Remove Avatar"
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    children: [
                      "Role",
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("select", {
                        value: member.role,
                        onChange: (event) => setMember((prev) => ({ ...prev, role: event.target.value })),
                        children: [
                          /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("option", {
                            value: "l4p_volunteer",
                            children: "Volunteer"
                          }, undefined, false, undefined, this),
                          /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("option", {
                            value: "l4p_coordinator",
                            children: "Coordinator"
                          }, undefined, false, undefined, this)
                        ]
                      }, undefined, true, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    children: [
                      "Skills (comma separated)",
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("input", {
                        value: (member.skills || []).join(", "),
                        onChange: (event) => setMember((prev) => ({ ...prev, skills: event.target.value.split(",").map((skill) => skill.trim()).filter(Boolean) }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("label", {
                    children: [
                      "Disabled",
                      /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("input", {
                        type: "checkbox",
                        checked: Boolean(member.disabled),
                        onChange: (event) => setMember((prev) => ({ ...prev, disabled: event.target.checked }))
                      }, undefined, false, undefined, this)
                    ]
                  }, undefined, true, undefined, this),
                  /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("footer", {
                    children: /* @__PURE__ */ jsx_dev_runtime11.jsxDEV("button", {
                      type: "submit",
                      className: "l4p-button",
                      children: "Save"
                    }, undefined, false, undefined, this)
                  }, undefined, false, undefined, this)
                ]
              }, undefined, true, undefined, this)
            ]
          }, undefined, true, undefined, this)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/views/SettingsView.tsx
  var import_react10 = __toESM(require_react());
  var jsx_dev_runtime12 = __toESM(require_jsx_dev_runtime());
  var SettingsView = ({ addToast }) => {
    const [settings, setSettings] = import_react10.useState({ ...l4pApp.settings });
    const [saving, setSaving] = import_react10.useState(false);
    const [logoUrl, setLogoUrl] = import_react10.useState(l4pApp.settings.logo_url || "");
    const notifications = settings.notifications_email || { enabled: false, events: {} };
    const handleChange = (key, value) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    };
    const updateNotificationSetting = (eventKey, field, value) => {
      setSettings((prev) => {
        const current = prev.notifications_email || { enabled: false, events: {} };
        const eventSettings = current.events?.[eventKey] || { enabled: false, subject: "", body: "" };
        const nextEvents = {
          ...current.events,
          [eventKey]: {
            ...eventSettings,
            [field]: value
          }
        };
        return {
          ...prev,
          notifications_email: {
            ...current,
            events: nextEvents
          }
        };
      });
    };
    const openMedia = () => {
      const mediaFrame = window.wp?.media({
        title: "Select logo",
        multiple: false,
        library: { type: ["image"] }
      });
      if (!mediaFrame) {
        return;
      }
      mediaFrame.on("select", () => {
        const attachment = mediaFrame.state().get("selection").first().toJSON();
        handleChange("logo_id", attachment.id);
        handleChange("logo_url", attachment.url);
        setLogoUrl(attachment.url);
      });
      mediaFrame.open();
    };
    const handleSubmit = async (event) => {
      event.preventDefault();
      setSaving(true);
      try {
        const updated = await sendJSON("settings", "POST", settings);
        setSettings(updated);
        addToast({ type: "success", message: "Settings saved." });
      } catch (error) {
        addToast({ type: "error", message: "Could not save settings." });
      } finally {
        setSaving(false);
      }
    };
    return /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("section", {
      className: "l4p-card",
      children: [
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("h1", {
          children: "Settings"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("form", {
          onSubmit: handleSubmit,
          className: "l4p-settings-grid",
          children: [
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Brand Name",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  value: settings.brand_name,
                  onChange: (event) => handleChange("brand_name", event.target.value)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("div", {
              className: "l4p-settings-logo",
              children: [
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("span", {
                  children: "Logo"
                }, undefined, false, undefined, this),
                logoUrl ? /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("img", {
                  src: logoUrl,
                  alt: "",
                  className: "l4p-logo-image"
                }, undefined, false, undefined, this) : /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("p", {
                  className: "l4p-empty",
                  children: "No logo selected."
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("div", {
                  className: "l4p-toolbar-actions",
                  children: [
                    /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("button", {
                      type: "button",
                      className: "l4p-button",
                      onClick: openMedia,
                      children: "Select Logo"
                    }, undefined, false, undefined, this),
                    logoUrl && /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("button", {
                      type: "button",
                      className: "l4p-link",
                      onClick: () => {
                        handleChange("logo_id", 0);
                        handleChange("logo_url", "");
                        setLogoUrl("");
                      },
                      children: "Remove"
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Primary Color",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  value: settings.primary_color,
                  onChange: (event) => handleChange("primary_color", event.target.value)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Accent Color",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  value: settings.accent_color,
                  onChange: (event) => handleChange("accent_color", event.target.value)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Timezone",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  value: settings.timezone,
                  onChange: (event) => handleChange("timezone", event.target.value)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Currency",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  value: settings.currency,
                  onChange: (event) => handleChange("currency", event.target.value)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Allow post images",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  type: "checkbox",
                  checked: Boolean(settings.allow_post_images),
                  onChange: (event) => handleChange("allow_post_images", event.target.checked)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Volunteers can post in Community",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  type: "checkbox",
                  checked: Boolean(settings.volunteer_community_post),
                  onChange: (event) => handleChange("volunteer_community_post", event.target.checked)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Volunteers can create tasks",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  type: "checkbox",
                  checked: Boolean(settings.volunteer_create_tasks),
                  onChange: (event) => handleChange("volunteer_create_tasks", event.target.checked)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
              children: [
                "Enable funding CSV export",
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                  type: "checkbox",
                  checked: Boolean(settings.funding_csv_export),
                  onChange: (event) => handleChange("funding_csv_export", event.target.checked)
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("fieldset", {
              className: "l4p-settings-notifications",
              children: [
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("legend", {
                  children: "Email Notifications"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
                  children: [
                    "Enable Emails",
                    /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                      type: "checkbox",
                      checked: Boolean(notifications.enabled),
                      onChange: (event) => setSettings((prev) => ({
                        ...prev,
                        notifications_email: {
                          ...notifications,
                          enabled: event.target.checked
                        }
                      }))
                    }, undefined, false, undefined, this)
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("div", {
                  className: "l4p-settings-notification-grid",
                  children: [
                    { key: "task_assigned", label: "Task assigned" },
                    { key: "funding_added", label: "New funding entry" },
                    { key: "post_reply", label: "New community reply" },
                    { key: "new_member", label: "New member added" }
                  ].map((event) => {
                    const eventSettings = notifications.events?.[event.key] || { enabled: false, subject: "", body: "" };
                    return /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("div", {
                      className: "l4p-notification-card",
                      children: [
                        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("h3", {
                          children: event.label
                        }, undefined, false, undefined, this),
                        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
                          children: [
                            "Enabled",
                            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                              type: "checkbox",
                              checked: Boolean(eventSettings.enabled),
                              onChange: (e) => updateNotificationSetting(event.key, "enabled", e.target.checked)
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this),
                        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
                          children: [
                            "Subject",
                            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("input", {
                              value: eventSettings.subject || "",
                              onChange: (e) => updateNotificationSetting(event.key, "subject", e.target.value)
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this),
                        /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("label", {
                          children: [
                            "Body",
                            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("textarea", {
                              value: eventSettings.body || "",
                              onChange: (e) => updateNotificationSetting(event.key, "body", e.target.value)
                            }, undefined, false, undefined, this)
                          ]
                        }, undefined, true, undefined, this)
                      ]
                    }, event.key, true, undefined, this);
                  })
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("footer", {
              children: /* @__PURE__ */ jsx_dev_runtime12.jsxDEV("button", {
                type: "submit",
                className: "l4p-button",
                disabled: saving,
                children: saving ? "Saving…" : "Save Settings"
              }, undefined, false, undefined, this)
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };

  // assets/src/index.tsx
  var jsx_dev_runtime13 = __toESM(require_jsx_dev_runtime());
  import_chart3.Chart.register(import_chart3.ArcElement, import_chart3.Tooltip, import_chart3.Legend, import_chart3.LineElement, import_chart3.PointElement, import_chart3.CategoryScale, import_chart3.LinearScale);
  var views = [
    { key: "dashboard", label: "Dashboard" },
    { key: "tasks", label: "Tasks" },
    { key: "funding", label: "Funding" },
    { key: "notifications", label: "Notifications" },
    { key: "community", label: "Community" },
    { key: "crew", label: "Crew" },
    { key: "settings", label: "Settings" }
  ];
  var initialState = {
    activeView: "dashboard",
    toasts: [],
    notificationsUnread: l4pApp.notifications && l4pApp.notifications.unread || 0
  };
  var App = () => {
    const [state, setState] = import_react11.useState(initialState);
    const [tokens] = import_react11.useState(l4pApp.designTokens);
    import_react11.useEffect(() => {
      const root = document.documentElement;
      Object.entries(tokens).forEach(([key, value]) => {
        root.style.setProperty(`--l4p-${key}`, value);
      });
    }, [tokens]);
    const addToast = (toast) => {
      setState((prev) => ({
        ...prev,
        toasts: [...prev.toasts, { id: Date.now(), ...toast }]
      }));
    };
    const removeToast = (id) => {
      setState((prev) => ({
        ...prev,
        toasts: prev.toasts.filter((toast) => toast.id !== id)
      }));
    };
    const menu = import_react11.useMemo(() => {
      return views.filter((item) => {
        if (item.key === "funding") {
          return l4pApp.currentUser.roles.includes("l4p_coordinator") || l4pApp.currentUser.roles.includes("administrator");
        }
        if (item.key === "settings") {
          return l4pApp.currentUser.roles.includes("l4p_coordinator");
        }
        return true;
      });
    }, []);
    const renderView = () => {
      switch (state.activeView) {
        case "dashboard":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(DashboardView, {
            addToast
          }, undefined, false, undefined, this);
        case "tasks":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(TasksView, {
            addToast
          }, undefined, false, undefined, this);
        case "funding":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(FundingView, {
            addToast
          }, undefined, false, undefined, this);
        case "notifications":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(NotificationsView, {
            addToast,
            onUnreadChange: (count) => setState((prev) => ({ ...prev, notificationsUnread: count }))
          }, undefined, false, undefined, this);
        case "community":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(CommunityView, {
            addToast
          }, undefined, false, undefined, this);
        case "crew":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(CrewView, {
            addToast
          }, undefined, false, undefined, this);
        case "settings":
          return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(SettingsView, {
            addToast
          }, undefined, false, undefined, this);
        default:
          return null;
      }
    };
    return /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("div", {
      className: "l4p-app",
      children: [
        /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("aside", {
          className: "l4p-sidebar",
          children: [
            /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("div", {
              className: "l4p-branding",
              children: [
                /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("span", {
                  className: "l4p-logo",
                  "aria-hidden": "true",
                  children: "\uD83C\uDF89"
                }, undefined, false, undefined, this),
                /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("span", {
                  className: "l4p-brand-text",
                  children: l4pApp.settings.brand_name
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("nav", {
              "aria-label": "Local Picnic navigation",
              className: "l4p-nav",
              children: menu.map((item) => /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("button", {
                className: import_classnames.default("l4p-nav-button", {
                  "is-active": state.activeView === item.key
                }),
                onClick: () => setState((prev) => ({ ...prev, activeView: item.key })),
                children: [
                  item.label,
                  item.key === "notifications" && state.notificationsUnread > 0 && /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("span", {
                    className: "l4p-nav-badge",
                    "aria-label": `${state.notificationsUnread} unread notifications`,
                    children: state.notificationsUnread
                  }, undefined, false, undefined, this)
                ]
              }, item.key, true, undefined, this))
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("main", {
          className: "l4p-content",
          "aria-live": "polite",
          children: renderView()
        }, undefined, false, undefined, this),
        /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("div", {
          className: "l4p-toasts",
          role: "status",
          "aria-live": "assertive",
          children: state.toasts.map((toast) => /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("div", {
            className: import_classnames.default("l4p-toast", `is-${toast.type}`),
            children: [
              /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("span", {
                children: toast.message
              }, undefined, false, undefined, this),
              /* @__PURE__ */ jsx_dev_runtime13.jsxDEV("button", {
                "aria-label": "Dismiss notification",
                onClick: () => removeToast(toast.id),
                children: "×"
              }, undefined, false, undefined, this)
            ]
          }, toast.id, true, undefined, this))
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  };
  var root = document.getElementById("l4p-portal-app") || document.getElementById("l4p-admin-app");
  if (root) {
    const container = import_client.createRoot(root);
    container.render(/* @__PURE__ */ jsx_dev_runtime13.jsxDEV(import_react11.StrictMode, {
      children: /* @__PURE__ */ jsx_dev_runtime13.jsxDEV(App, {}, undefined, false, undefined, this)
    }, undefined, false, undefined, this));
  }
})();
