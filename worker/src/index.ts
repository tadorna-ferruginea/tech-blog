interface Env {
	DB: D1Database;
	ALLOWED_ORIGIN: string;
	SCHEDULER_PASSWORD: string;
	SESSION_SECRET: string;
}

type Session = { name: string; exp: number };
type Json = Record<string, unknown>;
type ActivityRow = { id: string; date: string; startMinute: number; endMinute: number; description: string; createdBy: string; createdAt: string; going?: number; balls?: number; myBringsBall?: number | null };

const API = "/api/pickup/v1";
const encoder = new TextEncoder();
const NY_DATE_PARTS = new Intl.DateTimeFormat("en-US", {
	timeZone: "America/New_York",
	year: "numeric",
	month: "2-digit",
	day: "2-digit",
});

class HttpError extends Error {
	constructor(public status: number, message: string) {
		super(message);
	}
}

const isRecord = (value: unknown): value is Json => typeof value === "object" && value !== null && !Array.isArray(value);

const base64Url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const fromBase64Url = (value: string) => {
	const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
	return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
};

const equalBytes = (left: Uint8Array, right: Uint8Array) => {
	let difference = left.length ^ right.length;
	for (let index = 0; index < Math.max(left.length, right.length); index += 1) difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
	return difference === 0;
};

const hmac = async (secret: string, value: string) => {
	const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
	return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
};

const signedSession = async (session: Session, env: Env) => {
	const payload = base64Url(encoder.encode(JSON.stringify(session)));
	return `${payload}.${base64Url(await hmac(env.SESSION_SECRET, payload))}`;
};

const readCookie = (request: Request, name: string) => request.headers
	.get("Cookie")
	?.split(";")
	.map((value) => value.trim().split("=", 2))
	.find(([key]) => key === name)?.[1];

const readSession = async (request: Request, env: Env): Promise<Session | undefined> => {
	const token = readCookie(request, "pickup_session");
	if (!token) return undefined;
	const [payload, signature, extra] = token.split(".");
	if (!payload || !signature || extra) return undefined;
	try {
		if (!equalBytes(fromBase64Url(signature), await hmac(env.SESSION_SECRET, payload))) return undefined;
		const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as unknown;
		if (!isRecord(session) || typeof session.name !== "string" || typeof session.exp !== "number" || session.exp <= Math.floor(Date.now() / 1000)) return undefined;
		return { name: session.name, exp: session.exp };
	} catch {
		return undefined;
	}
};

const sessionCookie = (token: string, seconds: number, persistent: boolean) => `pickup_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax${persistent ? `; Max-Age=${seconds}` : ""}`;
const clearSessionCookie = "pickup_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";

const corsHeaders = (request: Request, env: Env): Record<string, string> => {
	const origin = request.headers.get("Origin");
	if (!origin || origin !== env.ALLOWED_ORIGIN) return {};
	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Credentials": "true",
		"Access-Control-Allow-Headers": "Content-Type",
		"Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
		Vary: "Origin",
	};
};

const json = (request: Request, env: Env, value: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(value), {
	...init,
	headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders(request, env), ...init.headers },
});

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

const newYorkToday = () => {
	const parts = NY_DATE_PARTS.formatToParts();
	const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
	return dateOnly(new Date(Date.UTC(part("year"), part("month") - 1, part("day"), 12)));
};

const newYorkClock = () => {
	const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts();
	const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((item) => item.type === type)?.value);
	return { date: `${String(part("year")).padStart(4, "0")}-${String(part("month")).padStart(2, "0")}-${String(part("day")).padStart(2, "0")}`, minute: part("hour") * 60 + part("minute") };
};

const addDays = (date: string, days: number) => {
	const value = new Date(`${date}T12:00:00Z`);
	value.setUTCDate(value.getUTCDate() + days);
	return dateOnly(value);
};

const currentWeekStart = () => {
	return newYorkToday();
};

