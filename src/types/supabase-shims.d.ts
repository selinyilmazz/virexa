/**
 * TEMPORARY compile-time shim for @supabase/supabase-js and @supabase/ssr.
 *
 * WHY THIS FILE EXISTS: this sandbox has no network access, so
 * `npm install` cannot fetch these packages here. They are already
 * listed as real dependencies in package.json - the moment you run
 * `npm install` in an environment with network access, DELETE THIS FILE.
 * TypeScript will then resolve the real, published types from
 * node_modules, which are more precise than what's declared below and
 * should take priority.
 *
 * Only the surface actually used by src/lib/supabase, src/repositories,
 * src/hooks, and the auth/profile/settings/bookmark/article-storage
 * components is declared here - this is not a full type definition for
 * either package. In particular, the Postgrest query builder below
 * (`from`, `select`, `eq`, `insert`, `update`, `upsert`, `delete`, and
 * the filter methods added for the Article Storage layer) is
 * intentionally simplified compared to the real @supabase/postgrest-js
 * types (e.g. it doesn't distinguish `Insert` vs `Update` shapes as
 * strictly, and every filter method returns the same builder type
 * rather than narrowing). It type-checks the query patterns actually
 * used in this codebase; the real package will type-check them more
 * precisely without any code changes on our side.
 *
 * Operations phase addition: `auth.admin` (`listUsers`/`getUserById`/
 * `updateUserById`) - the surface Admin Users Management
 * (`src/services/admin/admin-user-service.ts`,
 * `src/app/api/admin/users/[id]/route.ts`) needs to read/manage
 * `auth.users` (email, role, verification, last sign-in, ban status).
 * Same "only what's actually used" scope as the rest of this file.
 *
 * News Engine & Search production-readiness phase addition: `rpc()` on
 * `SupabaseClient` - the surface `ArticleRepository.fullTextSearch()`
 * (`src/repositories/article-repository.ts`) needs to call the
 * `search_articles_fts` Postgres function (see
 * `supabase/migrations/0004_full_text_search.sql`) for ranked,
 * server-side full-text search. Returns the same `PostgrestFilterBuilder`
 * every `.from(...)` query already returns, since a `returns table (...)`
 * SQL function behaves like a regular queryable result set through
 * PostgREST - this keeps `rpc()` usage syntactically consistent with
 * the rest of this file's query patterns.
 *
 * Google Auth feature addition: `Provider`, `auth.signInWithOAuth()`, and
 * `auth.exchangeCodeForSession()` - the surface
 * `src/lib/supabase/oauth.ts` (client-side OAuth trigger) and
 * `src/app/auth/callback/route.ts` (server-side code exchange) need.
 * `Provider` is a deliberately small subset of Supabase's real (much
 * larger) union - only the ids this app actually references (today:
 * `"google"`; the commented-out ids in `oauth.ts` for future GitHub/
 * Discord/Microsoft support) - add more here if/when those are enabled.
 */
declare module "@supabase/supabase-js" {
  export interface User {
    id: string;
    email?: string;
    user_metadata: Record<string, unknown>;
    /** Only settable via the service role / Supabase Admin API - never editable by the user themselves. This is what Admin Authorization checks (`role === "admin"`) - see `src/lib/admin/is-admin.ts`. */
    app_metadata: Record<string, unknown>;
    created_at: string;
    last_sign_in_at?: string;
    email_confirmed_at?: string;
    /** Set (to a future timestamp) while the user is banned/suspended via `auth.admin.updateUserById(id, { ban_duration })`; absent or in the past otherwise. */
    banned_until?: string;
    [key: string]: unknown;
  }

  export interface Session {
    access_token: string;
    refresh_token: string;
    expires_at?: number;
    expires_in: number;
    token_type: string;
    user: User;
  }

  export interface AuthError {
    name: string;
    message: string;
    status?: number;
  }

  export type AuthChangeEvent =
    | "INITIAL_SESSION"
    | "SIGNED_IN"
    | "SIGNED_OUT"
    | "TOKEN_REFRESHED"
    | "USER_UPDATED"
    | "PASSWORD_RECOVERY";

  export interface AuthResponse {
    data: { session: Session | null; user: User | null };
    error: AuthError | null;
  }

  /** See this file's "Google Auth feature addition" note above. */
  export type Provider = "google" | "github" | "discord" | "azure";

  export interface OAuthResponse {
    data: { provider: Provider; url: string | null };
    error: AuthError | null;
  }

