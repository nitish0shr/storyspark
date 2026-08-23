import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_MARKETING_URL,
  createCompletedBookShareData,
} from "../src/lib/book-sharing";

describe("completed-book recommendation sharing", () => {
  test("shares the public marketing site with generic copy", () => {
    assert.deepEqual(createCompletedBookShareData(), {
      title: "Starmee Stories",
      text: "I made a personalised storybook with Starmee Stories. Create one for someone special!",
      url: DEFAULT_MARKETING_URL,
    });
  });

  test("strips paths, query strings, fragments, and capability-shaped data", () => {
    const data = createCompletedBookShareData(
      "https://example.com/preview/book-a?token=secret#page-1",
    );

    assert.equal(data.url, "https://example.com");
    assert.doesNotMatch(JSON.stringify(data), /book-a|token|secret|preview/);
  });

  test("rejects non-web and malformed configured destinations", () => {
    assert.equal(
      createCompletedBookShareData("javascript:alert(1)").url,
      DEFAULT_MARKETING_URL,
    );
    assert.equal(
      createCompletedBookShareData("not a url").url,
      DEFAULT_MARKETING_URL,
    );
  });
});