const isDateInWeek = (date: string, weekStart: string) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= weekStart && date <= addDays(weekStart, 6);
const hasActivityEnded = (activity: Pick<ActivityRow, "date" | "endMinute">) => {
	const now = newYorkClock();
	return activity.date < now.date || (activity.date === now.date && activity.endMinute <= now.minute);
};
const validSlot = (minute: unknown): minute is number => typeof minute === "number" && Number.isInteger(minute) && minute >= 720 && minute <= 1170 && minute % 30 === 0;
const validActivityStart = (minute: unknown): minute is number => typeof minute === "number" && Number.isInteger(minute) && minute >= 720 && minute < 1200;
const validActivityEnd = (minute: unknown): minute is number => typeof minute === "number" && Number.isInteger(minute) && minute > 720 && minute <= 1200;
const validName = (name: unknown): name is string => typeof name === "string" && name.trim().length >= 1 && name.trim().length <= 48;

const readJson = async (request: Request) => {
	try {
		const value = await request.json<unknown>();
		if (!isRecord(value)) throw new HttpError(400, "Expected a JSON object.");
		return value;
	} catch (error) {
		if (error instanceof HttpError) throw error;
		throw new HttpError(400, "Invalid JSON.");
	}
};

const requireSession = async (request: Request, env: Env) => {
	const session = await readSession(request, env);
	if (!session) throw new HttpError(401, "Please log in.");
	return session;
};

const weatherRows = async (env: Env, weekStart: string) => {
	const rows = (await env.DB.prepare(
		"SELECT date, hour, temperature_c AS temperatureC, weather_code AS weatherCode, fetched_at AS fetchedAt FROM weather_hour WHERE date BETWEEN ?1 AND ?2 ORDER BY date, hour",
	).bind(weekStart, addDays(weekStart, 6)).all<{ date: string; hour: number; temperatureC: number; weatherCode: number; fetchedAt: string }>()).results;
	return rows;
};

const sunsetToday = async (env: Env, date: string) => env.DB.prepare(
	"SELECT sunset FROM weather_day WHERE date = ?1",
).bind(date).first<{ sunset: string }>();

const refreshWeather = async (env: Env) => {
	const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=40.7829&longitude=-73.9654&hourly=temperature_2m,weather_code&daily=sunset&temperature_unit=celsius&timezone=America%2FNew_York&past_days=6&forecast_days=16");
	if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
	const forecast = await response.json() as { hourly?: { time?: string[]; temperature_2m?: number[]; weather_code?: number[] }; daily?: { time?: string[]; sunset?: string[] } };
	const hourly = forecast.hourly;
	const daily = forecast.daily;
	if (!hourly?.time || !hourly.temperature_2m || !hourly.weather_code || !daily?.time || !daily.sunset) throw new Error("Open-Meteo response was incomplete");
	const fetchedAt = new Date().toISOString();
	const statements: D1PreparedStatement[] = [];
	hourly.time.forEach((time, index) => {
		const hour = Number(time.slice(11, 13));
		if (hour < 12 || hour > 19) return;
		statements.push(env.DB.prepare(
			"INSERT INTO weather_hour (date, hour, temperature_c, weather_code, fetched_at) VALUES (?1, ?2, ?3, ?4, ?5) ON CONFLICT(date, hour) DO UPDATE SET temperature_c = excluded.temperature_c, weather_code = excluded.weather_code, fetched_at = excluded.fetched_at",
		).bind(time.slice(0, 10), hour, Math.round(hourly.temperature_2m![index]!), hourly.weather_code![index]!, fetchedAt));
	});
	const today = newYorkToday();
	const todayIndex = daily.time.indexOf(today);
	const sunset = todayIndex === -1 ? undefined : daily.sunset[todayIndex];
	if (sunset) statements.push(env.DB.prepare(
		"INSERT INTO weather_day (date, sunset, fetched_at) VALUES (?1, ?2, ?3) ON CONFLICT(date) DO UPDATE SET sunset = excluded.sunset, fetched_at = excluded.fetched_at",
	).bind(today, sunset.slice(11, 16), fetchedAt));
	statements.push(env.DB.prepare("DELETE FROM weather_hour WHERE date < ?1").bind(addDays(currentWeekStart(), -7)));
	statements.push(env.DB.prepare("DELETE FROM weather_day WHERE date <> ?1").bind(today));
	if (statements.length > 0) await env.DB.batch(statements);
};

const pruneExpiredActivities = async (env: Env) => {
	const activities = await env.DB.prepare("SELECT id, date, end_minute AS endMinute FROM activities").all<Pick<ActivityRow, "id" | "date" | "endMinute">>();
	const expired = activities.results.filter(hasActivityEnded);
	if (expired.length > 0) await env.DB.batch(expired.flatMap((activity) => [
		env.DB.prepare("DELETE FROM activity_rsvps WHERE activity_id = ?1").bind(activity.id),
		env.DB.prepare("DELETE FROM activities WHERE id = ?1").bind(activity.id),
	]));
};

