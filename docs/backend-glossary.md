# Backend terms, for a frontend developer

Written for someone who builds the frontend and works with backend developers. The
aim is not that you can build this yourself, but that when a backender says
"that endpoint would need eager loading" or "we should paginate that", you know
what they mean and can adjust what you ask for.

Every term below is used somewhere in `api/`. Where it helps, there is a pointer to
the file so you can see it in place.

---

## 1. The shape of the thing

### Container
A packaged, isolated environment holding an application and everything it needs to
run: the right PHP version, the right extensions, the right system libraries. It is
not a virtual machine. A VM boots a whole operating system; a container shares the
host kernel and starts in under a second.

**Why it exists:** so "works on my machine" stops being a sentence anyone says. The
container that runs on your Mac is the same one that runs in CI and in production.

**Where:** `api/docker/php/Dockerfile`

### Image vs container
An **image** is the frozen recipe result. A **container** is a running instance of
it. One image, many containers. Rebuilding the image is how you change what is
installed; restarting the container is how you apply it.

### Docker Compose
Describes several containers that work together, in one file. `docker compose up`
starts nginx, PHP, MySQL and Redis, connects them on a private network, and gives
each a hostname equal to its service name.

**What this means for you:** when a backender says "just run compose up", they are
saying you do not need PHP or MySQL installed. It is the difference between a
half-day of setup and two minutes.

**Where:** `docker-compose.yml`

### Volume
Storage that outlives a container. Without it, `docker compose down` would erase
the database. There are two kinds here: a **named volume** for MySQL's data files,
and a **bind mount** that maps your local `api/` folder into the container so code
edits are live without rebuilding.

### Healthcheck
A command the container runtime runs periodically to decide whether a container is
actually working. In `docker-compose.yml` the PHP service waits for MySQL to be
`service_healthy`, not merely started. Without that, the application boots first
and every query fails for the first ten seconds.

---

## 2. The web layer

### nginx
The web server. Every request meets it first. It serves static files itself and
passes PHP requests on. It also handles gzip, TLS and security headers.

**Why not let PHP handle everything:** PHP is comparatively slow to start and there
are a limited number of worker processes. nginx holds the slow client connections
so a worker is not tied up waiting for someone on a train.

**Where:** `api/docker/nginx/default.conf`

### PHP-FPM
FastCGI Process Manager. Keeps a pool of PHP processes alive and hands each request
to a free one, instead of starting PHP from scratch every time.

### Front controller
Every request goes to one file, `public/index.php`, which boots the framework and
lets the router decide what happens. This is why Laravel URLs have no `.php` in
them.

---

## 3. The database

### Relational database (MySQL)
Data in tables of rows and columns, with defined relationships between them. The
alternative family is NoSQL (MongoDB, DynamoDB), which trades those guarantees for
flexibility. Logistics data has strong relationships, so relational is the right
fit here.

### Primary key
The column that uniquely identifies a row, usually an auto-incrementing integer
with no business meaning. Business identifiers like `NL-48291` get their own column
(`ref`), because business values change and keys should not.

**Where:** every migration in `api/database/migrations/`

### Foreign key
A column holding another table's primary key, with the database enforcing that the
target exists. That enforcement is called **referential integrity**: it makes it
impossible to have a shipment pointing at a deleted vehicle.

When you define one you must say what happens if the target is deleted:
`cascadeOnDelete` (delete this too), `nullOnDelete` (blank the reference),
`restrictOnDelete` (refuse). That is a business decision, not a technical one.

### Index
A lookup structure the database maintains beside the table. Without one, filtering
by status means reading every row. With one, the database jumps straight to the
matches.

**The trade-off:** every index costs disk space and slows down writes, because it
must be updated on every insert. So you index what you filter and sort on, not
everything.

**What this means for you:** if you ask for a new filter on a big table, a
backender may need to add an index. That is a migration, and on a large table it
can take a while, which is why "can we filter by X?" is not always a five-minute
change.

**Where:** `api/database/migrations/2026_01_01_000005_create_shipments_table.php`

### Composite index
An index across several columns, for queries that filter on both. Column order
matters: an index on `(status, eta)` helps `WHERE status = ? ORDER BY eta` and
`WHERE status = ?`, but does nothing for `ORDER BY eta` alone.

### Migration
A versioned schema change written in code and committed alongside it. Each runs
once, in order, recorded in a `migrations` table. Deploying means "run the new
migrations" rather than someone remembering to alter a table by hand.

**What this means for you:** the database schema is code, reviewed like code. When
a backender says "that needs a migration", they mean a schema change that has to go
through the deploy pipeline, not a config toggle.

### Seeder
Code that fills the database with data. Reference data (the list of warehouses) is
seeded everywhere; demo data (1,924 shipments) only in development.

**Where:** `api/database/seeders/`