  export interface PostgrestError {
    message: string;
    details: string;
    hint: string;
    code: string;
  }

  export interface PostgrestSingleResponse<Row> {
    data: Row | null;
    error: PostgrestError | null;
  }

  export interface PostgrestResponse<Row> {
    data: Row[] | null;
    error: PostgrestError | null;
    /** Only populated when `select(..., { count: "exact" | "planned" | "estimated" })` was used - see ArticleRepository.search() for pagination. */
    count: number | null;
  }

  /**
   * Chainable filter/query builder. Every filter method returns the same
   * builder so filters chain freely (`.eq(...).gte(...).order(...)`);
   * awaiting the builder directly (it's `PromiseLike`) resolves a
   * `PostgrestResponse`.
   */
  export interface PostgrestFilterBuilder<Row> extends PromiseLike<PostgrestResponse<Row>> {
    select(columns?: string, options?: { count?: "exact" | "planned" | "estimated"; head?: boolean }): PostgrestFilterBuilder<Row>;
    eq(column: string, value: unknown): PostgrestFilterBuilder<Row>;
    neq(column: string, value: unknown): PostgrestFilterBuilder<Row>;
    in(column: string, values: unknown[]): PostgrestFilterBuilder<Row>;
    gte(column: string, value: unknown): PostgrestFilterBuilder<Row>;
    lte(column: string, value: unknown): PostgrestFilterBuilder<Row>;
    ilike(column: string, pattern: string): PostgrestFilterBuilder<Row>;
    /** Array/jsonb containment - e.g. `.contains("tags", ["AI"])`. */
    contains(column: string, value: unknown): PostgrestFilterBuilder<Row>;
    /** Raw PostgREST `or` filter string, e.g. `.or("url.eq.X,slug.eq.Y")`. */
    or(filters: string): PostgrestFilterBuilder<Row>;
    order(column: string, options?: { ascending?: boolean }): PostgrestFilterBuilder<Row>;
    /** Inclusive zero-based row range, for pagination - equivalent to SQL LIMIT/OFFSET. */
    range(from: number, to: number): PostgrestFilterBuilder<Row>;
    limit(count: number): PostgrestFilterBuilder<Row>;
    single(): PromiseLike<PostgrestSingleResponse<Row>>;
    maybeSingle(): PromiseLike<PostgrestSingleResponse<Row | null>>;
  }

  export interface PostgrestQueryBuilder<TableDef extends { Row: unknown; Insert: unknown; Update: unknown }>
    extends PostgrestFilterBuilder<TableDef["Row"]> {
    insert(values: TableDef["Insert"] | TableDef["Insert"][]): PostgrestFilterBuilder<TableDef["Row"]>;
    update(values: TableDef["Update"]): PostgrestFilterBuilder<TableDef["Row"]>;
    upsert(
      values: TableDef["Insert"] | TableDef["Insert"][],
      options?: { onConflict?: string; ignoreDuplicates?: boolean }
    ): PostgrestFilterBuilder<TableDef["Row"]>;
    delete(): PostgrestFilterBuilder<TableDef["Row"]>;
  }

  export interface GoTrueAdminApi {
    /** Defaults to 50 users/page; pass `perPage` for a larger bounded fetch (see `admin-user-service.ts`). `total`/`lastPage`/`nextPage` describe the FULL user set, not just this page. */
    listUsers(params?: { page?: number; perPage?: number }): Promise<{
      data: { users: User[]; total: number; lastPage: number; nextPage: number | null };
      error: AuthError | null;
    }>;
    getUserById(uid: string): Promise<{ data: { user: User | null }; error: AuthError | null }>;
    /** `ban_duration`: a Postgres interval string (e.g. `"876000h"`, Supabase's own ~100-year "effectively permanent" example) or `"none"` to lift a ban. */
    updateUserById(
      uid: string,
      attributes: { app_metadata?: Record<string, unknown>; ban_duration?: string }
    ): Promise<{ data: { user: User | null }; error: AuthError | null }>;
    /** Permanently deletes an auth user (`src/app/api/admin/users/[id]/route.ts` DELETE handler - Admin "Delete User" action). */
    deleteUser(uid: string): Promise<{ data: { user: User | null }; error: AuthError | null }>;
  }

  type AnyDatabase = {
    public: {
      Tables: Record<string, { Row: unknown; Insert: unknown; Update: unknown }>;
    };
  };