const schedule = async (request: Request, env: Env, url: URL, ctx: ExecutionContext) => {
	const weekStart = url.searchParams.get("week") ?? currentWeekStart();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new HttpError(400, "Invalid week.");
	let weather = await weatherRows(env, weekStart);
	let sunset = await sunsetToday(env, newYorkToday());
	if (weather.length === 0 || !sunset) {
		await refreshWeather(env);
		weather = await weatherRows(env, weekStart);
		sunset = await sunsetToday(env, newYorkToday());
	}
	const session = await readSession(request, env);
	if (!session) return json(request, env, { weekStart, weather, sunset: sunset?.sunset ?? null, authenticated: false });
	const [summary, mine, activities] = await Promise.all([
		env.DB.prepare("SELECT date, start_minute AS startMinute, COUNT(*) AS people, SUM(brings_ball) AS balls FROM availability WHERE week_start = ?1 GROUP BY date, start_minute").bind(weekStart).all(),
		env.DB.prepare("SELECT date, start_minute AS startMinute, brings_ball AS bringsBall FROM availability WHERE week_start = ?1 AND person_name = ?2 ORDER BY date, start_minute").bind(weekStart, session.name).all(),
		env.DB.prepare("SELECT a.id, a.date, a.start_minute AS startMinute, a.end_minute AS endMinute, a.description, a.created_by AS createdBy, a.created_at AS createdAt, COUNT(r.person_name) AS going, COALESCE(SUM(r.brings_ball), 0) AS balls, MAX(CASE WHEN r.person_name = ?2 THEN r.brings_ball END) AS myBringsBall FROM activities a LEFT JOIN activity_rsvps r ON r.activity_id = a.id WHERE a.week_start = ?1 GROUP BY a.id ORDER BY a.date, a.start_minute").bind(weekStart, session.name).all<ActivityRow>(),
	]);
	ctx.waitUntil(Promise.all([
		env.DB.prepare("DELETE FROM comments WHERE expires_at <= ?1").bind(new Date().toISOString()).run(),
		pruneExpiredActivities(env),
	]));
	return json(request, env, { weekStart, weather, sunset: sunset?.sunset ?? null, authenticated: true, me: session.name, summary: summary.results, mine: mine.results, activities: activities.results.filter((activity) => !hasActivityEnded(activity)) });
};

const replaceAvailability = async (request: Request, env: Env) => {
	const session = await requireSession(request, env);
	const body = await readJson(request);
	const weekStart = typeof body.weekStart === "string" ? body.weekStart : "";
	const entries = body.entries;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || !Array.isArray(entries) || entries.length > 112) throw new HttpError(400, "Invalid availability.");
	const unique = new Set<string>();
	const validEntries = entries.map((entry) => {
		if (!isRecord(entry) || typeof entry.date !== "string" || !isDateInWeek(entry.date, weekStart) || !validSlot(entry.startMinute) || typeof entry.bringsBall !== "boolean") throw new HttpError(400, "Invalid availability entry.");
		const key = `${entry.date}:${entry.startMinute}`;
		if (unique.has(key)) throw new HttpError(400, "Duplicate availability entry.");
		unique.add(key);
		return { date: entry.date, startMinute: entry.startMinute, bringsBall: entry.bringsBall };
	});
	const statements = [env.DB.prepare("DELETE FROM availability WHERE week_start = ?1 AND person_name = ?2").bind(weekStart, session.name)];
	validEntries.forEach((entry) => statements.push(env.DB.prepare(
		"INSERT INTO availability (week_start, person_name, date, start_minute, brings_ball) VALUES (?1, ?2, ?3, ?4, ?5)",
	).bind(weekStart, session.name, entry.date, entry.startMinute, Number(entry.bringsBall))));
	await env.DB.batch(statements);
	return json(request, env, { ok: true });
};