### Factory
A recipe for generating one plausible record on demand, for tests.
`Vehicle::factory()->inMaintenance()->create()` gives you exactly the situation a
test needs, without depending on whether the demo data happens to contain one.

**Where:** `api/database/factories/VehicleFactory.php`

### ORM (Object-Relational Mapper)
Maps table rows onto objects so code reads `$shipment->origin->city` instead of
handwritten SQL. Laravel's is called Eloquent. Convenient, and it hides a specific
trap:

### N+1 query problem
**The single most useful thing on this page.**

Listing 25 shipments and showing each origin city looks innocent:

```php
foreach (Shipment::limit(25)->get() as $shipment) {
    echo $shipment->origin->city;   // one extra query, every iteration
}
```

That is 1 query for the list plus 25 for the origins. At 25 rows nobody notices; at
1,000 the endpoint takes seconds. The fix is **eager loading**: fetch the relations
up front.

```php
Shipment::with('origin')->limit(25)->get();   // 2 queries, always
```

**What this means for you:** this is why a backender asks "which fields do you
actually need?" Every relation you display is a join they have to plan for. Asking
for "just the customer name too" on a list endpoint is sometimes free and sometimes
an extra query per row.

There is a test in this project that fails if someone reintroduces one:
`api/tests/Feature/ShipmentApiTest.php::test_listing_shipments_does_not_trigger_n_plus_one_queries`

### Transaction
A group of statements that either all succeed or all roll back. Moving a shipment
between vehicles means two updates; a transaction stops a crash between them from
leaving the data half-changed.

### SQL injection
The attack where user input is treated as SQL. If a sort parameter is pasted
straight into `ORDER BY`, sending `id;DROP TABLE shipments` does what it says.

The defences here are **parameter binding** (the value travels separately from the
query, so it can never be read as code) and an **allow-list** for anything that
cannot be bound, such as column names.

**Where:** `api/app/Http/Requests/ShipmentIndexRequest.php`

---

## 4. The API

### REST
A convention where the URL names a thing and the HTTP verb says what to do:

```
GET    /api/v1/shipments        list
GET    /api/v1/shipments/NL-1   read one
POST   /api/v1/shipments        create
PATCH  /api/v1/shipments/NL-1   change part
DELETE /api/v1/shipments/NL-1   remove
```

Nouns in the path, verbs in the method. A URL like `/getShipments` is the sign of
an API that has not thought about this.

The main alternative you will meet is **GraphQL**, where the client asks for
exactly the fields it wants in one request. It solves over-fetching, at the cost of
much harder caching and a real risk of expensive queries.

### Endpoint
One URL plus method combination. `GET /api/v1/shipments` is an endpoint.

### Status codes
Using them properly is most of what makes an API pleasant:

| Code | Meaning | Typical cause |
|---|---|---|
| 200 | OK | It worked |
| 201 | Created | A POST created something |
| 204 | No Content | Worked, nothing to return (a DELETE) |
| 400 | Bad Request | Malformed request |
| 401 | Unauthorized | No or bad credentials. "I don't know who you are" |
| 403 | Forbidden | Known, but not allowed. "I know you, and no" |
| 404 | Not Found | No such record |
| 422 | Unprocessable Entity | Well-formed but fails validation |
| 429 | Too Many Requests | Rate limited |
| 500 | Internal Server Error | Their bug |
| 503 | Service Unavailable | Alive but a dependency is down |

401 vs 403 and 400 vs 422 are the two pairs people get wrong most often.

### Payload / request body / response body
The data carried by the request or the response, here always JSON.

### API Resource / DTO / serializer
The translation layer between a database row and the JSON a client receives. Three
names for the same idea.

**Why it matters:** without one, every column name becomes part of your public
contract, and any column added later is exposed the moment it exists. That is a
common way internal data leaks.

**Where:** `api/app/Http/Resources/ShipmentResource.php`

### Versioning
Every path starts with `/v1`. Once something depends on your response shape you
cannot change it freely; you publish `/v2` and keep `/v1` alive until consumers
have moved.

A **breaking change** is anything a client could rely on: removing a field,
renaming one, changing its type, narrowing what a value can be. Adding a new
optional field is *not* breaking, which is why APIs tend to grow rather than change.

**What this means for you:** if you need a field renamed, expect that to be a
conversation about versioning, not a quick edit.

### Validation
Checking input before it reaches business logic. Not politeness, a security
boundary: everything arriving over HTTP is attacker-controlled until proven
otherwise, including values your own frontend "always" sends correctly.

On failure this API answers 422 with a field-by-field breakdown, which is exactly
what a form needs to highlight the wrong input.

### Pagination
Returning results in pages instead of all at once. Never return an unbounded list:
1,924 rows is fine, 2 million is an outage.

