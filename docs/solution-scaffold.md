# Solution Scaffold

## Goal
Stand up a minimal ASP.NET Core API + Vite React frontend skeleton. The React UI is included in the VS solution as a **Solution Folder** (not an `.esproj`, per global rules) so it shows up alongside the API but builds via `npm` from the terminal.

## Decisions
- **UI is a Solution Folder, not a project.** Per global rule, never create `.esproj` files. `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html` get added as solution items.
- **No EF Core / DB / auth in the skeleton.** User said "basic skeleton" — keep scope minimal; these get layered in later.
- **Target framework: .NET 9, `<LangVersion>13`.** Confirmed by user 2026-04-30. The "C# 9" in the original ask was shorthand for .NET 9.
- **API style: controllers.** Confirmed by user 2026-04-30. Reason: app will grow real endpoints, controller structure scales better than inline minimal-API endpoints past ~10–15 routes.
- **Frontend: TypeScript with `strict: true`.** Confirmed by user 2026-04-30. All `strict` family flags (`strictNullChecks`, `noImplicitAny`, `strictFunctionTypes`, etc.) on; `noUncheckedIndexedAccess` also on for safer indexed reads.
- **Names: defaults accepted.** Confirmed by user 2026-04-30. Solution = `EnlilFinancialPlanning.sln`, API project = `EnlilFinancialPlanning.Api`, UI folder = `client/`.

## Status
**Shipped 2026-04-30.** Initial skeleton scaffolded. Updated 2026-04-30 with Vite auto-launch + EF Core wiring.

## Follow-up changes (2026-04-30)
- **Vite auto-launches with the API.** Added `Microsoft.AspNetCore.SpaProxy` package + MSBuild props (`SpaRoot`, `SpaProxyServerUrl`, `SpaProxyLaunchCommand=npm run dev`). `launchSettings.json` sets `ASPNETCORE_HOSTINGSTARTUPASSEMBLIES=Microsoft.AspNetCore.SpaProxy` so `dotnet run` (or F5 in VS) starts both the API and Vite dev server in one shot. Also added a `DebugEnsureNodeEnv` MSBuild target that runs `npm install` automatically when `client/node_modules` is missing.
- **EF Core wired.** Added `Microsoft.EntityFrameworkCore.SqlServer` + `Design` + `Tools` (Design and Tools as `PrivateAssets="all"` per global rule). Created `Data/AppDbContext.cs` (no `DbSet<>`s yet — entities to be added per feature). Registered in `Program.cs` reading `ConnectionStrings:DefaultConnection` from `appsettings.json`.
- **Removed `appsettings.Development.json`.** Per user — dev settings won't differ from base.

## Port + CORS adjustments (2026-04-30)
- **Ports moved off defaults to avoid local conflicts.** SPA (Vite) on **`http://localhost:61350`**, API on **`http://localhost:61351`**. Updated in `vite.config.ts`, `launchSettings.json`, and `<SpaProxyServerUrl>` in the csproj. `strictPort: true` on Vite so it fails fast if the port is taken instead of silently picking another.
- **HTTPS profile dropped from `launchSettings.json`.** User specified one backend port; HTTP-only on 61351. `app.UseHttpsRedirection()` removed from `Program.cs` to avoid runtime warnings about no HTTPS port. Add back if/when an HTTPS dev cert is wanted.
- **Dev CORS policy re-added.** Allows origin `http://localhost:61350` with any header/method, applied only in `app.Environment.IsDevelopment()`. Reason: even though the happy path is "SPA fetches `/api/*` same-origin → Vite proxies server-side to API," any direct browser-to-API request (Swagger UI from another origin, dev tooling, an absolute URL slipping into the SPA) hits CORS. Adding the policy is defense-in-depth so the user stops seeing the error. Vite keeps `cors: true` (its default) so HMR and asset serving stay unblocked.

## Open security item
- **Connection-string secret in `appsettings.json`.** The Azure SQL admin password is currently in plaintext in `appsettings.json`. Once the directory becomes a git repo and gets pushed, the credential is exposed in history. Recommended fix: keep the `Server=...;Initial Catalog=...;` shape in `appsettings.json` but pull `User ID`/`Password` from User Secrets (`dotnet user-secrets set ...`) or env vars and stitch them in `Program.cs` with `SqlConnectionStringBuilder`. Tracked here until addressed.

## Layout
```
EnlilFinancialPlanningPersonal/
├── EnlilFinancialPlanning.sln          (API project + `client` solution folder + `docs` solution folder)
├── EnlilFinancialPlanning.Api/         (.NET 9 Web API, controllers, OpenAPI in dev)
│   ├── Controllers/HealthController.cs
│   ├── Properties/launchSettings.json  (HTTP 5174, HTTPS 7174)
│   └── Program.cs                      (CORS allows http://localhost:5173 in dev)
├── client/                             (Vite + React 18 + TS strict + Reactstrap)
│   ├── src/
│   │   ├── App.tsx                     (calls /api/health, shows status)
│   │   ├── main.tsx
│   │   └── UI/functions/render-skeleton-button-functions.tsx
│   ├── package.json, vite.config.ts (proxy /api → :5174)
│   └── tsconfig.json + tsconfig.app.json + tsconfig.node.json
├── docs/solution-scaffold.md           (this doc)
└── CLAUDE.md
```

## Open questions
- _none_

## Out of scope
- Authentication / identity
- Database / EF Core wiring
- CI/CD
- Reactstrap component examples beyond a single placeholder page