const participants = async (request: Request, env: Env, url: URL) => {
	const session = await requireSession(request, env);
	const weekStart = url.searchParams.get("week") ?? currentWeekStart();
	const date = url.searchParams.get("date") ?? "";
	const startMinute = Number(url.searchParams.get("startMinute"));
	if (!isDateInWeek(date, weekStart) || !validSlot(startMinute)) throw new HttpError(400, "Invalid slot.");
	const people = await env.DB.prepare("SELECT person_name AS name, brings_ball AS bringsBall FROM availability WHERE week_start = ?1 AND date = ?2 AND start_minute = ?3 ORDER BY person_name").bind(weekStart, date, startMinute).all();
	return json(request, env, { me: session.name, people: people.results });
};

const createActivity = async (request: Request, env: Env) => {
	const session = await requireSession(request, env);
	const body = await readJson(request);
	const weekStart = typeof body.weekStart === "string" ? body.weekStart : "";
	const date = typeof body.date === "string" ? body.date : "";
	const startMinute = body.startMinute;
	const endMinute = body.endMinute;
	const description = typeof body.description === "string" ? body.description.trim() : "";
	if (!isDateInWeek(date, weekStart) || !validActivityStart(startMinute) || !validActivityEnd(endMinute) || description.length > 500) throw new HttpError(400, "Invalid activity.");
	if (endMinute <= startMinute) throw new HttpError(400, "Invalid activity.");
	const id = crypto.randomUUID();
	try {
		await env.DB.prepare("INSERT INTO activities (id, week_start, date, start_minute, end_minute, description, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)").bind(id, weekStart, date, startMinute, endMinute, description, session.name).run();
	} catch (error) {
		if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) throw new HttpError(409, "An activity already starts within this half-hour.");
		throw error;
	}
	return json(request, env, { id }, { status: 201 });
};

const updateActivity = async (request: Request, env: Env, id: string) => {
	const session = await requireSession(request, env);
	const body = await readJson(request);
	const startMinute = body.startMinute;
	const endMinute = body.endMinute;
	const description = typeof body.description === "string" ? body.description.trim() : "";
	if (!validActivityStart(startMinute) || !validActivityEnd(endMinute) || description.length > 500) throw new HttpError(400, "Invalid activity.");
	if (endMinute <= startMinute) throw new HttpError(400, "Invalid activity.");
	const activity = await env.DB.prepare("SELECT date FROM activities WHERE id = ?1 AND created_by = ?2").bind(id, session.name).first<{ date: string }>();
	if (!activity) throw new HttpError(404, "Activity not found.");
	try {
		await env.DB.prepare("UPDATE activities SET start_minute = ?1, end_minute = ?2, description = ?3 WHERE id = ?4").bind(startMinute, endMinute, description, id).run();
	} catch (error) {
		if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) throw new HttpError(409, "An activity already starts within this half-hour.");
		throw error;
	}
	return json(request, env, { ok: true });
};

const deleteActivity = async (request: Request, env: Env, id: string) => {
	const session = await requireSession(request, env);
	const activity = await env.DB.prepare("SELECT id FROM activities WHERE id = ?1 AND created_by = ?2").bind(id, session.name).first<{ id: string }>();
	if (!activity) throw new HttpError(404, "Activity not found.");
	await env.DB.batch([
		env.DB.prepare("DELETE FROM activity_rsvps WHERE activity_id = ?1").bind(id),
		env.DB.prepare("DELETE FROM activities WHERE id = ?1 AND created_by = ?2").bind(id, session.name),
	]);
	return json(request, env, { ok: true });
};

const updateActivityRsvp = async (request: Request, env: Env, id: string) => {
	const session = await requireSession(request, env);
	const body = await readJson(request);
	if (typeof body.bringsBall !== "boolean") throw new HttpError(400, "Invalid RSVP.");
	const activity = await env.DB.prepare("SELECT date, end_minute AS endMinute FROM activities WHERE id = ?1").bind(id).first<Pick<ActivityRow, "date" | "endMinute">>();
	if (!activity || hasActivityEnded(activity)) throw new HttpError(404, "Activity not found.");
	await env.DB.prepare("INSERT INTO activity_rsvps (activity_id, person_name, brings_ball) VALUES (?1, ?2, ?3) ON CONFLICT(activity_id, person_name) DO UPDATE SET brings_ball = excluded.brings_ball, updated_at = CURRENT_TIMESTAMP").bind(id, session.name, Number(body.bringsBall)).run();
	return json(request, env, { ok: true });
};