  export interface SupabaseClient<Db extends AnyDatabase = AnyDatabase> {
    auth: {
      getSession(): Promise<{ data: { session: Session | null }; error: AuthError | null }>;
      getUser(): Promise<{ data: { user: User | null }; error: AuthError | null }>;
      signInWithPassword(credentials: { email: string; password: string }): Promise<AuthResponse>;
      signUp(credentials: {
        email: string;
        password: string;
        options?: { data?: Record<string, unknown> };
      }): Promise<AuthResponse>;
      signOut(): Promise<{ error: AuthError | null }>;
      updateUser(attributes: { email?: string; password?: string; data?: Record<string, unknown> }): Promise<AuthResponse>;
      /** Sends a password-recovery email whose link redirects to `options.redirectTo` (used by both `/forgot-password` and the admin "Reset Password" action). Succeeds even for an unregistered email - see `ForgotPasswordForm`'s doc comment for why. */
      resetPasswordForEmail(email: string, options?: { redirectTo?: string }): Promise<{ error: AuthError | null }>;
      /** Starts a redirect-based OAuth flow (`options.redirectTo` is where the provider sends the browser back to after consent - see `src/app/auth/callback/route.ts`). The browser navigates away to `data.url` before this promise's resolution is ever observed on a successful call; `error` is only populated for a failure to even START the flow (provider disabled, network error). */
      signInWithOAuth(params: {
        provider: Provider;
        options?: { redirectTo?: string; queryParams?: Record<string, string> };
      }): Promise<OAuthResponse>;
      /** Exchanges the one-time `code` param `/auth/callback` receives for a real session, setting the auth cookies via whichever client (browser/server) this was called on. */
      exchangeCodeForSession(code: string): Promise<AuthResponse>;
      onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): {
        data: { subscription: { unsubscribe(): void } };
      };
      /** Service-role only - see `GoTrueAdminApi` above. Present on every `SupabaseClient` at the type level (matching the real package); calling it with a non-service-role client fails at runtime via Supabase's own auth check, same as any other admin-only call. */
      admin: GoTrueAdminApi;
    };
    from<TableName extends keyof Db["public"]["Tables"]>(
      table: TableName
    ): PostgrestQueryBuilder<
      Db["public"]["Tables"][TableName] extends { Row: unknown; Insert: unknown; Update: unknown }
        ? Db["public"]["Tables"][TableName]
        : never
    >;
    /**
     * Calls a Postgres function via PostgREST. `Row` should match the
     * function's `returns table (...)` shape (or a single-row shape for
     * scalar-returning functions) - the caller supplies it explicitly
     * via the type parameter, same as `from()` infers it from `Db`.
     */
    rpc<Row = unknown>(
      fn: string,
      params?: Record<string, unknown>,
      options?: { count?: "exact" | "planned" | "estimated" }
    ): PostgrestFilterBuilder<Row>;
  }

  /**
   * Plain (non-SSR, non-cookie-aware) client constructor - used by
   * `src/lib/supabase/service-client.ts` for server-only, non-request-
   * scoped access via the Supabase service role key. `@supabase/ssr`'s
   * `createBrowserClient`/`createServerClient` below are for
   * user-session-aware contexts; this is for background/Runtime jobs
   * that have no user session at all.
   */
  export function createClient<Db extends AnyDatabase = AnyDatabase>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: { auth?: { persistSession?: boolean; autoRefreshToken?: boolean } }
  ): SupabaseClient<Db>;
}

declare module "@supabase/ssr" {
  import type { SupabaseClient } from "@supabase/supabase-js";

  export interface CookieToSet {
    name: string;
    value: string;
    options?: Record<string, unknown>;
  }

  export interface CookieMethodsBrowser {
    getAll?(): { name: string; value: string }[];
    setAll?(cookies: CookieToSet[]): void;
  }

  export interface CookieMethodsServer {
    getAll(): { name: string; value: string }[];
    setAll(cookies: CookieToSet[]): void;
  }

  type DefaultDatabase = {
    public: { Tables: Record<string, { Row: unknown; Insert: unknown; Update: unknown }> };
  };

  export function createBrowserClient<Db extends DefaultDatabase = DefaultDatabase>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: { cookies?: CookieMethodsBrowser }
  ): SupabaseClient<Db>;

  export function createServerClient<Db extends DefaultDatabase = DefaultDatabase>(
    supabaseUrl: string,
    supabaseKey: string,
    options: { cookies: CookieMethodsServer }
  ): SupabaseClient<Db>;
}
