import { describe, expect, it } from "vitest";
import { userSelectOptionsForMember, type MinistryMemberDraft } from "./ministryMemberDraft";

describe("userSelectOptionsForMember", () => {
  const member: MinistryMemberDraft = {
    userId: "user-1",
    memberRole: "primary",
    displayName: "Jane Doe",
    email: "jane@example.com",
    contactEmail: "jane@example.com",
  };

  it("keeps the current steward visible before the user list loads", () => {
    const options = userSelectOptionsForMember(member, [], new Set(["user-1"]), "Select user");
    expect(options).toEqual([
      { value: "", label: "Select user" },
      { value: "user-1", label: "Jane Doe (jane@example.com)" },
    ]);
  });

  it("keeps the current steward visible when they are missing from the user list", () => {
    const options = userSelectOptionsForMember(
      member,
      [{ id: "other", label: "Other (other@example.com)" }],
      new Set(["user-1", "other"]),
      "Select user"
    );
    expect(options.map((option) => option.value)).toEqual(["", "user-1"]);
    expect(options[1]?.label).toBe("Jane Doe (jane@example.com)");
  });
});