const deleteActivityRsvp = async (request: Request, env: Env, id: string) => {
	const session = await requireSession(request, env);
	await env.DB.prepare("DELETE FROM activity_rsvps WHERE activity_id = ?1 AND person_name = ?2").bind(id, session.name).run();
	return json(request, env, { ok: true });
};

const activityRsvps = async (request: Request, env: Env, id: string) => {
	await requireSession(request, env);
	const activity = await env.DB.prepare("SELECT date, end_minute AS endMinute FROM activities WHERE id = ?1").bind(id).first<Pick<ActivityRow, "date" | "endMinute">>();
	if (!activity || hasActivityEnded(activity)) throw new HttpError(404, "Activity not found.");
	const people = await env.DB.prepare("SELECT person_name AS name, brings_ball AS bringsBall FROM activity_rsvps WHERE activity_id = ?1 ORDER BY person_name").bind(id).all();
	return json(request, env, { people: people.results });
};

const comments = async (request: Request, env: Env, url: URL) => {
	await requireSession(request, env);
	const weekStart = url.searchParams.get("week") ?? currentWeekStart();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new HttpError(400, "Invalid week.");
	const rows = await env.DB.prepare("SELECT comments.id, comments.parent_id AS parentId, comments.reply_to_id AS replyToId, reply_target.author AS replyToAuthor, reply_target.body AS replyToBody, comments.author, comments.body, comments.created_at AS createdAt, comments.updated_at AS updatedAt FROM comments LEFT JOIN comments AS reply_target ON reply_target.id = comments.reply_to_id WHERE comments.week_start = ?1 AND comments.expires_at > ?2 ORDER BY comments.created_at DESC").bind(weekStart, new Date().toISOString()).all();
	return json(request, env, { comments: rows.results });
};

const createComment = async (request: Request, env: Env) => {
	const session = await requireSession(request, env);
	const body = await readJson(request);
	const weekStart = typeof body.weekStart === "string" ? body.weekStart : "";
	const comment = typeof body.body === "string" ? body.body.trim() : "";
	const parentId = typeof body.parentId === "string" ? body.parentId : undefined;
	const replyToId = typeof body.replyToId === "string" ? body.replyToId : undefined;
	if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart) || !comment || comment.length > 1000) throw new HttpError(400, "Invalid comment.");
	if (parentId || replyToId) {
		if (!parentId || !replyToId) throw new HttpError(400, "Invalid reply target.");
		const parent = await env.DB.prepare("SELECT id, parent_id AS parentId FROM comments WHERE id = ?1 AND week_start = ?2 AND expires_at > ?3").bind(parentId, weekStart, new Date().toISOString()).first<{ id: string; parentId: string | null }>();
		const replyTarget = await env.DB.prepare("SELECT id, parent_id AS parentId FROM comments WHERE id = ?1 AND week_start = ?2 AND expires_at > ?3").bind(replyToId, weekStart, new Date().toISOString()).first<{ id: string; parentId: string | null }>();
		if (!parent || parent.parentId || !replyTarget || (replyTarget.id !== parentId && replyTarget.parentId !== parentId)) throw new HttpError(400, "Invalid reply target.");
	}
	const id = crypto.randomUUID();
	await env.DB.prepare("INSERT INTO comments (id, parent_id, reply_to_id, week_start, author, body, expires_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)").bind(id, parentId ?? null, replyToId ?? null, weekStart, session.name, comment, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()).run();
	return json(request, env, { id }, { status: 201 });
};

const updateComment = async (request: Request, env: Env, id: string) => {
	const session = await requireSession(request, env);
	const body = await readJson(request);
	const comment = typeof body.body === "string" ? body.body.trim() : "";
	if (!comment || comment.length > 1000) throw new HttpError(400, "Invalid comment.");
	const result = await env.DB.prepare("UPDATE comments SET body = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2 AND author = ?3 AND expires_at > ?4").bind(comment, id, session.name, new Date().toISOString()).run();
	if (result.meta.changes === 0) throw new HttpError(404, "Comment not found.");
	return json(request, env, { ok: true });
};