- **Offset pagination** (`?page=3&per_page=25`) uses `LIMIT/OFFSET`. Simple, allows
  jumping to page 50, gets slow on very deep pages because the database still walks
  past every skipped row. Used here.
- **Cursor pagination** (`?after=NL-48291`) is fast at any depth but only moves
  forwards and backwards. Right for infinite scroll and very large tables.

**What this means for you:** "can the endpoint just return everything?" is usually
answered no, and this is why. Also: always sort by something unique as a tiebreaker,
or rows shuffle between pages and users see duplicates.

### Idempotency
An operation you can repeat safely. GET, PUT and DELETE are idempotent; POST is
not, which is why double-clicking a submit button can create two records. The fix
is an **idempotency key** the client generates and the server remembers.

---

## 5. Authentication and security

### Authentication vs authorisation
**Authentication** is who you are. **Authorisation** is what you may do. 401 is a
failure of the first, 403 of the second.

### API key
A long random string identifying the *calling application*. Sent with every
request:

```
X-API-Key: nl_dev_dashboard_2f8c41d9b7e64a05
```

Good for telling machine consumers apart so usage can be measured, rate-limited and
revoked per consumer. It is **not** proof of who the human user is.

**Where:** `api/app/Http/Middleware/RequireApiKey.php`

### Session vs JWT vs API key

| | Identifies | State | Revoking |
|---|---|---|---|
| **Session cookie** | a user | server holds it | delete it, instant |
| **JWT** | a user | none, it is self-contained | hard until it expires |
| **API key** | an application | server holds it | delete it, instant |

A **JWT** (JSON Web Token) is a signed blob the client stores and sends in an
`Authorization: Bearer ...` header. Signed, not encrypted: anyone can read the
contents, so never put anything secret in one. It scales well because the server
holds no state, and that same property makes it awkward to revoke early.

### The rule that matters most to you
**A secret in the browser is not a secret.** Anything in your JavaScript bundle,
including every `NEXT_PUBLIC_` variable, is readable by anyone who opens devtools.

This project handles it the right way: the key lives in the Next.js server
environment, Server Components fetch with it, and the browser only ever receives
rendered HTML. `src/lib/api/client.ts` starts with `import "server-only"`, so the
build fails if anyone ever imports it into a client component.

If a backender hands you a key and says "put it in the frontend", that is the
moment to ask whether it can go through your server instead.

### CORS (Cross-Origin Resource Sharing)
A browser blocks JavaScript from reading a response from a different origin unless
the server opts in with specific headers. Different origin means different scheme,
host *or* port, so `:3000` calling `:8080` counts.

**Important:** CORS protects the *user*, not the API. It stops a random website
using a visitor's credentials. It is not authentication: curl ignores it entirely.

The **preflight** is the `OPTIONS` request the browser sends first for anything
non-trivial, asking permission before the real request.

**Where:** `api/config/cors.php`

### Rate limiting
A cap on requests per caller per minute. Protects the database from a runaway
client and limits the damage a leaked key can do. Over the limit you get 429 plus a
`Retry-After` header.

**What this means for you:** a `useEffect` without a dependency array can fire
thousands of requests a second. Read `Retry-After` and back off rather than
retrying immediately.

### Timing attack
Comparing two strings with `===` returns early at the first difference. An attacker
can measure that and guess a key one character at a time. `hash_equals()` always
takes the same time regardless.

### Secrets management
Passwords and keys never go in code or in git. They come from environment variables,
and in production from a secrets manager (AWS Secrets Manager, Vault, Doppler).

A committed secret must be treated as compromised **even after you delete it**, as
it is still in the git history.

---

## 6. Performance

### Caching
Keeping the answer to an expensive question so you do not ask again. The whole
trade-off is: accept data up to N seconds stale, in exchange for not doing the work.

There are three separate caches in this project, and knowing which is which matters:

1. **Redis, inside the API** — the computed KPIs, for `CACHE_TTL` seconds. Saves
   the *database*. `api/app/Services/NetworkStatistics.php`
2. **HTTP `Cache-Control`** — tells browsers and CDNs how long they may reuse a
   response. Saves the *network*.
3. **Next.js `revalidate`** — how long the frontend may reuse a fetch result. Saves
   the *round trip*. `src/lib/api/queries.ts`

### TTL (time to live)
How long a cached value stays valid. Short means fresh but busy; long means fast
but stale. Setting it is a product decision: how wrong may this number be before it
misleads someone?

### Cache invalidation
Removing cached data when the underlying data changes. Genuinely hard, hence the
old joke about it being one of the two hard problems in computing. Two approaches:
let it expire (simple, briefly stale) or explicitly bust it on write (fresh, easy
to miss a spot).

### Cache warming
Recalculating a cached value on a schedule so no real user ever pays for the
recomputation. Turns a latency spike every TTL into a flat line.

