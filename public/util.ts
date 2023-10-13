type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Update User",
    endpoint: "/api/users",
    method: "PATCH",
    fields: { update: { username: "input", password: "input" } },
  },
  {
    name: "Delete User",
    endpoint: "/api/users",
    method: "DELETE",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  // FOLLOW
  {
    name: "Get Follow Relations",
    endpoint: "/api/follow",
    method: "GET",
    fields: { },
  },
  {
    name: "Stop Following",
    endpoint: "/api/follow/following/:target",
    method: "DELETE",
    fields: { target: "input" },
  },
  {
    name: "Remove Follower",
    endpoint: "/api/follow/followers/:target",
    method: "DELETE",
    fields: { target: "input" },
  },
  {
    name: "Get Follow Requests",
    endpoint: "/api/follow/requests",
    method: "GET",
    fields: { },
  },
  {
    name: "Send Follow Request",
    endpoint: "/api/follow/requests/:to",
    method: "POST",
    fields: { to: "input" },
  },
  {
    name: "Remove Follow Request",
    endpoint: "/api/follow/requests/:to",
    method: "DELETE",
    fields: { to: "input" },
  },
  {
    name: "Accept Follow Request",
    endpoint: "/api/follow/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Reject Follow Request",
    endpoint: "/api/follow/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  // POSTS
  {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },
  // FEED
  {
    name: "Get Starred Feed",
    endpoint: "/api/feed/starredFeed",
    method: "GET",
    fields: { },
  },
  {
    name: "Get Not Starred Feed",
    endpoint: "/api/feed/notStarredFeed",
    method: "GET",
    fields: { },
  },
  {
    name: "Remove From Feed",
    endpoint: "/api/feed/posts/:postID",
    method: "DELETE",
    fields: { postID: "input"},
  },
  {
    name: "Get Starred",
    endpoint: "/api/feed/stars",
    method: "GET",
    fields: { },
  },
  {
    name: "Add Star",
    endpoint: "/api/feed/stars/:target",
    method: "POST",
    fields: { target: "input"},
  },
  {
    name: "Remove Star",
    endpoint: "/api/feed/stars/:target",
    method: "DELETE",
    fields: { target: "input"},
  },
  // NOTIFICATIONS
  {
    name: "Get Notifications",
    endpoint: "/api/notifications",
    method: "GET",
    fields: {  },
  },
  {
    name: "Add Notification",
    endpoint: "/api/notifications/:username",
    method: "POST",
    fields: { username: "input", content: "input"},
  },
  {
    name: "Delete Notification",
    endpoint: "/api/notifications/:notificationID",
    method: "DELETE",
    fields: { notificationID: "input" },
  },
  {
    name: "Read Notification",
    endpoint: "/api/notifications/:notificationID",
    method: "PUT",
    fields: { notificationID: "input" },
  },
  // MONITORS
  {
    name: "Get Monitor Requests",
    endpoint: "/api/monitorRelations/requests",
    method: "GET",
    fields: { },
  },
  {
    name: "Send Monitor Request",
    endpoint: "/api/monitorRelations/requests/:to",
    method: "POST",
    fields: { to: "input", },
  },
  {
    name: "Remove Monitor Request",
    endpoint: "/api/monitorRelations/requests/:to",
    method: "DELETE",
    fields: { to: "input", },
  },
  {
    name: "Accept Monitor Request",
    endpoint: "/api/monitorRelations/requests/accept/:from",
    method: "PUT",
    fields: { from: "input", },
  },
  {
    name: "Reject Monitor Request",
    endpoint: "/api/monitorRelations/requests/reject/:from",
    method: "PUT",
    fields: { from: "input", },
  },
  {
    name: "Get Monitor Relations",
    endpoint: "/api/monitorRelations",
    method: "GET",
    fields: { },
  },
  {
    name: "Stop Monitoring",
    endpoint: "/api/monitorRelations/monitoring/:target",
    method: "DELETE",
    fields: { target: "input" },
  },
  {
    name: "Remove Monitor",
    endpoint: "/api/monitorRelations/monitor/:target",
    method: "DELETE",
    fields: { target: "input" },
  },
  // SCREENTIME
  {
    name: "Get Time Used",
    endpoint: "/api/screenTime/:username/:feature",
    method: "GET",
    fields: { 
      username: "input",
      feature: "input",
      day: "input",
      month: "input",
      year: "input",
   },
  },
  {
    name: "Set Time Used",
    endpoint: "/api/screenTime/:username/:feature",
    method: "POST",
    fields: { 
      username: "input",
      feature: "input",
      time: "input",
      day: "input",
      month: "input",
      year: "input",
   },
  },
  {
    name: "Add Time Restriction",
    endpoint: "/api/restrictions/:feature",
    method: "POST",
    fields: { 
      feature: "input",
      limit: "input",
   },
  },
  {
    name: "Update Time Restriction",
    endpoint: "/api/restrictions/:feature",
    method: "PUT",
    fields: { 
      feature: "input",
      limit: "input",
   },
  },
  {
    name: "Remove Time Restriction",
    endpoint: "/api/restrictions/:feature",
    method: "DELETE",
    fields: { 
      feature: "input",
   },
  },
  {
    name: "Check Time Restriction",
    endpoint: "/api/restrictions/:feature",
    method: "GET",
    fields: { 
      feature: "input",
   },
  },
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
