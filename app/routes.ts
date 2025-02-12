import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/sign-in/sign-in.tsx"),
  route("logout", "routes/logout/logout.tsx"),
  ...prefix("checkin", [
    layout("routes/checkin/checkin-layout.tsx", [
      index("routes/checkin/checkin.tsx"),
      route("preview", "routes/checkin/preview.tsx"),
      route("preview/print", "routes/checkin/print.tsx"),
      route("search", "routes/checkin/search.tsx"),
      route("qrcode", "routes/checkin/qrcode.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