**Where:** `api/app/Console/Commands/RefreshStatistics.php`

### Redis
An in-memory key/value store. Fast because it never touches disk on the hot path,
and it forgets things on purpose. Used here for the cache and the queue.

### Queue and worker
A queue holds jobs; a worker process picks them up and runs them. Work that is slow
or can fail goes here so the HTTP request returns immediately.

**What this means for you:** when a backender says "we'll queue that", the response
comes back before the work is done. Your UI needs to reflect that: an optimistic
state, or a status you poll, rather than assuming the result is ready.

**Where:** the `queue` service in `docker-compose.yml`

### Connection pooling
Reusing database connections instead of opening one per request. Opening a
connection is expensive relative to a query.

---

## 7. Running it in production

### Health check
An endpoint that answers "is this instance fit to serve traffic?" Two kinds, and
mixing them up causes outages:

- **Liveness** — is the process alive? If not, restart the container. Must *not*
  check the database: a brief database blip would otherwise restart every
  application container at once.
- **Readiness** — can it serve a request right now? This one does check
  dependencies. If it fails, stop sending traffic, but do not restart.

**Where:** `api/app/Http/Controllers/Api/HealthController.php`

### Structured logging
Logging one JSON object per line instead of free text, so a log platform can filter
on fields without regex guesswork. In a container you log to stdout/stderr, not to
a file: a file inside a container disappears when it restarts.

**Where:** `api/config/logging.php`

### Request ID / correlation ID
A unique id attached to every request and returned in the `X-Request-Id` header.
When the dashboard shows an error, that id is on screen. Hand it to a backender and
they find the exact request in seconds. This is why the error states in
`src/components/modules/api-error-state.tsx` display it.

### Observability: logs, metrics, traces
- **Logs** — what happened, in text
- **Metrics** — numbers over time (requests per second, p95 latency, error rate)
- **Traces** — one request's journey across services, with timing per hop

**p95 latency** means 95% of requests were faster than this. Averages hide the
slow tail; percentiles do not.

### CI (Continuous Integration)
Every push runs the tests on a clean machine. The point is not that tests exist, it
is that nobody can merge without them passing.

**Where:** `.github/workflows/ci.yml`

### CD (Continuous Deployment/Delivery)
The automated path from merged code to running production. Usually: build image,
run migrations, roll out new containers, keep the old ones until the new pass their
health check.

### Blue/green and rolling deploys
Ways to release without downtime. **Rolling** replaces containers a few at a time.
**Blue/green** runs two full environments and switches traffic, so rollback is
instant.

**What this means for you:** during a rolling deploy both versions run at once for
a minute or two. This is why backends add fields rather than renaming them, and why
your frontend should tolerate a field that is briefly missing.

### Environment variables and the twelve-factor app
Configuration lives in the environment, not the code, so one build runs in every
environment. `.env` holds real values and is git-ignored; `.env.example` is
committed and documents which variables exist.

---

## 8. Architecture words you will hear

### Monorepo
One repository containing several projects. This one holds `frontend/` and `api/`.
The alternative is separate repos per service. Monorepos make cross-cutting changes
easy and CI configuration harder.

### Controller, service, model
The layers in this API:

- **Controller** — translates HTTP into a method call and back. No business rules.
- **Service** — the actual logic. Reusable from a command or a queued job.
- **Model** — one database table, plus the rules about its own data.

Business logic in a controller is the most common structural complaint in a PHP
code review.

### Middleware
A layer every request passes through on the way in and every response on the way
out. Authentication, rate limiting and request ids are all middleware here. Think
of it as a stack of filters wrapped around the controller.

**Where:** `api/app/Http/Middleware/`

### Dependency injection
Rather than a class creating what it needs, it declares what it needs and the
framework supplies it. Makes testing possible: a test can supply a fake.

### Repository pattern
Putting all database access for an entity behind one class, so the rest of the code
does not know it is SQL. Common in Symfony. Laravel projects often skip it, since
Eloquent models already play that role.

### Strangler fig migration
Replacing an old system by routing pieces to the new one until nothing is left
pointing at the old. Exactly what is happening in this project: shipments read from
the API, the other pages still read the local generator, and they move over one at
a time. This is normal and preferable to a rewrite everything commit.

---

## 9. The five questions worth asking a backender

When you get an endpoint to build against:

1. **What are the error shapes?** Not just the happy path. What does 404 look like,
   what does a validation failure look like, and is the shape the same every time?
2. **Is it paginated, and what is the maximum page size?** Determines whether you
   build a table or an infinite scroll.
3. **How fresh is this data?** If it is cached for 60 seconds there is no point
   polling every 5.
4. **Which fields are guaranteed, and which can be null?** This decides how much of
   your UI needs an empty state.
5. **Where does the API key live, and does it ever reach the browser?** If the
   answer is yes, push back.
