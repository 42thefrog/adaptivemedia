import { test } from "node:test";
import assert from "node:assert/strict";
import {
  browseFeed,
  openFeedItem,
  FeedError,
  BrowseArtifactFeedInput,
  OpenFeedItemInput,
  __feedInternals,
} from "./artifact-feed.js";

test("first page returns a bounded number of items with a cursor", () => {
  const page = browseFeed({});
  assert.equal(page.items.length, 8);
  assert.equal(typeof page.nextCursor, "string");
  assert.equal(page.hasMore, true);
  assert.ok(page.total >= page.items.length);
});

test("respects the limit argument", () => {
  const page = browseFeed({ limit: 3 });
  assert.equal(page.items.length, 3);
});

test("cursor pagination walks the whole feed without gaps or dupes", () => {
  const seen: string[] = [];
  let cursor: string | undefined;
  let guard = 0;
  do {
    const page = browseFeed({ cursor, limit: 7 });
    for (const item of page.items) seen.push(item.id);
    cursor = page.nextCursor ?? undefined;
    guard += 1;
    assert.ok(guard < 1000, "pagination did not terminate");
  } while (cursor);
  assert.equal(seen.length, __feedInternals.dataset.length);
  assert.equal(new Set(seen).size, seen.length, "no duplicate ids across pages");
});

test("type filter only returns items of that type", () => {
  const page = browseFeed({ type: "okf", limit: 24 });
  assert.ok(page.items.length > 0);
  assert.ok(page.items.every((i) => i.type === "okf"));
});

test("pagination is deterministic", () => {
  assert.deepEqual(browseFeed({ limit: 5 }), browseFeed({ limit: 5 }));
});

test("a malformed cursor is rejected", () => {
  assert.throws(() => browseFeed({ cursor: "not-a-real-cursor" }), FeedError);
});

test("open_feed_item returns detail and an OKF ClickHouse schema", () => {
  const okfSource = __feedInternals.dataset.find(
    (i) => i.okf?.table !== undefined,
  );
  assert.ok(okfSource, "expected at least one OKF source with a table");
  const { selectedItem } = openFeedItem({ itemId: okfSource!.id });
  assert.equal(selectedItem.id, okfSource!.id);
  assert.ok(selectedItem.detail.table);
  assert.equal(selectedItem.detail.table!.engine, "clickhouse");
  assert.ok(selectedItem.detail.table!.fields.length > 0);
  for (const field of selectedItem.detail.table!.fields) {
    assert.ok(field.name && field.type && field.description);
  }
  assert.ok(selectedItem.detail.followUpPrompt.includes(selectedItem.title));
});

test("opening an unknown item throws not_found", () => {
  assert.throws(() => openFeedItem({ itemId: "does-not-exist" }), FeedError);
});

test("input schemas reject unknown keys", () => {
  assert.throws(() =>
    BrowseArtifactFeedInput.parse({ cursor: "x", bogus: 1 }),
  );
  assert.throws(() => OpenFeedItemInput.parse({}));
});
