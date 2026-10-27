import { afterEach, vi } from "vitest";

/** The address that the mocked router reports. A test sets it before it mounts a page. */
export const routerState = { pathname: "/", search: "" };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), back: vi.fn() }),
  usePathname: () => routerState.pathname,
  useSearchParams: () => new URLSearchParams(routerState.search),
}));

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  localStorage.clear();
  routerState.pathname = "/";
  routerState.search = "";
});