const deleteComment = async (request: Request, env: Env, id: string) => {
	const session = await requireSession(request, env);
	const owned = await env.DB.prepare("SELECT id FROM comments WHERE id = ?1 AND author = ?2").bind(id, session.name).first();
	if (!owned) throw new HttpError(404, "Comment not found.");
	await env.DB.prepare("UPDATE comments SET parent_id = NULL, reply_to_id = NULL WHERE parent_id = ?1").bind(id).run();
	await env.DB.prepare("UPDATE comments SET reply_to_id = NULL WHERE reply_to_id = ?1").bind(id).run();
	await env.DB.prepare("DELETE FROM comments WHERE id = ?1").bind(id).run();
	return json(request, env, { ok: true });
};

const login = async (request: Request, env: Env) => {
	const body = await readJson(request);
	const name = body.name;
	const password = body.password;
	const remember = body.remember === true;
	if (!validName(name) || typeof password !== "string") throw new HttpError(400, "Name and passphrase are required.");
	const [provided, expected] = await Promise.all([
		crypto.subtle.digest("SHA-256", encoder.encode(password)),
		crypto.subtle.digest("SHA-256", encoder.encode(env.SCHEDULER_PASSWORD)),
	]);
	if (!equalBytes(new Uint8Array(provided), new Uint8Array(expected))) throw new HttpError(401, "Incorrect passphrase.");
	const seconds = remember ? 30 * 24 * 60 * 60 : 8 * 60 * 60;
	const token = await signedSession({ name: name.trim(), exp: Math.floor(Date.now() / 1000) + seconds }, env);
	return json(request, env, { name: name.trim(), remember }, { headers: { "Set-Cookie": sessionCookie(token, seconds, remember) } });
};

const handle = async (request: Request, env: Env, ctx: ExecutionContext) => {
	const url = new URL(request.url);
	if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
	if (url.pathname === `${API}/health` && request.method === "GET") return json(request, env, { ok: true });
	if (url.pathname === `${API}/login` && request.method === "POST") return login(request, env);
	if (url.pathname === `${API}/logout` && request.method === "POST") return json(request, env, { ok: true }, { headers: { "Set-Cookie": clearSessionCookie } });
	if (url.pathname === `${API}/schedule` && request.method === "GET") return schedule(request, env, url, ctx);
	if (url.pathname === `${API}/availability` && request.method === "PUT") return replaceAvailability(request, env);
	if (url.pathname === `${API}/participants` && request.method === "GET") return participants(request, env, url);
	if (url.pathname === `${API}/activities` && request.method === "POST") return createActivity(request, env);
	if (url.pathname === `${API}/comments` && request.method === "GET") return comments(request, env, url);
	if (url.pathname === `${API}/comments` && request.method === "POST") return createComment(request, env);
	const activityRsvp = url.pathname.match(new RegExp(`^${API}/activities/([0-9a-f-]{36})/rsvp$`));
	if (activityRsvp && request.method === "GET") return activityRsvps(request, env, activityRsvp[1]!);
	if (activityRsvp && request.method === "PUT") return updateActivityRsvp(request, env, activityRsvp[1]!);
	if (activityRsvp && request.method === "DELETE") return deleteActivityRsvp(request, env, activityRsvp[1]!);
	const activity = url.pathname.match(new RegExp(`^${API}/activities/([0-9a-f-]{36})$`));
	if (activity && request.method === "PUT") return updateActivity(request, env, activity[1]!);
	if (activity && request.method === "DELETE") return deleteActivity(request, env, activity[1]!);
	const comment = url.pathname.match(new RegExp(`^${API}/comments/([0-9a-f-]{36})$`));
	if (comment && request.method === "PATCH") return updateComment(request, env, comment[1]!);
	if (comment && request.method === "DELETE") return deleteComment(request, env, comment[1]!);
	throw new HttpError(404, "Not found.");
};

export default {
	async fetch(request, env, ctx): Promise<Response> {
		try {
			return await handle(request, env, ctx);
		} catch (error) {
			if (error instanceof HttpError) return json(request, env, { error: error.message }, { status: error.status });
			console.error(error);
			return json(request, env, { error: "Internal server error." }, { status: 500 });
		}
	},
	async scheduled(_controller, env, ctx) {
		ctx.waitUntil(Promise.all([
			refreshWeather(env),
			pruneExpiredActivities(env),
			env.DB.prepare("DELETE FROM comments WHERE expires_at <= ?1").bind(new Date().toISOString()).run(),
		]));
	},
} satisfies ExportedHandler<Env>;
